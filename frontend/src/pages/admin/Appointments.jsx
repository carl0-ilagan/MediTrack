// Admin Appointments Overview
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Calendar, Search, Filter, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { getAllAppointments } from '../../api/AdminDashboard';
import { toast } from 'sonner';
import { format } from 'date-fns';
import AdminPageSkeleton from '../../components/admin/AdminPageSkeleton';

export const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const STATUS_OPTIONS = useMemo(() => ([
    { value: 'all', label: 'All Statuses' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'no_show', label: 'No-show' },
  ]), []);

  useEffect(() => {
    loadAppointments();
  }, [currentPage, statusFilter]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        ...(statusFilter !== 'all' && { status: statusFilter })
      };
      const response = await getAllAppointments(params);
      const payload = response?.data;
      const rows = Array.isArray(payload?.data) ? payload.data : [];

      setAppointments(rows);
      setTotalPages(payload?.last_page || 1);
      setTotalCount(payload?.total ?? rows.length);
    } catch (err) {
      console.error('Failed to load appointments:', err);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const statusCounts = useMemo(() => {
    return appointments.reduce((acc, appointment) => {
      const key = (appointment?.status || '').toLowerCase();
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [appointments]);

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'no_show':
        return 'bg-gray-200 text-gray-700 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatStatus = (status) => {
    const key = (status || '').toLowerCase();
    switch (key) {
      case 'scheduled':
        return 'Scheduled';
      case 'confirmed':
        return 'Confirmed';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'rejected':
        return 'Rejected';
      case 'no_show':
        return 'No-show';
      default:
        return status || 'Unknown';
    }
  };

  const resolveAppointmentType = (apt) => {
    if (!apt) return '';
    const related = apt.appointment_type || apt.appointmentType;
    if (related && typeof related === 'object') {
      return related.name || '';
    }
    if (typeof apt.appointment_type === 'string') {
      return apt.appointment_type;
    }
    if (typeof apt.type === 'string') {
      return apt.type;
    }
    return '';
  };

  const getStartDate = (apt) => (apt?.start_time ? new Date(apt.start_time) : null);
  const getEndDate = (apt) => (apt?.end_time ? new Date(apt.end_time) : null);

  const filteredAppointments = appointments.filter((apt) => {
    const query = searchTerm.toLowerCase();
    const name = apt.patient?.user?.name?.toLowerCase() || '';
    const email = apt.patient?.user?.email?.toLowerCase() || '';
    const type = resolveAppointmentType(apt)?.toLowerCase() || '';

    return name.includes(query) || email.includes(query) || type.includes(query);
  });

  if (loading) {
    return <AdminPageSkeleton variant="table" rows={5} />;
  }

  return (
    <div className="space-y-6">
      <div className="hidden rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm md:flex md:items-center md:justify-between">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">
          <Sparkles className="h-3.5 w-3.5 text-cyan-600" />
          Appointments panel
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">
          <Calendar className="h-4 w-4 text-cyan-600" />
          <span>{format(new Date(), 'PPP')}</span>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-cyan-100 bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-700 p-5 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 left-20 h-36 w-36 rounded-full bg-cyan-300/20 blur-2xl" />
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs">
          <Sparkles className="h-3.5 w-3.5" />
          Live appointment pipeline
        </div>
        <h2 className="mt-2 text-2xl font-semibold">Appointments Overview</h2>
        <p className="mt-3 max-w-2xl text-sm text-cyan-100/90">Track status changes, patient schedule load, and appointment trends in one place.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-slate-200/80 bg-white/95 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-900">
              {totalCount}
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 bg-white/95 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-yellow-600 font-bold">
              {statusCounts['scheduled'] || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 bg-white/95 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-green-600 font-bold">
              {statusCounts['completed'] || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 bg-white/95 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-red-600 font-bold">
              {statusCounts['cancelled'] || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border-slate-200/80 bg-white/95 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by patient name, email, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-200 bg-white focus:border-cyan-500 focus:ring-cyan-500"
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-48 border-slate-200 bg-white focus:border-cyan-500 focus:ring-cyan-500">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="border-slate-200 bg-white">
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card className="border-slate-200/80 bg-white/95 shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900">All Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No appointments found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-slate-700">ID</TableHead>
                      <TableHead className="text-slate-700">Patient</TableHead>
                      <TableHead className="text-slate-700">Type</TableHead>
                      <TableHead className="text-slate-700">Date & Time</TableHead>
                      <TableHead className="text-slate-700">Status</TableHead>
                      <TableHead className="text-slate-700">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments.map((appointment) => {
                      const startDate = getStartDate(appointment);
                      const endDate = getEndDate(appointment);

                      return (
                        <TableRow key={appointment.id}>
                        <TableCell className="font-medium text-slate-900">
                          #{appointment.id}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900">
                              {appointment.patient?.user?.name || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {appointment.patient?.user?.email || 'N/A'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-800">
                          {resolveAppointmentType(appointment) || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-slate-800">
                              {startDate ? format(startDate, 'PPP') : 'N/A'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {startDate ? format(startDate, 'h:mm a') : 'N/A'}
                              {endDate ? ` – ${format(endDate, 'h:mm a')}` : ''}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={getStatusBadgeVariant(appointment.status)}
                          >
                            {formatStatus(appointment.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {appointment.created_at 
                            ? format(new Date(appointment.created_at), 'PP')
                            : 'N/A'}
                        </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-6">
                  <p className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="border-slate-200 bg-white text-cyan-700 hover:bg-cyan-50 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="border-slate-200 bg-white text-cyan-700 hover:bg-cyan-50 disabled:opacity-50"
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

export default Appointments;
