import api from './axios';

// Keep backward compat but rename for types
export const listMedcertTypes = async () => {
  return api.get('/api/admin/medcert/types');
};

export const addMedcertType = async (data) => {
  return api.post('/api/admin/medcert/types', data);
};

export const deleteMedcertType = async (id) => {
  return api.delete(`/api/admin/medcert/types/${id}`);
};

export const updateMedcertType = async (id, data) => {
  return api.patch(`/api/admin/medcert/types/${id}`, data);
};

// Backward compat
export const listMedcertReasons = listMedcertTypes;
export const addMedcertReason = addMedcertType;
export const deleteMedcertReason = deleteMedcertType;
export const updateMedcertReason = updateMedcertType;
