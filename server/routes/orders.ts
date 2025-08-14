@@ .. @@
 import { Router } from "express";
 import { db } from "../db";
-import { orders, customers } from "../../shared/schema";
+import { orders, customers, payments, orderMaterials, materials } from "../../shared/schema";
 import { eq, desc, and, or, like, sql } from "drizzle-orm";
+import { calculateFramingPrice, calculateEstimatedCompletion } from "../../shared/pricing";
+import { aiService } from "../services/aiService";
+import { notificationService } from "../services/notificationService";
+import { withOrderTransaction } from "../utils/transactionHandler";
+import { structuredLogger } from "../utils/logger";
 
 const router = Router();
 
+// Get all orders with enhanced filtering and sorting
 router.get("/", async (req, res) => {
   try {
-    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
-    res.json(allOrders);
+    const { 
+      status, 
+      priority, 
+      paymentStatus, 
+      customerId, 
+      search,
+      sortBy = 'createdAt',
+      sortOrder = 'desc',
+      limit = 50,
+      offset = 0
+    } = req.query;
+
+    let query = db
+      .select({
+        order: orders,
+        customer: customers
+      })
+      .from(orders)
+      .leftJoin(customers, eq(orders.customerId, customers.id));
+
+    // Apply filters
+    const conditions = [];
+    if (status) conditions.push(eq(orders.status, status as string));
+    if (priority) conditions.push(eq(orders.priority, priority as string));
+    if (paymentStatus) conditions.push(eq(orders.paymentStatus, paymentStatus as string));
+    if (customerId) conditions.push(eq(orders.customerId, customerId as string));
+    if (search) {
+      conditions.push(
+        or(
+          like(orders.orderNumber, `%${search}%`),
+          like(orders.artworkDescription, `%${search}%`),
+          like(customers.name, `%${search}%`)
+        )
+      );
+    }
+
+    if (conditions.length > 0) {
+      query = query.where(and(...conditions));
+    }
+
+    // Apply sorting
+    const orderColumn = orders[sortBy as keyof typeof orders] || orders.createdAt;
+    query = sortOrder === 'asc' 
+      ? query.orderBy(orderColumn)
+      : query.orderBy(desc(orderColumn));
+
+    // Apply pagination
+    query = query.limit(parseInt(limit as string)).offset(parseInt(offset as string));
+
+    const results = await query;
+    
+    const formattedOrders = results.map(({ order, customer }) => ({
+      ...order,
+      customer
+    }));
+
+    res.json(formattedOrders);
   } catch (error) {
-    res.status(500).json({ error: "Failed to fetch orders" });
+    structuredLogger.error('Failed to fetch orders', {
+      error: error as Error,
+      severity: 'medium'
+    });
+    res.status(500).json({ error: "Failed to fetch orders" });
   }
 });
 
