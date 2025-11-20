/**
 * Structured Logging System for Pulpa NFC Distribution
 *
 * Provides JSON-formatted logs with context, performance metrics,
 * and integration with monitoring services.
 */

import { PulpaError, ErrorSeverity } from '@/lib/errors/types';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum LogCategory {
  DISTRIBUTION = 'distribution',
  BLOCKCHAIN = 'blockchain',
  DATABASE = 'database',
  SECURITY = 'security',
  API = 'api',
  SYSTEM = 'system',
  PERFORMANCE = 'performance',
}

export interface LogContext {
  nfcId?: string;
  ambassadorAddress?: string;
  recipientAddress?: string;
  transactionHash?: string;
  distributionId?: string;
  userId?: string;
  endpoint?: string;
  method?: string;
  duration?: number;
  statusCode?: number;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  context?: LogContext;
  error?: {
    code?: string;
    message: string;
    stack?: string;
    severity?: ErrorSeverity;
  };
  performance?: {
    duration: number;
    memory?: number;
  };
  environment: string;
}

class Logger {
  private static instance: Logger;
  private readonly isDevelopment: boolean;
  private readonly isProduction: boolean;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private createLogEntry(
    level: LogLevel,
    category: LogCategory,
    message: string,
    context?: LogContext,
    error?: Error | PulpaError
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      context,
      environment: process.env.NODE_ENV || 'development',
    };

    if (error) {
      if (error instanceof PulpaError) {
        entry.error = {
          code: error.code,
          message: error.message,
          stack: this.isProduction ? undefined : error.stack,
          severity: error.severity,
        };
        entry.context = {
          ...entry.context,
          ...error.context,
        };
      } else {
        entry.error = {
          message: error.message,
          stack: this.isProduction ? undefined : error.stack,
        };
      }
    }

