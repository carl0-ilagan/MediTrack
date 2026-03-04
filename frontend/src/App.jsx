import React, { useEffect, Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext"; // Import useAuth here
import "./App.css";
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from './components/ui/sonner';
import PatientPageSkeleton from './components/patient/PatientPageSkeleton';
import PatientAppointmentSkeleton from './components/patient/PatientAppointmentSkeleton';
import AdminPageSkeleton from './components/admin/AdminPageSkeleton';
import api from "./api/axios";

// Public pages
import Home from "./pages/home";

// Auth pages
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Profile from "./pages/auth/Profile";
import ForgotPassword from "./pages/auth/ForgotPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";

// Lazy load heavy dashboard components for better performance
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const ManageUsers = lazy(() => import("./pages/admin/ManageUsers"));
const Reports = lazy(() => import("./pages/admin/Reports"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const Appointments = lazy(() => import("./pages/admin/Appointments"));
const MedCerts = lazy(() => import("./pages/admin/MedCerts"));
const AuditLogs = lazy(() => import("./pages/admin/AuditLogs"));

const ClinicianDashboard = lazy(() => import("./pages/clinician/Dashboard"));
const PatientList = lazy(() => import("./pages/clinician/PatientList"));
const PatientRecords = lazy(() => import("./pages/clinician/PatientRecords"));
const Schedule = lazy(() => import("./pages/clinician/Schedule"));
const RequestManagement = lazy(() => import("./pages/clinician/RequestManagement"));
const ClinicianDocuments = lazy(() => import("./pages/clinician/Documents"));
const ClinicianPreviousLaboratory = lazy(() => import("./pages/clinician/PreviousLaboratory"));
const ClinicianSettings = lazy(() => import("./pages/clinician/Settings"));

const PatientDashboard = lazy(() => import("./pages/patient/Dashboard"));
const Appointment = lazy(() => import("./pages/patient/Appointment"));
const Records = lazy(() => import("./pages/patient/Records"));
const RequestCertificate = lazy(() => import("./pages/patient/RequestCertificate"));
const UploadDocument = lazy(() => import("./pages/patient/UploadDocument"));
const PatientPreviousLaboratory = lazy(() => import("./pages/patient/PreviousLaboratory"));

// Create a wrapper component that conditionally applies Layout
const RouteWrapper = ({ children, requireLayout = false }) => {
  if (requireLayout) {
    return <Layout>{children}</Layout>;
  }
  return children;
};

// Loading component for lazy-loaded routes
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// Suspense wrapper for lazy components
const LazyWrapper = ({ children, fallback }) => (
  <Suspense fallback={fallback || <LoadingFallback />}>
    {children}
  </Suspense>
);

// Dashboard redirect component - MUST be inside AuthProvider
const DashboardRedirect = () => {
  const { user, isAdmin, isClinician, isPatient } = useAuth();

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (isAdmin) return <Navigate to="/admin/dashboard" replace />;
  if (isClinician) return <Navigate to="/clinician/dashboard" replace />;
  if (isPatient) return <Navigate to="/patient/dashboard" replace />;

  return <Navigate to="/" replace />;
};

const App = () => {
  useEffect(() => {
    // Initialize CSRF token on app mount (non-blocking)
    api.get('/sanctum/csrf-cookie').catch(() => {});
  }, []);

  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes without Layout */}
          <Route path="/" element={<Home />} />
          
          {/* Auth routes without Layout */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<Signup />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/verify-email" element={<VerifyEmail />} />

          {/* Dashboard redirect route */}
          <Route 
            path="/dashboard" 
            element={
              <RouteWrapper requireLayout={true}>
                <ProtectedRoute>
                  <DashboardRedirect />
                </ProtectedRoute>
              </RouteWrapper>
            } 
          />

          {/* Protected routes with Layout */}
          <Route 
            path="/auth/profile" 
            element={
              <RouteWrapper requireLayout={true}>
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              </RouteWrapper>
            } 
          />

          {/* Admin routes with Layout */}
          <Route 
            path="/admin/dashboard" 
            element={
              <RouteWrapper requireLayout={true}>
                <ProtectedRoute allowedRoles={['admin']}>
                  <LazyWrapper fallback={<AdminPageSkeleton variant="dashboard" rows={4} />}>
                    <AdminDashboard />
                  </LazyWrapper>
                </ProtectedRoute>
              </RouteWrapper>
            } 
          />
          <Route 
            path="/admin/manage-users" 
            element={
              <RouteWrapper requireLayout={true}>
                <ProtectedRoute allowedRoles={['admin']}>
                  <LazyWrapper fallback={<AdminPageSkeleton variant="table" rows={5} />}>
                    <ManageUsers />
                  </LazyWrapper>
                </ProtectedRoute>
              </RouteWrapper>
            } 
          />
          <Route 
            path="/admin/reports" 
            element={
              <RouteWrapper requireLayout={true}>
                <ProtectedRoute allowedRoles={['admin']}>
                  <LazyWrapper fallback={<AdminPageSkeleton variant="charts" rows={3} />}>
                    <Reports />
                  </LazyWrapper>
                </ProtectedRoute>
              </RouteWrapper>
            } 
          />
          <Route 
            path="/admin/settings" 
            element={
              <RouteWrapper requireLayout={true}>
                <ProtectedRoute allowedRoles={['admin']}>
                  <LazyWrapper fallback={<AdminPageSkeleton variant="tabs" rows={4} />}>
                    <Settings />
                  </LazyWrapper>
                </ProtectedRoute>
              </RouteWrapper>
            } 
          />
          <Route 
            path="/admin/appointments" 
            element={
              <RouteWrapper requireLayout={true}>
                <ProtectedRoute allowedRoles={['admin']}>
                  <LazyWrapper fallback={<AdminPageSkeleton variant="table" rows={5} />}>
                    <Appointments />
                  </LazyWrapper>
                </ProtectedRoute>
              </RouteWrapper>
            } 
          />
          <Route 
            path="/admin/medcerts" 
            element={
              <RouteWrapper requireLayout={true}>
                <ProtectedRoute allowedRoles={['admin']}>
                  <LazyWrapper fallback={<AdminPageSkeleton variant="table" rows={5} />}>
                    <MedCerts />
                  </LazyWrapper>
                </ProtectedRoute>
              </RouteWrapper>
            } 
          />
          <Route 
            path="/admin/audit-logs" 
            element={
              <RouteWrapper requireLayout={true}>
                <ProtectedRoute allowedRoles={['admin']}>
                  <LazyWrapper fallback={<AdminPageSkeleton variant="table" rows={5} />}>
                    <AuditLogs />
                  </LazyWrapper>
                </ProtectedRoute>
              </RouteWrapper>
            } 
          />

          {/* Clinician routes with Layout */}
          <Route 
            path="/clinician/dashboard" 
            element={
              <RouteWrapper requireLayout={true}>
                <ProtectedRoute allowedRoles={['clinician']}>
                  <LazyWrapper>
                    <ClinicianDashboard />
                  </LazyWrapper>
                </ProtectedRoute>
              </RouteWrapper>
            } 
          />
          <Route 
            path="/clinician/patients" 
            element={
              <RouteWrapper requireLayout={true}>
                <ProtectedRoute allowedRoles={['clinician']}>
                  <LazyWrapper>
                    <PatientList />
                  </LazyWrapper>
                </ProtectedRoute>
              </RouteWrapper>
            } 
          />
          <Route 
            path="/staff/patient-records/:patientId" 
            element={
              <RouteWrapper requireLayout={true}>
                <ProtectedRoute allowedRoles={['clinician']}>
                  <LazyWrapper>
                    <PatientRecords />
                  </LazyWrapper>
                </ProtectedRoute>
              </RouteWrapper>
            } 
          />
          <Route 
            path="/clinician/schedule" 
            element={
              <RouteWrapper requireLayout={true}>
                <ProtectedRoute allowedRoles={['clinician']}>
                  <LazyWrapper>
                    <Schedule />
                  </LazyWrapper>
                </ProtectedRoute>
              </RouteWrapper>
            } 
          />
          <Route 
            path="/clinician/requests" 
            element={
              <RouteWrapper requireLayout={true}>
                <ProtectedRoute allowedRoles={['clinician']}>
                  <LazyWrapper>
                    <RequestManagement />
                  </LazyWrapper>
                </ProtectedRoute>
              </RouteWrapper>
            } 
          />
          <Route 
            path="/clinician/documents" 
            element={
              <RouteWrapper requireLayout={true}>
                <ProtectedRoute allowedRoles={['clinician']}>
                  <LazyWrapper>
                    <ClinicianDocuments />
                  </LazyWrapper>
                </ProtectedRoute>
              </RouteWrapper>
            } 
          />
          <Route 
            path="/clinician/previous-laboratory" 
            element={
              <RouteWrapper requireLayout={true}>
                <ProtectedRoute allowedRoles={['clinician']}>
                  <LazyWrapper>
                    <ClinicianPreviousLaboratory />
                  </LazyWrapper>
                </ProtectedRoute>
              </RouteWrapper>
            } 
          />
          <Route 
            path="/clinician/settings" 
            element={
              <RouteWrapper requireLayout={true}>
                <ProtectedRoute allowedRoles={['clinician']}>
                  <LazyWrapper>
                    <ClinicianSettings />
                  </LazyWrapper>
                </ProtectedRoute>
              </RouteWrapper>
            } 
          />

          {/* Patient routes with Layout */}
          <Route 
            path="/patient/dashboard" 
            element={
              <RouteWrapper requireLayout={true}>
                <ProtectedRoute allowedRoles={['patient']}>
                  <LazyWrapper fallback={<PatientPageSkeleton variant="dashboard" rows={4} />}>
                    <PatientDashboard />
                  </LazyWrapper>
                </ProtectedRoute>
              </RouteWrapper>
            } 
          />
          <Route 
            path="/patient/appointment" 
            element={
              <RouteWrapper requireLayout={true}>
                <ProtectedRoute allowedRoles={['patient']}>
                  <LazyWrapper fallback={<PatientAppointmentSkeleton />}>
                    <Appointment />
                  </LazyWrapper>
                </ProtectedRoute>
              </RouteWrapper>
            } 
          />
          <Route 
            path="/patient/records" 
            element={
              <RouteWrapper requireLayout={true}>
                <ProtectedRoute allowedRoles={['patient']}>
                  <LazyWrapper fallback={<PatientPageSkeleton variant="tabs" rows={4} />}>
                    <Records />
                  </LazyWrapper>
                </ProtectedRoute>
              </RouteWrapper>
            } 
          />
          <Route 
            path="/patient/request-certificate" 
            element={
              <RouteWrapper requireLayout={true}>
                <ProtectedRoute allowedRoles={['patient']}>
                  <LazyWrapper fallback={<PatientPageSkeleton variant="tabs" rows={4} />}>
                    <RequestCertificate />
                  </LazyWrapper>
                </ProtectedRoute>
              </RouteWrapper>
            } 
          />
          <Route 
            path="/patient/upload-document" 
            element={
              <RouteWrapper requireLayout={true}>
                <ProtectedRoute allowedRoles={['patient']}>
                  <LazyWrapper fallback={<PatientPageSkeleton variant="form" rows={3} />}>
                    <UploadDocument />
                  </LazyWrapper>
                </ProtectedRoute>
              </RouteWrapper>
            } 
          />
          <Route 
            path="/patient/previous-laboratory" 
            element={
              <RouteWrapper requireLayout={true}>
                <ProtectedRoute allowedRoles={['patient']}>
                  <LazyWrapper fallback={<PatientPageSkeleton variant="list" rows={4} />}>
                    <PatientPreviousLaboratory />
                  </LazyWrapper>
                </ProtectedRoute>
              </RouteWrapper>
            } 
          />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <div style={{ 
          position: 'fixed', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          zIndex: 9999 
        }}>
          <Toaster 
            position="bottom-center"
            toastOptions={{
              style: {
                background: 'white',
                padding: '16px',
                fontSize: '16px',
                minWidth: '400px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              },
              success: {
                style: {
                  background: 'white',
                  border: '2px solid #10b981',
                  color: '#065f46',
                  boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.2), 0 4px 6px -2px rgba(16, 185, 129, 0.1)',
                },
              },
              error: {
                style: {
                  background: 'white',
                  border: '2px solid #ef4444',
                  color: '#991b1b',
                  boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.2), 0 4px 6px -2px rgba(239, 68, 68, 0.1)',
                },
              },
            }}
          />
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;