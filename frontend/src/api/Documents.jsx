// src/api/Documents.jsx
import api from './axios';

export const getDocuments = async (patientId = null, params = {}) => {
    if (patientId) {
        return api.get(`/api/patients/${patientId}/documents`, { params });
    }
    return api.get('/api/documents', { params });
};

export const getDocument = async (id) => {
    return api.get(`/api/documents/${id}`);
};

export const uploadDocument = async (patientId, formData) => {
    const config = {
        headers: { 'Content-Type': 'multipart/form-data' }
    };
    return api.post(`/api/patients/${patientId}/documents`, formData, config);
};

export const updateDocument = async (id, data) => {
    return api.put(`/api/documents/${id}`, data);
};

export const deleteDocument = async (id) => {
    return api.delete(`/api/documents/${id}`);
};

export const downloadDocument = async (id) => {
    return api.get(`/api/documents/${id}/download`, { responseType: 'blob' });
};