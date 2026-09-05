import { AuditLog } from '../models/AuditLog.js';

export async function logAudit({ actorId, action, entityType, entityId, before = null, after = null }) {
  try {
    const log = new AuditLog({
      actorId,
      action,
      entityType,
      entityId: String(entityId),
      before,
      after,
      timestamp: new Date(),
    });
    await log.save();
    return log;
  } catch (error) {
    console.error('[AuditService] Failed to record audit log:', error);
    // Audit log errors should not crash main transactions in non-critical paths
    return null;
  }
}
