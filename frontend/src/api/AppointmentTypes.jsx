import api from './axios';

export const listAppointmentTypes = async (params = {}) => {
  return api.get('/api/admin/appointment-types', { params });
};

export const addAppointmentType = async (data) => {
  return api.post('/api/admin/appointment-types', data);
};

export const updateAppointmentType = async (id, data) => {
  return api.patch(`/api/admin/appointment-types/${id}`, data);
};

export const deleteAppointmentType = async (id) => {
  return api.delete(`/api/admin/appointment-types/${id}`);
};
