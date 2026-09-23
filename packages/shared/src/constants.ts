export const DEFAULT_LOAN_LIMIT = 4;
export const DEFAULT_LOAN_DAYS = 15;
export const DEFAULT_MAX_RENEWALS = 1;
export const MAX_BATCH_BOOKS = 20;
export const RESERVATION_EXPIRY_DAYS = 3;
export const MAX_BACKUPS = 5;
export const BACKUP_CRON_MORNING = '30 18 * * *';
export const BACKUP_CRON_NIGHT = '45 23 * * *';
export const API_BASE_PATH = '/api';
export const TOKEN_STORAGE_KEY = 'livraria_token';

export const ROLES = ['ADMIN', 'ATTENDANT'] as const;
export const READER_STATUSES = ['ACTIVE', 'BLOCKED', 'INACTIVE'] as const;
export const LOAN_STATUSES = ['ACTIVE', 'OVERDUE', 'RETURNED'] as const;
export const RESERVATION_STATUSES = [
  'PENDING',
  'AVAILABLE',
  'FULFILLED',
  'CANCELLED',
  'EXPIRED',
] as const;
export const RETURN_CONDITIONS = ['BOM', 'REGULAR', 'DANIFICADO'] as const;
