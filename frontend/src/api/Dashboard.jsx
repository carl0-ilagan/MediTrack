// src/api/Dashboard.jsx
import api from './axios';

export const getDashboardStats = async () => {
    return api.get('/api/dashboard/stats');
};

export const getRecentAppointments = async (params = {}) => {
    return api.get('/api/dashboard/appointments', { params });
};

export const getRecentActivity = async () => {
    return api.get('/api/dashboard/recent-activity');
};