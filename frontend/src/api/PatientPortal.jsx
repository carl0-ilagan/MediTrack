// src/api/PatientPortal.jsx
import api from './axios';
import { getAppointments } from './Appointments';
import { getMedCerts } from './MedicalCertificates';
import { getDocuments } from './Documents';
import { getPatient } from './Patients';

export const normalizePaginated = (response) => {
  const payload = response?.data ?? {};
  const data = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload)
      ? payload
      : [];

  const metaSource = payload?.meta ?? payload;

  return {
    data,
    meta: {
      currentPage: metaSource?.current_page ?? 1,
      lastPage: metaSource?.last_page ?? 1,
      perPage: metaSource?.per_page ?? data.length,
      total: metaSource?.total ?? data.length,
    },
  };
};

export const getClinicianDirectory = (params = {}) => {
  return api.get('/api/clinicians', { params });
};

export const fetchPatientDashboardOverview = async (patientId, params = {}) => {
  const safeRequest = async (label, requestFn, fallback) => {
    try {
      const result = await requestFn();
      console.log(`✅ ${label} loaded successfully`);
      return result;
    } catch (error) {
      console.error(`❌ ${label} failed:`, {
        status: error?.response?.status,
        message: error?.message,
        data: error?.response?.data,
      });
      return fallback;
    }
  };

  const [appointmentsRes, medCertsRes, documentsRes, patientRes] = await Promise.all([
    safeRequest(
      'Appointments',
      () => getAppointments({ per_page: params.appointmentsPerPage ?? 10 }),
      { data: { data: [] } }
    ),
    safeRequest(
      'Medical Certificates',
      () => getMedCerts({ per_page: params.medCertsPerPage ?? 5 }),
      { data: { data: [] } }
    ),
    safeRequest(
      'Documents',
      () =>
        patientId
          ? getDocuments(patientId, { per_page: params.documentsPerPage ?? 5 })
          : Promise.resolve({ data: { data: [] } }),
      { data: { data: [] } }
    ),
    safeRequest(
      'Patient',
      () => (patientId ? getPatient(patientId) : Promise.resolve({ data: null })),
      { data: null }
    ),
  ]);

  return {
    appointments: normalizePaginated(appointmentsRes),
    medCerts: normalizePaginated(medCertsRes),
    documents: normalizePaginated(documentsRes),
    patient: patientRes?.data ?? null,
  };
};
