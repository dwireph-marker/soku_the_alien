export interface AuditLogItem {
  id: string;
  adminUid: string;
  adminEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  description: string;
  timestamp: string;
}