    return entry;
  }

  private formatConsoleOutput(entry: LogEntry): string {
    if (this.isDevelopment) {
      // Pretty print in development
      const emoji = this.getLevelEmoji(entry.level);
      const categoryEmoji = this.getCategoryEmoji(entry.category);
      return `${emoji} ${categoryEmoji} [${entry.category.toUpperCase()}] ${entry.message}${
        entry.context ? '\n  Context: ' + JSON.stringify(entry.context, null, 2) : ''
      }${entry.error ? '\n  Error: ' + entry.error.message : ''}`;
    } else {
      // JSON in production for log aggregation
      return JSON.stringify(entry);
    }
  }

  private getLevelEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '🔍';
      case LogLevel.INFO:
        return 'ℹ️';
      case LogLevel.WARN:
        return '⚠️';
      case LogLevel.ERROR:
        return '❌';
      case LogLevel.CRITICAL:
        return '🚨';
      default:
        return '📝';
    }
  }

  private getCategoryEmoji(category: LogCategory): string {
    switch (category) {
      case LogCategory.DISTRIBUTION:
        return '📦';
      case LogCategory.BLOCKCHAIN:
        return '⛓️';
      case LogCategory.DATABASE:
        return '💾';
      case LogCategory.SECURITY:
        return '🔒';
      case LogCategory.API:
        return '🌐';
      case LogCategory.SYSTEM:
        return '⚙️';
      case LogCategory.PERFORMANCE:
        return '⚡';
      default:
        return '📋';
    }
  }

  private output(entry: LogEntry) {
    const output = this.formatConsoleOutput(entry);

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(output);
        break;
      case LogLevel.INFO:
        console.info(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(output);
        break;
    }

    // In production, send to external monitoring service
    if (this.isProduction) {
      this.sendToMonitoring(entry);
    }
  }

  private sendToMonitoring(entry: LogEntry) {
    // TODO: Integrate with monitoring service (Sentry, DataDog, etc.)
    // For now, just ensure it's logged as JSON
    if (entry.level === LogLevel.ERROR || entry.level === LogLevel.CRITICAL) {
      // In real implementation, send to Sentry or similar
      // Example: Sentry.captureException(entry.error, { contexts: { pulpa: entry.context } });
    }
  }

  // Public logging methods
  public debug(category: LogCategory, message: string, context?: LogContext) {
    const entry = this.createLogEntry(LogLevel.DEBUG, category, message, context);
    this.output(entry);
  }

  public info(category: LogCategory, message: string, context?: LogContext) {
    const entry = this.createLogEntry(LogLevel.INFO, category, message, context);
    this.output(entry);
  }

  public warn(category: LogCategory, message: string, context?: LogContext) {
    const entry = this.createLogEntry(LogLevel.WARN, category, message, context);
    this.output(entry);
  }

  public error(
    category: LogCategory,
    message: string,
    error?: Error | PulpaError,
    context?: LogContext
  ) {
    const entry = this.createLogEntry(LogLevel.ERROR, category, message, context, error);
    this.output(entry);
  }

  public critical(
    category: LogCategory,
    message: string,
    error?: Error | PulpaError,
    context?: LogContext
  ) {
    const entry = this.createLogEntry(LogLevel.CRITICAL, category, message, context, error);
    this.output(entry);
  }

  // Specialized logging methods
  public logDistribution(
    message: string,
    context: {
      nfcId: string;
      ambassadorAddress: string;
      recipientAddress: string;
      transactionHash?: string;
      distributionId?: string;
      status: 'pending' | 'success' | 'failed';
    }
  ) {
    const level = context.status === 'failed' ? LogLevel.ERROR : LogLevel.INFO;
    const entry = this.createLogEntry(level, LogCategory.DISTRIBUTION, message, context);
    this.output(entry);
  }

  public logTransaction(
    message: string,
    context: {
      transactionHash: string;
      from: string;
      to: string;
      amount?: string;
      gasUsed?: string;
      status: 'pending' | 'success' | 'failed';
    }
  ) {
    const level = context.status === 'failed' ? LogLevel.ERROR : LogLevel.INFO;
    const entry = this.createLogEntry(level, LogCategory.BLOCKCHAIN, message, context);
    this.output(entry);
  }

  public logPerformance(
    message: string,
    duration: number,
    context?: LogContext
  ) {
    const entry = this.createLogEntry(LogLevel.INFO, LogCategory.PERFORMANCE, message, {
      ...context,
      duration,
    });

    entry.performance = {
      duration,
      memory: this.isDevelopment ? process.memoryUsage().heapUsed / 1024 / 1024 : undefined,
    };

    this.output(entry);

    // Warn if operation took too long
    if (duration > 5000) {
      this.warn(
        LogCategory.PERFORMANCE,
        `Slow operation detected: ${message} took ${duration}ms`,
        context
      );
    }
  }

  public logApiRequest(
    method: string,
    endpoint: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ) {
    const level = statusCode >= 500 ? LogLevel.ERROR : statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    const entry = this.createLogEntry(level, LogCategory.API, `${method} ${endpoint}`, {
      ...context,
      method,
      endpoint,
      statusCode,
      duration,
    });

    entry.performance = { duration };
    this.output(entry);
  }

  public logSecurityEvent(
    message: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    context?: LogContext
  ) {
    const levelMap = {
      low: LogLevel.INFO,
      medium: LogLevel.WARN,
      high: LogLevel.ERROR,
      critical: LogLevel.CRITICAL,
    };

    const entry = this.createLogEntry(levelMap[severity], LogCategory.SECURITY, message, {
      ...context,
      securitySeverity: severity,
    });

    this.output(entry);
  }

  // Performance measurement helper
  public measurePerformance<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const startTime = Date.now();

    return fn()
      .then((result) => {
        const duration = Date.now() - startTime;
        this.logPerformance(`${operation} completed`, duration, context);
        return result;
      })
      .catch((error) => {
        const duration = Date.now() - startTime;
        this.error(
          LogCategory.PERFORMANCE,
          `${operation} failed after ${duration}ms`,
          error,
          context
        );
        throw error;
      });
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export helper for creating child loggers with context
export function createContextLogger(baseContext: LogContext) {
  return {
    debug: (category: LogCategory, message: string, additionalContext?: LogContext) =>
      logger.debug(category, message, { ...baseContext, ...additionalContext }),
    info: (category: LogCategory, message: string, additionalContext?: LogContext) =>
      logger.info(category, message, { ...baseContext, ...additionalContext }),
    warn: (category: LogCategory, message: string, additionalContext?: LogContext) =>
      logger.warn(category, message, { ...baseContext, ...additionalContext }),
    error: (
      category: LogCategory,
      message: string,
      error?: Error | PulpaError,
      additionalContext?: LogContext
    ) => logger.error(category, message, error, { ...baseContext, ...additionalContext }),
    critical: (
      category: LogCategory,
      message: string,
      error?: Error | PulpaError,
      additionalContext?: LogContext
    ) => logger.critical(category, message, error, { ...baseContext, ...additionalContext }),
  };
}
