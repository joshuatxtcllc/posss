import { createLogger, format, transports } from 'winston';

interface LogContext {
  requestId?: string;
  userId?: string;
  orderId?: string;
  integration?: string;
  operation?: string;
  metadata?: Record<string, any>;
}

interface ErrorLog extends LogContext {
  error: Error | string;
  stack?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    // Add file transports, etc. as needed
  ],
});

export function log(message: string, category?: string) {
  const timestamp = new Date().toISOString();
  const prefix = category ? `[${category}]` : '';
  console.log(`${timestamp} ${prefix} ${message}`);
}

// Enhanced logger with structured methods
class StructuredLogger {
  private winston = logger;

  info(message: string, context?: LogContext) {
    this.winston.info(message, { ...context, timestamp: new Date().toISOString() });
  }

  warn(message: string, context?: LogContext) {
    this.winston.warn(message, { ...context, timestamp: new Date().toISOString() });
  }

  error(message: string, errorLog: ErrorLog) {
    const errorData = {
      message,
      error: errorLog.error instanceof Error ? errorLog.error.message : errorLog.error,
      stack: errorLog.error instanceof Error ? errorLog.error.stack : errorLog.stack,
      severity: errorLog.severity,
      timestamp: new Date().toISOString(),
      ...errorLog
    };

    this.winston.error(errorData);

    // Send critical errors to external monitoring in production
    if (errorLog.severity === 'critical' && process.env.NODE_ENV === 'production') {
      this.sendToCriticalMonitoring(errorData);
    }
  }

  integration(integration: string, operation: string, success: boolean, context?: LogContext) {
    const logData = {
      integration,
      operation,
      success,
      timestamp: new Date().toISOString(),
      ...context
    };

    if (success) {
      this.winston.info(`Integration success: ${integration}.${operation}`, logData);
    } else {
      this.winston.error(`Integration failure: ${integration}.${operation}`, logData);
    }
  }

  private async sendToCriticalMonitoring(errorData: any) {
    try {
      // In production, send to monitoring service
      console.error('CRITICAL ERROR:', JSON.stringify(errorData, null, 2));
    } catch (monitoringError) {
      console.error('Failed to send to monitoring:', monitoringError);
    }
  }
}

export const structuredLogger = new StructuredLogger();
export { logger };