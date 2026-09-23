import { api } from '../../services/api-client';
import type { DashboardData } from '@library/shared';

export const dashboardApi = {
  get: () => api.get<DashboardData>('/dashboard').then((r) => r.data),
};
