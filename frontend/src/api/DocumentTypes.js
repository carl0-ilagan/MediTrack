import api from './axios';

export const listDocumentTypes = async (params = {}) => {
  return api.get('/api/document-types', { params });
};

export const addDocumentType = async (data) => {
  return api.post('/api/document-types', data);
};

export const updateDocumentType = async (id, data) => {
  return api.put(`/api/document-types/${id}`, data);
};

export const deleteDocumentType = async (id) => {
  return api.delete(`/api/document-types/${id}`);
};

export const toggleDocumentTypeStatus = async (id, isActive) => {
  return api.put(`/api/document-types/${id}`, { is_active: isActive });
};
