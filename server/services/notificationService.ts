/**
 * Notification Service for Customer Communication
 * Handles email, SMS, and internal notifications
 */

import sgMail from '@sendgrid/mail';
import twilio from 'twilio';
import { db } from '../db';
import { notifications, customers, orders } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { structuredLogger } from '../utils/logger';

// Initialize services
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

export interface NotificationTemplate {
  subject: string;
  emailBody: string;
  smsBody: string;
}

export class NotificationService {
  private templates: Record<string, NotificationTemplate> = {
    order_created: {
      subject: "Order Confirmation - Jay's Frames",
      emailBody: `Dear {{customerName}},

Thank you for choosing Jay's Frames! Your order has been received and is being processed.

Order Details:
- Order Number: {{orderNumber}}
- Artwork: {{artworkDescription}}
- Total: ${{total}}
- Estimated Completion: {{estimatedCompletion}}

We'll keep you updated on your order's progress. If you have any questions, please don't hesitate to contact us.

Best regards,
Jay's Frames Team`,
      smsBody: "Jay's Frames: Order {{orderNumber}} received! Est. completion: {{estimatedCompletion}}. Total: ${{total}}. We'll update you on progress."
    },

    status_update: {
      subject: "Order Update - {{orderNumber}}",
      emailBody: `Dear {{customerName}},

Your order {{orderNumber}} status has been updated to: {{newStatus}}

{{#if statusMessage}}
{{statusMessage}}
{{/if}}

Current estimated completion: {{estimatedCompletion}}

Thank you for your patience!

Best regards,
Jay's Frames Team`,
      smsBody: "Jay's Frames: Order {{orderNumber}} is now {{newStatus}}. Est. completion: {{estimatedCompletion}}"
    },

    ready_for_pickup: {
      subject: "Your Order is Ready! - {{orderNumber}}",
      emailBody: `Dear {{customerName}},

Great news! Your framed artwork is ready for pickup.

Order Number: {{orderNumber}}
Artwork: {{artworkDescription}}
Total: ${{total}}
{{#if balanceDue}}
Balance Due: ${{balanceDue}}
{{/if}}

Pickup Hours:
Monday-Friday: 9 AM - 6 PM
Saturday: 10 AM - 4 PM
Sunday: Closed

Please bring this email or your order number when picking up.

Best regards,
Jay's Frames Team`,
      smsBody: "Jay's Frames: Order {{orderNumber}} ready for pickup! {{#if balanceDue}}Balance due: ${{balanceDue}}{{/if}} Hours: M-F 9-6, Sat 10-4"
    },

    payment_reminder: {
      subject: "Payment Reminder - {{orderNumber}}",
      emailBody: `Dear {{customerName}},

This is a friendly reminder that your order {{orderNumber}} has an outstanding balance.

Order Total: ${{total}}
Amount Paid: ${{amountPaid}}
Balance Due: ${{balanceDue}}

Please contact us to arrange payment or visit our shop during business hours.

Thank you!

Jay's Frames Team`,
      smsBody: "Jay's Frames: Payment reminder for order {{orderNumber}}. Balance due: ${{balanceDue}}. Please contact us to arrange payment."
    }
  };

