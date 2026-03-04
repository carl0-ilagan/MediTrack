import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { ArrowLeft, Calendar, FileText, Clock, CheckCircle, XCircle, AlertCircle, User } from 'lucide-react';
import { getPatientDetails } from '../../api/ClinicianDashboard';
import api from '../../api/axios';
import { toast } from 'sonner';
import { format } from 'date-fns';
import StaffPageSkeleton from '../../components/staff/StaffPageSkeleton';

export const PatientRecords = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [medCerts, setMedCerts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadPatientData();
  }, [patientId]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      const [patientRes, appointmentsRes, medCertsRes, documentsRes] = await Promise.all([
        getPatientDetails(patientId),
        api.get(`/api/appointments?patient_id=${patientId}&per_page=100`),
        api.get(`/api/med-certs?patient_id=${patientId}&per_page=100`),
        api.get(`/api/patients/${patientId}/documents`)
      ]);

      setPatient(patientRes.data);
      
      // Handle paginated response from appointments API
      let appointmentData = [];
      if (appointmentsRes.data?.data) {
        appointmentData = appointmentsRes.data.data;
      } else if (Array.isArray(appointmentsRes.data)) {
        appointmentData = appointmentsRes.data;
      }
      setAppointments(Array.isArray(appointmentData) ? appointmentData : []);
      
      // Handle paginated response from med-certs API
      let medCertData = [];
      if (medCertsRes.data?.data) {
        medCertData = medCertsRes.data.data;
      } else if (Array.isArray(medCertsRes.data)) {
        medCertData = medCertsRes.data;
      }
      setMedCerts(Array.isArray(medCertData) ? medCertData : []);
      
      // Handle documents response
      let documentData = [];
      if (documentsRes.data?.data) {
        documentData = documentsRes.data.data;
      } else if (Array.isArray(documentsRes.data)) {
        documentData = documentsRes.data;
      }
      setDocuments(Array.isArray(documentData) ? documentData : []);

      // Debug logs
      console.log('Raw appointments response:', appointmentsRes.data);
      console.log('Processed appointments:', appointmentData);
      console.log('Medical Certificates:', medCertData);
      console.log('Documents:', documentData);
    } catch (err) {
      console.error('Failed to load patient data:', err);
      toast.error('Failed to load patient records');
      navigate('/clinician/patients');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'Pending', icon: Clock, className: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Approved', icon: CheckCircle, className: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rejected', icon: XCircle, className: 'bg-red-100 text-red-800' },
      completed: { label: 'Completed', icon: CheckCircle, className: 'bg-blue-100 text-blue-800' },
      confirmed: { label: 'Confirmed', icon: CheckCircle, className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelled', icon: XCircle, className: 'bg-red-100 text-red-800' },
      in_progress: { label: 'In Progress', icon: AlertCircle, className: 'bg-blue-100 text-blue-800' },
    };

    const config = statusMap[status?.toLowerCase()] || {
      label: status,
      icon: AlertCircle,
      className: 'bg-gray-100 text-gray-800'
    };

    const IconComponent = config.icon;
    return (
      <Badge className={`${config.className} border-0 flex items-center gap-1 w-fit`}>
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return <StaffPageSkeleton variant="tabs" rows={4} />;
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Patient not found</p>
        <Button
          variant="link"
          onClick={() => navigate('/clinician/patients')}
          className="text-[#009DD1] mt-4"
        >
          Back to Patients
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/clinician/patients')}
            className="hover:bg-blue-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-[#01377D]">{patient.user?.name}</h1>
            <p className="text-[#009DD1] mt-1">
              Patient ID: PT-{patient.id?.toString().padStart(5, '0')} | {patient.student_number}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Card className="border-[#97E7F5] shadow-sm bg-white">
        {/* Tab Navigation */}
        <div className="flex gap-0 border-b border-[#97E7F5] bg-[#F0F9FF]">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-medium flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-[#009DD1] text-[#009DD1]'
                : 'border-transparent text-gray-600 hover:text-[#009DD1]'
            }`}
          >
            <User className="w-4 h-4" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-6 py-3 font-medium flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'appointments'
                ? 'border-[#009DD1] text-[#009DD1]'
                : 'border-transparent text-gray-600 hover:text-[#009DD1]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Reservations
          </button>
          <button
            onClick={() => setActiveTab('medcerts')}
            className={`px-6 py-3 font-medium flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'medcerts'
                ? 'border-[#009DD1] text-[#009DD1]'
                : 'border-transparent text-gray-600 hover:text-[#009DD1]'
            }`}
          >
            <FileText className="w-4 h-4" />
            Med Certs
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-6 py-3 font-medium flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'documents'
                ? 'border-[#009DD1] text-[#009DD1]'
                : 'border-transparent text-gray-600 hover:text-[#009DD1]'
            }`}
          >
            <FileText className="w-4 h-4" />
            Documents
          </button>
        </div>

        {/* Tab Content */}
        <CardContent className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="border-l-4 border-[#009DD1] pl-4">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Email</p>
                  <p className="text-[#01377D] font-medium mt-2">{patient.user?.email || 'N/A'}</p>
                </div>
                <div className="border-l-4 border-[#009DD1] pl-4">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Phone</p>
                  <p className="text-[#01377D] font-medium mt-2">{patient.phone || 'N/A'}</p>
                </div>
                <div className="border-l-4 border-[#009DD1] pl-4">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Date of Birth</p>
                  <p className="text-[#01377D] font-medium mt-2">
                    {patient.date_of_birth
                      ? format(new Date(patient.date_of_birth), 'PPP')
                      : 'N/A'}
                  </p>
                </div>
                <div className="border-l-4 border-[#009DD1] pl-4">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Program/Course</p>
                  <p className="text-[#01377D] font-medium mt-2">{patient.program || 'N/A'}</p>
                </div>
              </div>

              {patient.medical_history && (
                <div>
                  <h3 className="text-lg font-semibold text-[#01377D] mb-3">Medical History</h3>
                  <div className="text-sm text-gray-700 bg-blue-50 p-4 rounded border border-blue-200">
                    {patient.medical_history}
                  </div>
                </div>
              )}

              {patient.allergies && (
                <div>
                  <h3 className="text-lg font-semibold text-[#01377D] mb-3">Allergies</h3>
                  <div className="text-sm text-red-700 bg-red-50 p-4 rounded border border-red-200">
                    {Array.isArray(patient.allergies) ? patient.allergies.join(', ') : patient.allergies}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <div>
              {appointments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No reservations found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[#01377D]">Type</TableHead>
                        <TableHead className="text-[#01377D]">Date & Time</TableHead>
                        <TableHead className="text-[#01377D]">Status</TableHead>
                        <TableHead className="text-[#01377D]">Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments.length > 0 ? (
                        appointments.map((apt) => (
                          <TableRow key={apt.id}>
                            <TableCell className="font-medium text-[#01377D]">
                              {apt.appointment_type?.name || apt.type || 'N/A'}
                            </TableCell>
                            <TableCell className="text-gray-600 text-sm">
                              {apt.start_time
                                ? format(new Date(apt.start_time), 'PPP p')
                                : 'N/A'}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(apt.status)}
                            </TableCell>
                            <TableCell className="text-gray-600 text-sm">
                              {apt.cancellation_reason || apt.notes || '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan="4" className="text-center text-gray-500 py-8">
                            No reservations to display
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          {/* Medical Certificates Tab */}
          {activeTab === 'medcerts' && (
            <div>
              {medCerts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No medical certificates found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[#01377D]">Reason</TableHead>
                        <TableHead className="text-[#01377D]">Requested Date</TableHead>
                        <TableHead className="text-[#01377D]">Status</TableHead>
                        <TableHead className="text-[#01377D]">Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {medCerts.map((cert) => (
                        <TableRow key={cert.id}>
                          <TableCell className="font-medium text-[#01377D]">
                            {cert.reason || cert.type || 'N/A'}
                          </TableCell>
                          <TableCell className="text-gray-600 text-sm">
                            {cert.created_at
                              ? format(new Date(cert.created_at), 'PPP')
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(cert.status)}
                          </TableCell>
                          <TableCell className="text-gray-600 text-sm">
                            {cert.notes || cert.reason || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div>
              {documents.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No documents found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <Card key={doc.id} className="border-[#97E7F5] p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-[#01377D]">{doc.name}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Uploaded {doc.created_at ? format(new Date(doc.created_at), 'PPP p') : 'N/A'}
                          </p>
                          {doc.documentType?.name && (
                            <Badge variant="outline" className="mt-2">
                              {doc.documentType.name}
                            </Badge>
                          )}
                        </div>
                        <Button
                          size="sm"
                          className="bg-[#009DD1] hover:bg-[#01377D] text-white"
                          onClick={() => navigate('/clinician/previous-laboratory')}
                        >
                          View in Previous Laboratory
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientRecords;
