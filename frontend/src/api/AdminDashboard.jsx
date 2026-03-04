// src/api/Dashboard.jsx
import api from './axios';

export const getAdminStats = async () => {
    return api.get('/api/admin/dashboard/stats');
};

export const getAppointmentStats = async (months = 6) => {
    return api.get('/api/admin/dashboard/appointments', { params: { months } });
};

export const getAllAppointments = async (params = {}) => {
    return api.get('/api/appointments', { params });
};

export const getAllMedCerts = async (params = {}) => {
    return api.get('/api/med-certs', { params });
};

export const getAuditLogs = async (params = {}) => {
    return api.get('/api/audit-logs', { params });
};
