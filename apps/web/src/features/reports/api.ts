import { api } from '../../services/api-client';
import type { ReportResult, ReportType } from '@library/shared';
import type { Params } from '../http';

export const reportsApi = {
  generate: (type: ReportType, params?: Params) =>
    api.get<ReportResult>('/reports', { params: { type, ...params } }).then((r) => r.data),
};
