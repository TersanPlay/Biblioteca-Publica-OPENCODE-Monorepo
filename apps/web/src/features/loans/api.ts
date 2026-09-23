import { api } from '../../services/api-client';
import type { Loan, Paginated } from '@library/shared';
import type { Params } from '../http';

export const loansApi = {
  list: (params?: Params) => api.get<Paginated<Loan>>('/loans', { params }).then((r) => r.data),
  create: (v: { readerId: number; bookId: number; notes?: string; dueDate?: string }) =>
    api.post<Loan>('/loans', v).then((r) => r.data),
  createBatch: (v: { readerId: number; bookIds: number[]; notes?: string; dueDate?: string }) =>
    api.post<{ items: Loan[]; count: number }>('/loans/batch', v).then((r) => r.data),
  return: (id: number, data?: { condition?: string; observations?: string }) =>
    api.post<Loan>(`/loans/${id}/return`, data).then((r) => r.data),
  renew: (id: number) => api.post<Loan>(`/loans/${id}/renew`).then((r) => r.data),
  search: (query: string) =>
    api.get<{ items: Loan[] }>('/loans/search', { params: { q: query } }).then((r) => r.data.items),

  getTerm: async (id: number): Promise<Blob> => {
    const res = await api.get(`/loans/${id}/term`, { responseType: 'blob' });
    return res.data as Blob;
  },
  getReturnTerm: async (id: number): Promise<Blob> => {
    const res = await api.get(`/loans/${id}/return-term`, { responseType: 'blob' });
    return res.data as Blob;
  },
  openTerm: async (id: number) => {
    const blob = await loansApi.getTerm(id);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },
  openReturnTerm: async (id: number) => {
    const blob = await loansApi.getReturnTerm(id);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },
};
