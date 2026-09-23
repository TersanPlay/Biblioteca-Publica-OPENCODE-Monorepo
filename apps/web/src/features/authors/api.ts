import { api } from '../../services/api-client';
import type { Author, Paginated } from '@library/shared';
import { cleanPayload, type Params } from '../http';

export const authorsApi = {
  list: (params?: Params) => api.get<Paginated<Author>>('/authors', { params }).then((r) => r.data),
  all: () => api.get<Paginated<Author>>('/authors?all=1').then((r) => r.data.items),
  get: (id: number) => api.get<Author>(`/authors/${id}`).then((r) => r.data),
  create: (v: Partial<Author>) => api.post<Author>('/authors', cleanPayload(v as Record<string, unknown>)).then((r) => r.data),
  update: (id: number, v: Partial<Author>) => api.put<Author>(`/authors/${id}`, cleanPayload(v as Record<string, unknown>)).then((r) => r.data),
  deactivate: (id: number) => api.patch(`/authors/${id}/status`, { isActive: false }).then((r) => r.data),
  reactivate: (id: number) => api.patch(`/authors/${id}/status`, { isActive: true }).then((r) => r.data),
};
