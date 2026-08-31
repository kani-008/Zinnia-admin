export type AdminRole = 
  | 'SUPER_ADMIN' 
  | 'TREASURER'
  | 'EVENT_ADMIN' 
  | 'EVENT_COORDINATOR'
  | 'ENTRY_STAFF' 
  | 'GATE_ADMIN'
  | 'FOOD_STAFF' 
  | 'FOOD_ADMIN'
  | 'CERTIFICATE_ADMIN';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  allowed_events?: string[];
  avatar?: string;
}

export interface QRScanPayload {
  v: number;
  agent_id: string;
  token: string;
  ts: number;
}
