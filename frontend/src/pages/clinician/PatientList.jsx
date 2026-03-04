// PatientList.jsx - Unified Patient Management with Search & Filters
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Search, Eye, FileText, Calendar, Loader2, Filter, X, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPatients, getPatientDetails } from '../../api/ClinicianDashboard';
import { toast } from 'sonner';
import { format } from 'date-fns';
import StaffRoleBanner from '../../components/staff/StaffRoleBanner';
import StaffPageSkeleton from '../../components/staff/StaffPageSkeleton';


export const PatientList = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [filters, setFilters] = useState({
    search: ''
  });

  useEffect(() => {
    loadPatients();
  }, [currentPage]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const response = await getPatients({ page: currentPage, per_page: 50 });
      const payload = response.data;
      const patientData = Array.isArray(payload?.data) ? payload.data : [];

      setPatients(patientData);
      setTotalPages(payload?.last_page || 1);
    } catch (err) {
      console.error('Failed to load patients:', err);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const loadPatientDetails = async (patientId) => {
    try {
      setDetailsLoading(true);
      const response = await getPatientDetails(patientId);
      setSelectedPatient(response.data);
    } catch (err) {
      console.error('Failed to load patient details:', err);
      toast.error('Failed to load patient details');
    } finally {
      setDetailsLoading(false);
    }
  };


  const filteredPatients = patients.filter(patient => {
    // Search filter
    const searchLower = filters.search.toLowerCase();
    const matchesSearch = !filters.search || 
      patient.user?.name?.toLowerCase().includes(searchLower) ||
      patient.user?.email?.toLowerCase().includes(searchLower) ||
      patient.phone?.toLowerCase().includes(searchLower) ||
      patient.student_number?.toLowerCase().includes(searchLower);

    return matchesSearch;
  });

  const clearFilters = () => {
    setFilters({ search: '' });
  };

  const hasActiveFilters = filters.search;

  if (loading) {
    return <StaffPageSkeleton variant="tabs" rows={4} />;
  }

  return (
    <div className="space-y-6">
      <StaffRoleBanner
        title="Patient List"
        subtitle="Quickly search, review, and open patient records with a responsive workflow."
        primaryAction={{ label: 'Open Schedule', to: '/clinician/schedule' }}
      />

      <div>
        <h1 className="text-3xl font-bold text-[#01377D]">Patient List</h1>
        <p className="text-[#009DD1] mt-2">View and manage your assigned patients</p>
      </div>

      {/* Compact Search Bar */}
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, phone, or student number..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="pl-10 bg-white border-[#97E7F5] focus:border-[#009DD1] focus:ring-[#009DD1]"
            />
          </div>
        </div>
        {hasActiveFilters && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearFilters}
            className="border-[#97E7F5] text-[#009DD1] hover:bg-blue-50"
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
      <p className="text-sm text-gray-500 flex items-center gap-2">
        <Users className="w-4 h-4" />
        Found {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}
      </p>

      {/* Results Card */}
      <Card className="border-[#97E7F5] shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-[#01377D]">Patients</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPatients.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No patients found matching your criteria</p>
              {hasActiveFilters && (
                <Button 
                  variant="link" 
                  onClick={clearFilters}
                  className="text-[#009DD1] mt-2"
                >
                  Clear filters to see all patients
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table className="bg-white">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[#01377D]">Patient Name</TableHead>
                    <TableHead className="text-[#01377D]">Email</TableHead>
                    <TableHead className="text-[#01377D]">Phone</TableHead>
                    <TableHead className="text-[#01377D]">Student #</TableHead>
                    <TableHead className="text-[#01377D]">DOB</TableHead>
                    <TableHead className="text-[#01377D] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium text-[#01377D]">
                        {patient.user?.name || 'N/A'}
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        {patient.user?.email || 'N/A'}
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        {patient.phone || 'N/A'}
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        {patient.student_number || 'N/A'}
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        {patient.date_of_birth 
                          ? format(new Date(patient.date_of_birth), 'MMM dd, yyyy')
                          : 'N/A'}
                      </TableCell>
                        <TableCell className="text-center">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => loadPatientDetails(patient.id)}
                                className="hover:bg-blue-50"
                              >
                                <Eye className="w-4 h-4 text-[#009DD1]" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl bg-white max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="text-[#01377D] text-xl">
                                  {patient.user?.name}
                                </DialogTitle>
                                <DialogDescription className="text-gray-600">
                                  Patient ID: PT-{patient.id?.toString().padStart(5, '0')}
                                </DialogDescription>
                              </DialogHeader>
                              {detailsLoading ? (
                                <div className="flex items-center justify-center py-12">
                                  <Loader2 className="w-8 h-8 animate-spin text-[#009DD1]" />
                                </div>
                              ) : selectedPatient ? (
                                <div className="space-y-6">
                                  {/* Personal Information */}
                                  <div className="border-b pb-4">
                                    <h3 className="text-lg font-semibold text-[#01377D] mb-4">Personal Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-xs text-gray-500 uppercase font-semibold">Full Name</p>
                                        <p className="text-[#01377D] font-medium mt-1">
                                          {selectedPatient.user?.name || 'N/A'}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500 uppercase font-semibold">Email</p>
                                        <p className="text-[#01377D] mt-1">
                                          {selectedPatient.user?.email || 'N/A'}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500 uppercase font-semibold">Phone</p>
                                        <p className="text-[#01377D] mt-1">
                                          {selectedPatient.phone || 'N/A'}
                                        </p>
                                      </div>
                                    <div>
                                      <p className="text-xs text-gray-500 uppercase font-semibold">Date of Birth</p>
                                      <p className="text-[#01377D] mt-1">
                                        {selectedPatient.date_of_birth 
                                          ? format(new Date(selectedPatient.date_of_birth), 'PPP')
                                          : 'N/A'}
                                      </p>
                                    </div>
                                  </div>
                                </div>                                  {/* Academic Information */}
                                  <div className="border-b pb-4">
                                    <h3 className="text-lg font-semibold text-[#01377D] mb-4">Academic Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-xs text-gray-500 uppercase font-semibold">Student Number</p>
                                        <p className="text-[#01377D] font-medium mt-1">
                                          {selectedPatient.student_number || 'N/A'}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500 uppercase font-semibold">Program/Course</p>
                                        <p className="text-[#01377D] mt-1">
                                          {selectedPatient.program_course || 'N/A'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Medical Information */}
                                  {(selectedPatient.medical_history || selectedPatient.allergies) && (
                                    <div className="border-b pb-4">
                                      <h3 className="text-lg font-semibold text-[#01377D] mb-4">Medical Information</h3>
                                      <div className="space-y-4">
                                        {selectedPatient.medical_history && (
                                          <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Medical History</p>
                                            <div className="text-sm text-gray-700 bg-blue-50 p-3 rounded border border-blue-200">
                                              {selectedPatient.medical_history}
                                            </div>
                                          </div>
                                        )}
                                        {selectedPatient.allergies && (
                                          <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Allergies</p>
                                            <div className="text-sm text-red-700 bg-red-50 p-3 rounded border border-red-200">
                                              {selectedPatient.allergies}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Action Buttons */}
                                  <div className="flex gap-2 pt-4">
                                    <Button 
                                      size="sm" 
                                      className="flex items-center gap-2 bg-[#009DD1] hover:bg-[#01377D] text-white"
                                      onClick={() => navigate(`/staff/patient-records/${patient.id}`)}
                                    >
                                      <FileText className="w-4 h-4" />
                                      View Full Records
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-center text-gray-500 py-8">
                                  No details available
                                </p>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-[#97E7F5]">
                  <p className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="bg-white border-[#97E7F5] text-[#009DD1] hover:bg-blue-50 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="bg-white border-[#97E7F5] text-[#009DD1] hover:bg-blue-50 disabled:opacity-50"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientList;