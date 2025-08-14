
import { db } from '../db';
import { structuredLogger } from './logger';
import { circuitBreakers } from '../middleware/circuitBreaker';

interface TransactionContext {
  operation: string;
  orderId?: string;
  customerId?: string;
  metadata?: Record<string, any>;
}

export async function withTransaction<T>(
  operation: (tx: typeof db) => Promise<T>,
  context: TransactionContext
): Promise<T> {
  const startTime = Date.now();
  
  try {
    return await circuitBreakers.database.execute(async () => {
      const result = await db.transaction(async (tx) => {
        structuredLogger.info(`Transaction started: ${context.operation}`, {
          operation: context.operation,
          orderId: context.orderId,
          customerId: context.customerId
        });

        const txResult = await operation(tx);

        structuredLogger.info(`Transaction completed: ${context.operation}`, {
          operation: context.operation,
          duration: Date.now() - startTime,
          orderId: context.orderId,
          customerId: context.customerId
        });

        return txResult;
      });

      return result;
    });
  } catch (error) {
    structuredLogger.error(`Transaction failed: ${context.operation}`, {
      error: error as Error,
      severity: 'high',
      operation: context.operation,
      duration: Date.now() - startTime,
      orderId: context.orderId,
      customerId: context.customerId,
      integration: 'database'
    });

    throw error;
  }
}

// Specific transaction helpers for common operations
export async function withOrderTransaction<T>(
  orderId: string,
  operation: (tx: typeof db) => Promise<T>,
  operationName: string
): Promise<T> {
  return withTransaction(operation, {
    operation: `order.${operationName}`,
    orderId,
    metadata: { orderId }
  });
}

export async function withCustomerTransaction<T>(
  customerId: string,
  operation: (tx: typeof db) => Promise<T>,
  operationName: string
): Promise<T> {
  return withTransaction(operation, {
    operation: `customer.${operationName}`,
    customerId,
    metadata: { customerId }
  });
}
