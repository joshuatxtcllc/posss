@@ .. @@
 import { pgTable, text, integer, decimal, timestamp, boolean, jsonb, uuid, varchar } from "drizzle-orm/pg-core";
 import { createInsertSchema, createSelectSchema } from "drizzle-zod";
 import { z } from "zod";
 
+// Enhanced Customer table with comprehensive tracking
 export const customers = pgTable("customers", {
   id: uuid("id").defaultRandom().primaryKey(),
   name: text("name").notNull(),
   email: text("email"),
   phone: text("phone"),
+  address: text("address"),
+  notes: text("notes"),
+  preferredContact: text("preferred_contact").default("email"), // email, phone, sms
+  totalOrders: integer("total_orders").default(0),
+  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).default("0.00"),
+  lastOrderDate: timestamp("last_order_date"),
+  loyaltyPoints: integer("loyalty_points").default(0),
   createdAt: timestamp("created_at").defaultNow(),
+  updatedAt: timestamp("updated_at").defaultNow(),
 });
 
+// Enhanced Orders table with comprehensive order management
 export const orders = pgTable("orders", {
   id: uuid("id").defaultRandom().primaryKey(),
   customerId: uuid("customer_id").references(() => customers.id),
   orderNumber: text("order_number").notNull().unique(),
+  status: text("status").notNull().default("quote"), // quote, approved, in_production, quality_check, ready, completed, cancelled
+  priority: text("priority").default("standard"), // standard, rush, express
+  
+  // Artwork specifications
+  artworkDescription: text("artwork_description"),
+  imageWidth: decimal("image_width", { precision: 8, scale: 2 }),
+  imageHeight: decimal("image_height", { precision: 8, scale: 2 }),
+  matWidth: decimal("mat_width", { precision: 8, scale: 2 }),
+  matHeight: decimal("mat_height", { precision: 8, scale: 2 }),
+  
+  // Materials
+  frameStyle: text("frame_style"),
+  matType: text("mat_type"),
+  glassType: text("glass_type"),
+  backingType: text("backing_type"),
+  complexity: text("complexity").default("simple"), // simple, medium, complex
+  
+  // Pricing breakdown
+  basePrice: decimal("base_price", { precision: 10, scale: 2 }),
+  framePrice: decimal("frame_price", { precision: 10, scale: 2 }),
+  matPrice: decimal("mat_price", { precision: 10, scale: 2 }),
+  glassPrice: decimal("glass_price", { precision: 10, scale: 2 }),
+  backingPrice: decimal("backing_price", { precision: 10, scale: 2 }),
+  laborPrice: decimal("labor_price", { precision: 10, scale: 2 }),
+  rushFee: decimal("rush_fee", { precision: 10, scale: 2 }).default("0.00"),
+  subtotal: decimal("subtotal", { precision: 10, scale: 2 }),
+  tax: decimal("tax", { precision: 10, scale: 2 }),
   total: decimal("total", { precision: 10, scale: 2 }).notNull(),
-  status: text("status").notNull().default("pending"),
+  
+  // Payment tracking
+  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default("0.00"),
+  paymentStatus: text("payment_status").default("unpaid"), // unpaid, partial, paid, refunded
+  
+  // Dates and tracking
+  estimatedCompletion: timestamp("estimated_completion"),
+  actualCompletion: timestamp("actual_completion"),
+  lastStatusUpdate: timestamp("last_status_update").defaultNow(),
+  
+  // Additional data
+  specialInstructions: text("special_instructions"),
+  internalNotes: text("internal_notes"),
+  imageUrls: jsonb("image_urls").$type<string[]>(),
+  aiRecommendations: jsonb("ai_recommendations"),
+  
   createdAt: timestamp("created_at").defaultNow(),
+  updatedAt: timestamp("updated_at").defaultNow(),
+});
+
+// Payment transactions table
+export const payments = pgTable("payments", {
+  id: uuid("id").defaultRandom().primaryKey(),
+  orderId: uuid("order_id").references(() => orders.id).notNull(),
+  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
+  method: text("method").notNull(), // cash, card, check, venmo, zelle, etc.
+  status: text("status").default("completed"), // pending, completed, failed, refunded
+  transactionId: text("transaction_id"),
+  processorResponse: jsonb("processor_response"),
+  refundedAmount: decimal("refunded_amount", { precision: 10, scale: 2 }).default("0.00"),
+  notes: text("notes"),
+  createdAt: timestamp("created_at").defaultNow(),
+});
+
+// Materials inventory table
+export const materials = pgTable("materials", {
+  id: uuid("id").defaultRandom().primaryKey(),
+  category: text("category").notNull(), // frames, mats, glass, backing, hardware
+  name: text("name").notNull(),
+  sku: text("sku").unique(),
+  supplier: text("supplier"),
+  currentStock: integer("current_stock").default(0),
+  minStock: integer("min_stock").default(5),
+  maxStock: integer("max_stock").default(100),
+  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
+  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
+  unit: text("unit").default("each"), // each, linear_foot, square_foot, etc.
+  specifications: jsonb("specifications"),
+  isActive: boolean("is_active").default(true),
+  lastRestocked: timestamp("last_restocked"),
+  createdAt: timestamp("created_at").defaultNow(),
+  updatedAt: timestamp("updated_at").defaultNow(),
+});
+
+// Order materials junction table
+export const orderMaterials = pgTable("order_materials", {
+  id: uuid("id").defaultRandom().primaryKey(),
+  orderId: uuid("order_id").references(() => orders.id).notNull(),
+  materialId: uuid("material_id").references(() => materials.id).notNull(),
+  quantityNeeded: decimal("quantity_needed", { precision: 10, scale: 3 }).notNull(),
+  quantityUsed: decimal("quantity_used", { precision: 10, scale: 3 }).default("0"),
+  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
+  totalCost: decimal("total_cost", { precision: 10, scale: 2 }),
+  status: text("status").default("needed"), // needed, ordered, received, used
+  notes: text("notes"),
+  createdAt: timestamp("created_at").defaultNow(),
+});
+
+// Notifications table for customer communication
+export const notifications = pgTable("notifications", {
+  id: uuid("id").defaultRandom().primaryKey(),
+  orderId: uuid("order_id").references(() => orders.id),
+  customerId: uuid("customer_id").references(() => customers.id),
+  type: text("type").notNull(), // email, sms, internal
+  subject: text("subject"),
+  message: text("message").notNull(),
+  status: text("status").default("pending"), // pending, sent, failed, delivered
+  sentAt: timestamp("sent_at"),
+  deliveredAt: timestamp("delivered_at"),
+  errorMessage: text("error_message"),
+  metadata: jsonb("metadata"),
+  createdAt: timestamp("created_at").defaultNow(),
+});
+
+// AI analysis results table
+export const aiAnalysis = pgTable("ai_analysis", {
+  id: uuid("id").defaultRandom().primaryKey(),
+  orderId: uuid("order_id").references(() => orders.id).notNull(),
+  imageUrl: text("image_url").notNull(),
+  analysisType: text("analysis_type").notNull(), // style_recommendation, color_analysis, size_detection
+  results: jsonb("results").notNull(),
+  confidence: decimal("confidence", { precision: 5, scale: 4 }),
+  processingTime: integer("processing_time"), // milliseconds
+  modelVersion: text("model_version"),
+  createdAt: timestamp("created_at").defaultNow(),
 });
 
