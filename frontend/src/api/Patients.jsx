// src/api/Patients.jsx
import api from './axios';

export const getPatients = async (params = {}) => {
    return api.get('/api/patients', { params });
};

export const getPatient = async (id) => {
    return api.get(`/api/patients/${id}`);
};

export const createPatient = async (data) => {
    return api.post('/api/patients', data);
};

export const updatePatient = async (id, data) => {
    return api.put(`/api/patients/${id}`, data);
};

export const deletePatient = async (id) => {
    return api.delete(`/api/patients/${id}`);
};

export const getPatientMedicalHistory = async (id) => {
    return api.get(`/api/patients/${id}/medical-history`);
};

export const updatePatientMedicalHistory = async (id, data) => {
    return api.put(`/api/patients/${id}/medical-history`, data);
};