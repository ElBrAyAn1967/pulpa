/**
 * Monitoring and Alerting System for Pulpa NFC Distribution
 *
 * Provides real-time monitoring of system health and automated alerts
 * for critical issues.
 */

import { logger, LogCategory } from '@/lib/logging/logger';
import { ErrorSeverity } from '@/lib/errors/types';

export enum AlertType {
  LOW_BALANCE = 'low_balance',
  FAILED_TRANSACTION = 'failed_transaction',
  HIGH_ERROR_RATE = 'high_error_rate',
  RATE_LIMIT_ABUSE = 'rate_limit_abuse',
  DATABASE_ERROR = 'database_error',
  SYSTEM_ERROR = 'system_error',
}

export interface AlertConfig {
  enabled: boolean;
  threshold?: number;
  cooldown?: number; // Minimum time between alerts (ms)
}

export interface AlertContext {
  type: AlertType;
  severity: ErrorSeverity;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

class MonitoringService {
  private static instance: MonitoringService;
  private alertHistory: Map<AlertType, number> = new Map();
  private errorCounts: Map<string, number> = new Map();
  private lastErrorCheck: number = Date.now();

  // Alert configurations
  private config: Record<AlertType, AlertConfig> = {
    [AlertType.LOW_BALANCE]: {
      enabled: true,
      threshold: 0.01, // 0.01 ETH
      cooldown: 3600000, // 1 hour
    },
    [AlertType.FAILED_TRANSACTION]: {
      enabled: true,
      cooldown: 300000, // 5 minutes
    },
    [AlertType.HIGH_ERROR_RATE]: {
      enabled: true,
      threshold: 10, // 10 errors per minute
      cooldown: 600000, // 10 minutes
    },
    [AlertType.RATE_LIMIT_ABUSE]: {
      enabled: true,
      threshold: 5, // 5 rate limit hits per hour
      cooldown: 1800000, // 30 minutes
    },
    [AlertType.DATABASE_ERROR]: {
      enabled: true,
      cooldown: 300000, // 5 minutes
    },
    [AlertType.SYSTEM_ERROR]: {
      enabled: true,
      cooldown: 300000, // 5 minutes
    },
  };

  private constructor() {
    logger.info(LogCategory.SYSTEM, 'MonitoringService initialized');
    this.startErrorRateMonitoring();
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Check if we should send an alert based on cooldown
   */
  private shouldSendAlert(type: AlertType): boolean {
    const config = this.config[type];

    if (!config.enabled) {
      return false;
    }

    const lastAlert = this.alertHistory.get(type);
    const now = Date.now();

    if (!lastAlert) {
      return true;
    }

    if (config.cooldown && now - lastAlert < config.cooldown) {
      return false;
    }

    return true;
  }

  /**
   * Record that an alert was sent
   */
  private recordAlert(type: AlertType) {
    this.alertHistory.set(type, Date.now());
  }

  /**
   * Send alert through configured channels
   */
  private async sendAlert(context: AlertContext) {
    // Log the alert
    logger.logSecurityEvent(
      `ALERT: ${context.type} - ${context.message}`,
      context.severity === ErrorSeverity.CRITICAL ? 'critical' : 'high',
      context.data
    );

    // In production, integrate with external services:
    // - Email notifications
    // - Slack/Discord webhooks
    // - PagerDuty for critical alerts
    // - SMS for critical alerts

    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Slack
      // await this.sendSlackAlert(context);

      // Example: Send to email
      // await this.sendEmailAlert(context);

      // Example: Send to PagerDuty for critical
      // if (context.severity === ErrorSeverity.CRITICAL) {
      //   await this.sendPagerDutyAlert(context);
      // }
    }

    this.recordAlert(context.type);
  }

  /**
   * Alert: Low minter balance
   */
  public async alertLowBalance(currentBalance: string, minterAddress: string) {
    if (!this.shouldSendAlert(AlertType.LOW_BALANCE)) {
      return;
    }

    const context: AlertContext = {
      type: AlertType.LOW_BALANCE,
      severity: ErrorSeverity.CRITICAL,
      message: `Minter balance critically low: ${currentBalance} ETH`,
      data: {
        currentBalance,
        minterAddress,
        threshold: this.config[AlertType.LOW_BALANCE].threshold,
      },
      timestamp: new Date().toISOString(),
    };

    await this.sendAlert(context);
  }

  /**
   * Alert: Failed transaction
   */
  public async alertFailedTransaction(
    transactionHash: string,
    reason: string,
    context: Record<string, unknown>
  ) {
    if (!this.shouldSendAlert(AlertType.FAILED_TRANSACTION)) {
      return;
    }

    const alertContext: AlertContext = {
      type: AlertType.FAILED_TRANSACTION,
      severity: ErrorSeverity.HIGH,
      message: `Transaction failed: ${reason}`,
      data: {
        transactionHash,
        reason,
        ...context,
      },
      timestamp: new Date().toISOString(),
    };

    await this.sendAlert(alertContext);
  }

