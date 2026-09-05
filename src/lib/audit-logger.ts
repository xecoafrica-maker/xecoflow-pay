// src/lib/audit-logger.ts
export interface AuditLogEntry {
  timestamp?: string; // ✅ Made optional - will be auto-generated
  eventType: 'LOGIN_ATTEMPT' | 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'ACCOUNT_LOCKED';
  userId?: string | number;
  email: string;
  ip: string;
  userAgent: string;
  status: 'success' | 'failure' | 'locked';
  reason?: string;
  attempts?: number;
  durationMs?: number;
  correlationId: string;
}

export class AuditLogger {
  private static instance: AuditLogger;

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  async log(entry: AuditLogEntry): Promise<void> {
    const logEntry = {
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString(), // ✅ Auto-generate if missing
    };

    // 1. Console (structured)
    console.log('📋 AUDIT:', JSON.stringify(logEntry));

    // 2. Send to logging service (Sentry/Datadog)
    if (process.env.NODE_ENV === 'production') {
      await this.sendToLoggingService(logEntry);
    }

    // 3. Store in database (optional, for compliance)
    if (process.env.AUDIT_DB_URL) {
      await this.storeInDatabase(logEntry);
    }
  }

  private async sendToLoggingService(entry: AuditLogEntry): Promise<void> {
    // Example: Send to Datadog
    // await fetch('https://api.datadog.com/api/v2/logs', { ... });
  }

  private async storeInDatabase(entry: AuditLogEntry): Promise<void> {
    // Store in database for audit trail
    // Required for PCI DSS compliance
  }
}

export const auditLogger = AuditLogger.getInstance();