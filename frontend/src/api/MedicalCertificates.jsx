// src/api/MedicalCertificates.jsx
import api from './axios';

export const getMedCerts = async (params = {}) => {
    return api.get('/api/med-certs', { params });
};

export const getMedCert = async (id) => {
    return api.get(`/api/med-certs/${id}`);
};

export const createMedCert = async (data) => {
    return api.post('/api/med-certs', data);
};

export const updateMedCert = async (id, data) => {
    return api.put(`/api/med-certs/${id}`, data);
};

export const deleteMedCert = async (id) => {
    return api.delete(`/api/med-certs/${id}`);
};

export const approveMedCert = async (id, data) => {
    return api.post(`/api/med-certs/${id}/approve`, data);
};

export const rejectMedCert = async (id, reason) => {
    return api.post(`/api/med-certs/${id}/reject`, { reason });
};

export const downloadMedCert = async (id) => {
    return api.get(`/api/med-certs/${id}/download`, { responseType: 'blob' });
};