+// Get single order with full details
+router.get("/:id", async (req, res) => {
+  try {
+    const { id } = req.params;
+    
+    const orderData = await db
+      .select({
+        order: orders,
+        customer: customers
+      })
+      .from(orders)
+      .leftJoin(customers, eq(orders.customerId, customers.id))
+      .where(eq(orders.id, id))
+      .limit(1);
+
+    if (!orderData.length) {
+      return res.status(404).json({ error: "Order not found" });
+    }
+
+    // Get payments for this order
+    const orderPayments = await db
+      .select()
+      .from(payments)
+      .where(eq(payments.orderId, id))
+      .orderBy(desc(payments.createdAt));
+
+    // Get materials for this order
+    const orderMaterialsList = await db
+      .select({
+        orderMaterial: orderMaterials,
+        material: materials
+      })
+      .from(orderMaterials)
+      .leftJoin(materials, eq(orderMaterials.materialId, materials.id))
+      .where(eq(orderMaterials.orderId, id));
+
+    const { order, customer } = orderData[0];
+    
+    res.json({
+      ...order,
+      customer,
+      payments: orderPayments,
+      materials: orderMaterialsList
+    });
+
+  } catch (error) {
+    structuredLogger.error('Failed to fetch order details', {
+      error: error as Error,
+      severity: 'medium',
+      orderId: req.params.id
+    });
+    res.status(500).json({ error: "Failed to fetch order details" });
+  }
+});
+
+// Create new order with pricing calculation
 router.post("/", async (req, res) => {
   try {
-    const { customerId, total, status = "pending" } = req.body;
-    
-    const [newOrder] = await db.insert(orders).values({
-      customerId,
-      total,
-      status,
-      orderNumber: `ORD-${Date.now()}`
-    }).returning();
-    
-    res.json(newOrder);
+    const orderData = req.body;
+    
+    await withOrderTransaction(
+      orderData.customerId || 'new',
+      async (tx) => {
+        // Generate order number
+        const orderNumber = `JF-${Date.now().toString().slice(-8)}`;
+        
+        // Calculate pricing if specifications provided
+        let pricingBreakdown = null;
+        if (orderData.imageWidth && orderData.imageHeight) {
+          pricingBreakdown = calculateFramingPrice({
+            imageWidth: parseFloat(orderData.imageWidth),
+            imageHeight: parseFloat(orderData.imageHeight),
+            matWidth: parseFloat(orderData.matWidth || 0),
+            matHeight: parseFloat(orderData.matHeight || 0),
+            frameStyle: orderData.frameStyle || 'contemporary',
+            matType: orderData.matType,
+            glassType: orderData.glassType || 'regular',
+            backingType: orderData.backingType || 'standard',
+            complexity: orderData.complexity || 'medium',
+            rush: orderData.priority === 'rush' || orderData.priority === 'express'
+          });
+        }
+
+        // Calculate estimated completion
+        const currentWorkload = await tx
+          .select({ count: sql<number>`count(*)` })
+          .from(orders)
+          .where(
+            and(
+              or(
+                eq(orders.status, 'approved'),
+                eq(orders.status, 'in_production'),
+                eq(orders.status, 'quality_check')
+              )
+            )
+          );
+
+        const estimatedCompletion = calculateEstimatedCompletion(
+          currentWorkload[0]?.count || 0,
+          orderData.complexity || 'medium',
+          orderData.priority || 'standard'
+        );
+
+        // Create the order
+        const [newOrder] = await tx.insert(orders).values({
+          customerId: orderData.customerId,
+          orderNumber,
+          status: orderData.status || 'quote',
+          priority: orderData.priority || 'standard',
+          artworkDescription: orderData.artworkDescription,
+          imageWidth: orderData.imageWidth,
+          imageHeight: orderData.imageHeight,
+          matWidth: orderData.matWidth,
+          matHeight: orderData.matHeight,
+          frameStyle: orderData.frameStyle,
+          matType: orderData.matType,
+          glassType: orderData.glassType,
+          backingType: orderData.backingType,
+          complexity: orderData.complexity || 'medium',
+          specialInstructions: orderData.specialInstructions,
+          internalNotes: orderData.internalNotes,
+          imageUrls: orderData.imageUrls || [],
+          estimatedCompletion,
+          // Pricing breakdown
+          basePrice: pricingBreakdown?.breakdown.basePrice.toString(),
+          framePrice: pricingBreakdown?.breakdown.framePrice.toString(),
+          matPrice: pricingBreakdown?.breakdown.matPrice.toString(),
+          glassPrice: pricingBreakdown?.breakdown.glassPrice.toString(),
+          backingPrice: pricingBreakdown?.breakdown.backingPrice.toString(),
+          laborPrice: pricingBreakdown?.breakdown.laborPrice.toString(),
+          rushFee: pricingBreakdown?.breakdown.rushFee.toString(),
+          subtotal: pricingBreakdown?.breakdown.subtotal.toString(),
+          tax: pricingBreakdown?.breakdown.tax.toString(),
+          total: pricingBreakdown?.breakdown.total.toString() || orderData.total,
+          paymentStatus: 'unpaid'
+        }).returning();
+
+        // If images provided, trigger AI analysis
+        if (orderData.imageUrls && orderData.imageUrls.length > 0) {
+          // Run AI analysis asynchronously
+          aiService.analyzeArtworkImage(orderData.imageUrls[0], newOrder.id)
+            .then(recommendations => {
+              aiService.updateOrderWithAIRecommendations(newOrder.id, recommendations);
+            })
+            .catch(error => {
+              structuredLogger.error('AI analysis failed for new order', {
+                error,
+                severity: 'low',
+                orderId: newOrder.id
+              });
+            });
+        }
+
+        // Send order confirmation notification
+        if (newOrder.status !== 'quote') {
+          notificationService.sendOrderNotification(newOrder.id, 'order_created')
+            .catch(error => {
+              structuredLogger.error('Failed to send order confirmation', {
+                error,
+                severity: 'medium',
+                orderId: newOrder.id
+              });
+            });
+        }
+
+        return newOrder;
+      },
+      'create'
+    );
+
+    res.json(newOrder);
   } catch (error) {
+    structuredLogger.error('Failed to create order', {
+      error: error as Error,
+      severity: 'high'
+    });
     res.status(500).json({ error: "Failed to create order" });
   }
 });
 
