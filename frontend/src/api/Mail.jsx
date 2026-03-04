import api from './axios';

export const getMailSettings = async () => {
  return api.get('/api/admin/mail/settings');
};

export const saveMailSettings = async (data) => {
  return api.post('/api/admin/mail/settings', data);
};
