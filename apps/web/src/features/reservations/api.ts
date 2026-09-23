import { api } from '../../services/api-client';
import type { Paginated, Reservation } from '@library/shared';
import type { Params } from '../http';

export const reservationsApi = {
  list: (params?: Params) => api.get<Paginated<Reservation>>('/reservations', { params }).then((r) => r.data),
  create: (v: { readerId: number; bookId: number }) =>
    api.post<Reservation>('/reservations', v).then((r) => r.data),
  cancel: (id: number) => api.post(`/reservations/${id}/cancel`).then((r) => r.data),
  fulfill: (id: number) => api.post(`/reservations/${id}/fulfill`).then((r) => r.data),
};