  async sendOrderNotification(
    orderId: string,
    templateName: string,
    additionalData: Record<string, any> = {}
  ): Promise<boolean> {
    try {
      // Get order and customer data
      const orderData = await db
        .select()
        .from(orders)
        .leftJoin(customers, eq(orders.customerId, customers.id))
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!orderData.length) {
        throw new Error(`Order ${orderId} not found`);
      }

      const { orders: order, customers: customer } = orderData[0];
      if (!customer) {
        throw new Error(`Customer not found for order ${orderId}`);
      }

      const template = this.templates[templateName];
      if (!template) {
        throw new Error(`Template ${templateName} not found`);
      }

      // Prepare template data
      const templateData = {
        customerName: customer.name,
        orderNumber: order.orderNumber,
        artworkDescription: order.artworkDescription || 'Custom artwork',
        total: order.total,
        amountPaid: order.amountPaid || '0.00',
        balanceDue: (parseFloat(order.total) - parseFloat(order.amountPaid || '0')).toFixed(2),
        estimatedCompletion: order.estimatedCompletion 
          ? new Date(order.estimatedCompletion).toLocaleDateString()
          : 'TBD',
        newStatus: this.formatStatus(order.status),
        ...additionalData
      };

      // Send email if customer has email
      let emailSent = false;
      if (customer.email) {
        emailSent = await this.sendEmail(
          customer.email,
          this.replaceTemplateVars(template.subject, templateData),
          this.replaceTemplateVars(template.emailBody, templateData),
          orderId
        );
      }

      // Send SMS if customer has phone and prefers SMS
      let smsSent = false;
      if (customer.phone && (customer.preferredContact === 'sms' || !customer.email)) {
        smsSent = await this.sendSMS(
          customer.phone,
          this.replaceTemplateVars(template.smsBody, templateData),
          orderId
        );
      }

      structuredLogger.info('Order notification sent', {
        orderId,
        customerId: customer.id,
        templateName,
        emailSent,
        smsSent
      });

      return emailSent || smsSent;

    } catch (error) {
      structuredLogger.error('Failed to send order notification', {
        error: error as Error,
        severity: 'high',
        orderId,
        templateName
      });
      return false;
    }
  }

  private async sendEmail(
    to: string,
    subject: string,
    body: string,
    orderId?: string
  ): Promise<boolean> {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        structuredLogger.warn('SendGrid not configured, skipping email');
        return false;
      }

      const msg = {
        to,
        from: process.env.FROM_EMAIL || 'noreply@jaysframes.com',
        subject,
        text: body,
        html: body.replace(/\n/g, '<br>'),
      };

      await sgMail.send(msg);

      // Log notification
      await db.insert(notifications).values({
        orderId,
        type: 'email',
        subject,
        message: body,
        status: 'sent',
        sentAt: new Date()
      });

      return true;

    } catch (error) {
      structuredLogger.error('Email sending failed', {
        error: error as Error,
        severity: 'medium',
        to,
        orderId,
        integration: 'sendgrid'
      });

      // Log failed notification
      if (orderId) {
        await db.insert(notifications).values({
          orderId,
          type: 'email',
          subject,
          message: body,
          status: 'failed',
          errorMessage: (error as Error).message
        });
      }

      return false;
    }
  }

  private async sendSMS(
    to: string,
    message: string,
    orderId?: string
  ): Promise<boolean> {
    try {
      if (!twilioClient) {
        structuredLogger.warn('Twilio not configured, skipping SMS');
        return false;
      }

      await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to
      });

      // Log notification
      await db.insert(notifications).values({
        orderId,
        type: 'sms',
        message,
        status: 'sent',
        sentAt: new Date()
      });

      return true;

    } catch (error) {
      structuredLogger.error('SMS sending failed', {
        error: error as Error,
        severity: 'medium',
        to,
        orderId,
        integration: 'twilio'
      });

      // Log failed notification
      if (orderId) {
        await db.insert(notifications).values({
          orderId,
          type: 'sms',
          message,
          status: 'failed',
          errorMessage: (error as Error).message
        });
      }

      return false;
    }
  }

  private replaceTemplateVars(template: string, data: Record<string, any>): string {
    let result = template;
    
    // Simple variable replacement
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, data[key]?.toString() || '');
    });

    // Handle conditional blocks (basic implementation)
    result = result.replace(/{{#if\s+(\w+)}}(.*?){{\/if}}/gs, (match, condition, content) => {
      return data[condition] ? content : '';
    });

    return result;
  }

  private formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      quote: 'Quote Prepared',
      approved: 'Order Approved',
      in_production: 'In Production',
      quality_check: 'Quality Check',
      ready: 'Ready for Pickup',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };

    return statusMap[status] || status;
  }

  async sendBulkStatusUpdates(orderIds: string[], newStatus: string): Promise<void> {
    const promises = orderIds.map(orderId => 
      this.sendOrderNotification(orderId, 'status_update', { newStatus })
    );

    await Promise.allSettled(promises);
  }

  async sendPaymentReminders(): Promise<void> {
    try {
      // Find orders with outstanding balances
      const overdueOrders = await db
        .select()
        .from(orders)
        .leftJoin(customers, eq(orders.customerId, customers.id))
        .where(
          and(
            eq(orders.paymentStatus, 'partial'),
            // Add date condition for orders older than X days
          )
        );

      const promises = overdueOrders.map(({ orders: order }) => 
        this.sendOrderNotification(order.id, 'payment_reminder')
      );

      await Promise.allSettled(promises);

      structuredLogger.info('Payment reminders sent', { 
        count: overdueOrders.length 
      });

    } catch (error) {
      structuredLogger.error('Failed to send payment reminders', {
        error: error as Error,
        severity: 'medium'
      });
    }
  }
}

export const notificationService = new NotificationService();