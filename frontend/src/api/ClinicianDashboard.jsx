// src/api/ClinicianDashboard.jsx
import api from './axios';

// Dashboard Stats
export const getClinicianStats = async () => {
    return api.get('/api/clinician/dashboard/stats');
};

// Appointments
export const getClinicianAppointments = async (params = {}) => {
    return api.get('/api/appointments', { params });
};

export const updateAppointmentStatus = async (appointmentId, status) => {
    // Map frontend status names to API endpoints
    const statusMap = {
        'no_show': 'no_show',
        'in_progress': 'start',
        'completed': 'complete'
    };
    
    const endpoint = statusMap[status] || status;
    return api.post(`/api/appointments/${appointmentId}/${endpoint}`);
};

export const confirmAppointment = async (appointmentId) => {
    return api.post(`/api/appointments/${appointmentId}/confirm`);
};

export const cancelAppointment = async (appointmentId, reason) => {
    return api.post(`/api/appointments/${appointmentId}/cancel`, { cancellation_reason: reason });
};

export const rejectAppointment = async (appointmentId, reason) => {
    return api.post(`/api/appointments/${appointmentId}/reject`, { rejection_reason: reason });
};

// Medical Certificates
// Generic fetch for med-certs. Caller can pass any params (status, page, etc.)
export const getMedCerts = async (params = {}) => {
    return api.get('/api/med-certs', { params });
};

// Backwards-compatible helper for fetching pending med-certs
export const getPendingMedCerts = async (params = {}) => {
    return getMedCerts({ status: 'pending', ...params });
};

export const approveMedCert = async (medCertId, data) => {
    return api.post(`/api/med-certs/${medCertId}/approve`, data);
};

export const rejectMedCert = async (medCertId, reason) => {
    return api.post(`/api/med-certs/${medCertId}/reject`, { reason });
};

export const markMedCertCompleted = async (medCertId) => {
    return api.post(`/api/med-certs/${medCertId}/completed`);
};

// Patients
export const getPatients = async (params = {}) => {
    return api.get('/api/patients', { params });
};

export const getPatientDetails = async (patientId) => {
    return api.get(`/api/patients/${patientId}`);
};

export const getPatientAppointments = async (patientId) => {
    return api.get(`/api/patients/${patientId}/appointments`);
};

export const getPatientDocuments = async (patientId) => {
    return api.get(`/api/patients/${patientId}/documents`);
};

// Schedule
export const getCalendarAppointments = async (params = {}) => {
    return api.get('/api/appointments/calendar', { params });
};
