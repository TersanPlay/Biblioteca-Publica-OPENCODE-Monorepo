import { api } from '../../services/api-client';
import type { AuditLog, Paginated } from '@library/shared';
import type { Params } from '../http';

export const auditApi = {
  list: (params?: Params) => api.get<Paginated<AuditLog>>('/audit', { params }).then((r) => r.data),
};