+// Update order status with notifications
+router.patch("/:id/status", async (req, res) => {
+  try {
+    const { id } = req.params;
+    const { status, notes } = req.body;
+
+    const [updatedOrder] = await db
+      .update(orders)
+      .set({
+        status,
+        lastStatusUpdate: new Date(),
+        internalNotes: notes ? `${new Date().toISOString()}: ${notes}` : undefined,
+        updatedAt: new Date()
+      })
+      .where(eq(orders.id, id))
+      .returning();
+
+    if (!updatedOrder) {
+      return res.status(404).json({ error: "Order not found" });
+    }
+
+    // Send status update notification
+    const templateName = status === 'ready' ? 'ready_for_pickup' : 'status_update';
+    notificationService.sendOrderNotification(id, templateName)
+      .catch(error => {
+        structuredLogger.error('Failed to send status update notification', {
+          error,
+          severity: 'medium',
+          orderId: id
+        });
+      });
+
+    res.json(updatedOrder);
+  } catch (error) {
+    structuredLogger.error('Failed to update order status', {
+      error: error as Error,
+      severity: 'medium',
+      orderId: req.params.id
+    });
+    res.status(500).json({ error: "Failed to update order status" });
+  }
+});
+
+// Process payment for order
+router.post("/:id/payments", async (req, res) => {
+  try {
+    const { id } = req.params;
+    const { amount, method, transactionId, notes } = req.body;
+
+    await withOrderTransaction(id, async (tx) => {
+      // Get current order
+      const [order] = await tx
+        .select()
+        .from(orders)
+        .where(eq(orders.id, id))
+        .limit(1);
+
+      if (!order) {
+        throw new Error('Order not found');
+      }
+
+      // Create payment record
+      const [payment] = await tx.insert(payments).values({
+        orderId: id,
+        amount: amount.toString(),
+        method,
+        transactionId,
+        notes,
+        status: 'completed'
+      }).returning();
+
+      // Update order payment status
+      const currentPaid = parseFloat(order.amountPaid || '0');
+      const newAmountPaid = currentPaid + parseFloat(amount);
+      const orderTotal = parseFloat(order.total);
+      
+      let paymentStatus = 'partial';
+      if (newAmountPaid >= orderTotal) {
+        paymentStatus = 'paid';
+      } else if (newAmountPaid <= 0) {
+        paymentStatus = 'unpaid';
+      }
+
+      await tx
+        .update(orders)
+        .set({
+          amountPaid: newAmountPaid.toString(),
+          paymentStatus,
+          updatedAt: new Date()
+        })
+        .where(eq(orders.id, id));
+
+      return payment;
+    }, 'payment');
+
+    res.json({ success: true, payment });
+  } catch (error) {
+    structuredLogger.error('Failed to process payment', {
+      error: error as Error,
+      severity: 'high',
+      orderId: req.params.id
+    });
+    res.status(500).json({ error: "Failed to process payment" });
+  }
+});
+
+// Get order analytics
+router.get("/analytics/dashboard", async (req, res) => {
+  try {
+    const { timeframe = '30' } = req.query;
+    const days = parseInt(timeframe as string);
+    const startDate = new Date();
+    startDate.setDate(startDate.getDate() - days);
+
+    // Get various metrics
+    const [
+      totalOrders,
+      totalRevenue,
+      statusBreakdown,
+      paymentBreakdown,
+      recentOrders
+    ] = await Promise.all([
+      // Total orders in timeframe
+      db
+        .select({ count: sql<number>`count(*)` })
+        .from(orders)
+        .where(sql`created_at >= ${startDate}`),
+      
+      // Total revenue
+      db
+        .select({ 
+          total: sql<number>`sum(cast(amount_paid as decimal))` 
+        })
+        .from(orders)
+        .where(sql`created_at >= ${startDate}`),
+      
+      // Status breakdown
+      db
+        .select({
+          status: orders.status,
+          count: sql<number>`count(*)`
+        })
+        .from(orders)
+        .where(sql`created_at >= ${startDate}`)
+        .groupBy(orders.status),
+      
+      // Payment status breakdown
+      db
+        .select({
+          paymentStatus: orders.paymentStatus,
+          count: sql<number>`count(*)`
+        })
+        .from(orders)
+        .where(sql`created_at >= ${startDate}`)
+        .groupBy(orders.paymentStatus),
+      
+      // Recent orders
+      db
+        .select({
+          order: orders,
+          customer: customers
+        })
+        .from(orders)
+        .leftJoin(customers, eq(orders.customerId, customers.id))
+        .orderBy(desc(orders.createdAt))
+        .limit(10)
+    ]);
+
+    res.json({
+      totalOrders: totalOrders[0]?.count || 0,
+      totalRevenue: totalRevenue[0]?.total || 0,
+      statusBreakdown,
+      paymentBreakdown,
+      recentOrders: recentOrders.map(({ order, customer }) => ({
+        ...order,
+        customer
+      }))
+    });
+
+  } catch (error) {
+    structuredLogger.error('Failed to fetch analytics', {
+      error: error as Error,
+      severity: 'medium'
+    });
+    res.status(500).json({ error: "Failed to fetch analytics" });
+  }
+});
+
 export default router;