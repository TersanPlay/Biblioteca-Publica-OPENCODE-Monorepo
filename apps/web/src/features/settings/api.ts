import { api } from '../../services/api-client';
import type { LibrarySettings } from '@library/shared';

export const settingsApi = {
  get: () => api.get<LibrarySettings>('/settings').then((r) => r.data),
  update: (v: Partial<LibrarySettings>) =>
    api.put<LibrarySettings>('/settings', v).then((r) => r.data),
};
