import api from './axios';

export const getClinicSettings = async () => {
  return api.get('/api/admin/clinic/settings');
};

export const saveClinicSettings = async (data) => {
  return api.post('/api/admin/clinic/settings', data);
};

export const listClinicClosures = async () => {
  return api.get('/api/admin/clinic/closures');
};

export const addClinicClosure = async (data) => {
  return api.post('/api/admin/clinic/closures', data);
};

export const deleteClinicClosure = async (id) => {
  return api.delete(`/api/admin/clinic/closures/${id}`);
};

export const getClinicMeta = async () => {
  return api.get('/api/clinic/meta');
};
