import { api } from '../../services/api-client';
import type { BlockedReader, Paginated, Reader, ReaderDetail } from '@library/shared';
import { cleanPayload, type Params } from '../http';

export const readersApi = {
  list: (params?: Params) => api.get<Paginated<Reader>>('/readers', { params }).then((r) => r.data),
  get: (id: number) => api.get<ReaderDetail>(`/readers/${id}`).then((r) => r.data),
  create: (v: Record<string, unknown>) =>
    api.post<Reader>('/readers', cleanPayload(v)).then((r) => r.data),
  update: (id: number, v: Record<string, unknown>) =>
    api.put<Reader>(`/readers/${id}`, cleanPayload(v)).then((r) => r.data),
  block: (id: number, reason?: string, category?: string) =>
    api.patch<Reader>(`/readers/${id}/status`, { status: 'BLOCKED', reason, category }).then((r) => r.data),
  unblock: (id: number) =>
    api.patch<Reader>(`/readers/${id}/status`, { status: 'ACTIVE' }).then((r) => r.data),
  unblockBatch: (ids: number[]) =>
    Promise.all(ids.map((id) => api.patch(`/readers/${id}/status`, { status: 'ACTIVE' }))),
  setStatus: (id: number, status: 'ACTIVE' | 'INACTIVE') =>
    api.patch<Reader>(`/readers/${id}/status`, { status }).then((r) => r.data),
  remove: (id: number, reason?: string) =>
    api.delete<{ ok: boolean }>(`/readers/${id}`, { data: { reason } }).then((r) => r.data),
  blocked: (params?: Params) =>
    api.get<Paginated<BlockedReader>>('/readers/blocked', { params }).then((r) => r.data),
  setSignature: (id: number, signature: string) =>
    api.patch<Reader>(`/readers/${id}/signature`, { signature }).then((r) => r.data),
};
