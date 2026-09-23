import { api } from '../../services/api-client';
import type { Backup } from '@library/shared';

export const backupsApi = {
  list: () => api.get<Backup[]>('/backups').then((r) => r.data),
  create: () => api.post<Backup>('/backups').then((r) => r.data),
  restore: (filename: string) => api.post(`/backups/${filename}/restore`).then((r) => r.data),
  remove: (filename: string) => api.delete(`/backups/${filename}`).then((r) => r.data),

  download: async (filename: string) => {
    const res = await api.get(`/backups/${filename}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  restoreUpload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/backups/restore-upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
};