+// Create Zod schemas for validation
 export const insertCustomerSchema = createInsertSchema(customers);
 export const selectCustomerSchema = createSelectSchema(customers);
 export const insertOrderSchema = createInsertSchema(orders);
 export const selectOrderSchema = createSelectSchema(orders);
+export const insertPaymentSchema = createInsertSchema(payments);
+export const selectPaymentSchema = createSelectSchema(payments);
+export const insertMaterialSchema = createInsertSchema(materials);
+export const selectMaterialSchema = createSelectSchema(materials);
+export const insertNotificationSchema = createInsertSchema(notifications);
+export const selectNotificationSchema = createSelectSchema(notifications);
+export const insertAiAnalysisSchema = createInsertSchema(aiAnalysis);
+export const selectAiAnalysisSchema = createSelectSchema(aiAnalysis);
 
 export type Customer = z.infer<typeof selectCustomerSchema>;
 export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
 export type Order = z.infer<typeof selectOrderSchema>;
 export type InsertOrder = z.infer<typeof insertOrderSchema>;
+export type Payment = z.infer<typeof selectPaymentSchema>;
+export type InsertPayment = z.infer<typeof insertPaymentSchema>;
+export type Material = z.infer<typeof selectMaterialSchema>;
+export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
+export type Notification = z.infer<typeof selectNotificationSchema>;
+export type InsertNotification = z.infer<typeof insertNotificationSchema>;
+export type AiAnalysis = z.infer<typeof selectAiAnalysisSchema>;
+export type InsertAiAnalysis = z.infer<typeof insertAiAnalysisSchema>;