// src/api/Appointments.jsx
import api from './axios';

export const getAppointments = async (params = {}) => {
    return api.get('/api/appointments', { params });
};

export const getAppointment = async (id) => {
    return api.get(`/api/appointments/${id}`);
};

export const createAppointment = async (data) => {
    return api.post('/api/appointments', data);
};

export const updateAppointment = async (id, data) => {
    return api.put(`/api/appointments/${id}`, data);
};

export const deleteAppointment = async (id) => {
    return api.delete(`/api/appointments/${id}`);
};

export const cancelAppointment = async (id, reason) => {
    return api.post(`/api/appointments/${id}/cancel`, { cancellation_reason: reason });
};

export const confirmAppointment = async (id) => {
    return api.post(`/api/appointments/${id}/confirm`);
};

export const rejectAppointment = async (id, reason) => {
    return api.post(`/api/appointments/${id}/reject`, { rejection_reason: reason });
};

export const getAppointmentCalendar = async (params = {}) => {
    return api.get('/api/appointments/calendar', { params });
};