  /**
   * Alert: High error rate detected
   */
  public async alertHighErrorRate(errorCount: number, timeWindow: string) {
    if (!this.shouldSendAlert(AlertType.HIGH_ERROR_RATE)) {
      return;
    }

    const context: AlertContext = {
      type: AlertType.HIGH_ERROR_RATE,
      severity: ErrorSeverity.HIGH,
      message: `High error rate detected: ${errorCount} errors in ${timeWindow}`,
      data: {
        errorCount,
        timeWindow,
        threshold: this.config[AlertType.HIGH_ERROR_RATE].threshold,
      },
      timestamp: new Date().toISOString(),
    };

    await this.sendAlert(context);
  }

  /**
   * Alert: Rate limit abuse detected
   */
  public async alertRateLimitAbuse(nfcId: string, hitCount: number) {
    if (!this.shouldSendAlert(AlertType.RATE_LIMIT_ABUSE)) {
      return;
    }

    const context: AlertContext = {
      type: AlertType.RATE_LIMIT_ABUSE,
      severity: ErrorSeverity.MEDIUM,
      message: `Potential rate limit abuse detected for NFC: ${nfcId}`,
      data: {
        nfcId,
        hitCount,
        threshold: this.config[AlertType.RATE_LIMIT_ABUSE].threshold,
      },
      timestamp: new Date().toISOString(),
    };

    await this.sendAlert(context);
  }

  /**
   * Alert: Database connection or query error
   */
  public async alertDatabaseError(error: string, query?: string) {
    if (!this.shouldSendAlert(AlertType.DATABASE_ERROR)) {
      return;
    }

    const context: AlertContext = {
      type: AlertType.DATABASE_ERROR,
      severity: ErrorSeverity.CRITICAL,
      message: `Database error: ${error}`,
      data: {
        error,
        query: query ? query.substring(0, 200) : undefined, // Truncate long queries
      },
      timestamp: new Date().toISOString(),
    };

    await this.sendAlert(context);
  }

  /**
   * Alert: System-level error
   */
  public async alertSystemError(error: string, component: string) {
    if (!this.shouldSendAlert(AlertType.SYSTEM_ERROR)) {
      return;
    }

    const context: AlertContext = {
      type: AlertType.SYSTEM_ERROR,
      severity: ErrorSeverity.CRITICAL,
      message: `System error in ${component}: ${error}`,
      data: {
        error,
        component,
      },
      timestamp: new Date().toISOString(),
    };

    await this.sendAlert(context);
  }

  /**
   * Track error for rate monitoring
   */
  public trackError(errorCode: string) {
    const minute = Math.floor(Date.now() / 60000).toString();
    const key = `${minute}:${errorCode}`;
    const count = this.errorCounts.get(key) || 0;
    this.errorCounts.set(key, count + 1);
  }

  /**
   * Start monitoring error rates
   */
  private startErrorRateMonitoring() {
    // Check error rate every minute
    setInterval(() => {
      const now = Date.now();
      const currentMinute = Math.floor(now / 60000).toString();

      let totalErrors = 0;
      this.errorCounts.forEach((count, key) => {
        const [minute] = key.split(':');
        if (minute === currentMinute) {
          totalErrors += count;
        }
      });

      const threshold = this.config[AlertType.HIGH_ERROR_RATE].threshold || 10;
      if (totalErrors >= threshold) {
        this.alertHighErrorRate(totalErrors, 'last minute');
      }

      // Clean up old error counts (older than 5 minutes)
      const fiveMinutesAgo = Math.floor((now - 300000) / 60000).toString();
      this.errorCounts.forEach((_, key) => {
        const [minute] = key.split(':');
        if (parseInt(minute) < parseInt(fiveMinutesAgo)) {
          this.errorCounts.delete(key);
        }
      });
    }, 60000); // Run every minute
  }

  /**
   * Get system health status
   */
  public getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'critical';
    checks: Record<string, boolean>;
    alerts: Array<{ type: AlertType; lastTriggered: number }>;
  } {
    const recentAlerts: Array<{ type: AlertType; lastTriggered: number }> = [];

    this.alertHistory.forEach((timestamp, type) => {
      const age = Date.now() - timestamp;
      if (age < 3600000) {
        // Last hour
        recentAlerts.push({ type, lastTriggered: timestamp });
      }
    });

    const criticalAlerts = recentAlerts.filter(
      (a) =>
        a.type === AlertType.LOW_BALANCE ||
        a.type === AlertType.DATABASE_ERROR ||
        a.type === AlertType.SYSTEM_ERROR
    );

    const status = criticalAlerts.length > 0
      ? 'critical'
      : recentAlerts.length > 3
      ? 'degraded'
      : 'healthy';

    return {
      status,
      checks: {
        lowBalanceCheck: !this.alertHistory.has(AlertType.LOW_BALANCE),
        databaseCheck: !this.alertHistory.has(AlertType.DATABASE_ERROR),
        errorRateCheck: recentAlerts.length < 5,
      },
      alerts: recentAlerts,
    };
  }
}

// Export singleton instance
export const monitoring = MonitoringService.getInstance();
