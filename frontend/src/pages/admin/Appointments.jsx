// Admin Appointments Overview
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Calendar, Search, Filter, ChevronLeft, ChevronRight, Sparkles, ChevronDown, Check, X, Loader2, Layers3, Clock3, CheckCircle2, XCircle } from 'lucide-react';
import { getAllAppointments } from '../../api/AdminDashboard';
import { toast } from 'sonner';
import { format } from 'date-fns';
import AdminPageSkeleton from '../../components/admin/AdminPageSkeleton';

export const Appointments = () => {
  const APPOINTMENTS_PER_PAGE = 10;

  const [appointments, setAppointments] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const filterMenuRef = useRef(null);

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
      if (initialLoading) {
        setInitialLoading(true);
      } else {
        setTableLoading(true);
      }
      const params = {
        page: currentPage,
        per_page: APPOINTMENTS_PER_PAGE,
        ...(statusFilter !== 'all' && { status: statusFilter })
      };
      const response = await getAllAppointments(params);
      const payload = response?.data;
      const rows = Array.isArray(payload?.data) ? payload.data : [];

      setAppointments(rows);
      setTotalPages(payload?.last_page || 1);
      setTotalCount(payload?.total ?? rows.length);
      setPageSize(payload?.per_page || APPOINTMENTS_PER_PAGE);
    } catch (err) {
      console.error('Failed to load appointments:', err);
      toast.error('Failed to load appointments');
      setAppointments([]);
      setTotalPages(1);
      setTotalCount(0);
      setPageSize(APPOINTMENTS_PER_PAGE);
    } finally {
      setInitialLoading(false);
      setTableLoading(false);
    }
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

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
    const status = (apt.status || '').toLowerCase();
    const matchesStatus = statusFilter === 'all' || status === statusFilter;

    if (!matchesStatus) return false;
    if (!query) return true;
    return name.includes(query) || email.includes(query) || type.includes(query);
  });

  const selectedStatusLabel = STATUS_OPTIONS.find((option) => option.value === statusFilter)?.label || 'All Statuses';
  const pageStartIndex = totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const pageEndIndex = totalCount > 0 ? Math.min(currentPage * pageSize, totalCount) : 0;

  if (initialLoading) {
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200/80 bg-gradient-to-b from-white to-slate-50 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Total</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{totalCount}</p>
                <p className="mt-1 text-xs text-slate-500">All appointments in current dataset</p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700">
                <Layers3 className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200/60 bg-gradient-to-b from-white to-amber-50/40 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">Scheduled</p>
                <p className="mt-3 text-3xl font-semibold text-amber-700">{statusCounts['scheduled'] || 0}</p>
                <p className="mt-1 text-xs text-amber-700/80">Waiting for clinician handling</p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-700">
                <Clock3 className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/60 bg-gradient-to-b from-white to-emerald-50/40 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Completed</p>
                <p className="mt-3 text-3xl font-semibold text-emerald-700">{statusCounts['completed'] || 0}</p>
                <p className="mt-1 text-xs text-emerald-700/80">Finished and closed appointments</p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-200/60 bg-gradient-to-b from-white to-rose-50/40 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-rose-700">Cancelled</p>
                <p className="mt-3 text-3xl font-semibold text-rose-700">{statusCounts['cancelled'] || 0}</p>
                <p className="mt-1 text-xs text-rose-700/80">Cancelled by patient or staff</p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-100 text-rose-700">
                <XCircle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border-slate-200/80 bg-white/95 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative w-full flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by patient name, email, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 pl-10 pr-9 border-slate-200 bg-white transition-all duration-200 focus:border-cyan-500 focus:ring-cyan-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div ref={filterMenuRef} className="relative w-full md:w-56">
              <button
                type="button"
                onClick={() => setIsFilterOpen((prev) => !prev)}
                className="flex h-11 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 transition-all duration-200 hover:border-cyan-400 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                aria-expanded={isFilterOpen}
                aria-haspopup="listbox"
              >
                <span className="inline-flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  {selectedStatusLabel}
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : 'rotate-0'}`} />
              </button>

              <div
                className={`absolute right-0 z-30 mt-2 w-full origin-top rounded-md border border-slate-200 bg-white p-1.5 shadow-lg transition-all duration-200 ${
                  isFilterOpen
                    ? 'translate-y-0 scale-100 opacity-100'
                    : 'pointer-events-none -translate-y-1 scale-95 opacity-0'
                }`}
                role="listbox"
              >
                {STATUS_OPTIONS.map((option) => {
                  const isActive = option.value === statusFilter;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleStatusChange(option.value)}
                      className={`flex w-full items-center justify-between rounded px-2.5 py-2 text-left text-sm transition ${
                        isActive
                          ? 'bg-cyan-50 text-cyan-700'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{option.label}</span>
                      {isActive && <Check className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Showing <span className="font-medium text-slate-700">{filteredAppointments.length}</span> appointment{filteredAppointments.length === 1 ? '' : 's'}
            {statusFilter !== 'all' ? ` • Filtered: ${selectedStatusLabel}` : ''}
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card className="border-slate-200/80 bg-white/95 shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900">All Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {tableLoading && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs text-cyan-700">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Updating table...
            </div>
          )}
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No appointments found</p>
            </div>
          ) : (
            <>
              <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/40 p-3">
                <div className="mb-2 hidden grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_140px_120px] gap-3 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 md:grid">
                  <span>Patient</span>
                  <span>Service</span>
                  <span>Schedule</span>
                  <span className="text-center">Status</span>
                  <span>Created</span>
                </div>

                <ul className="space-y-2">
                  {filteredAppointments.map((appointment) => {
                    const startDate = getStartDate(appointment);
                    const endDate = getEndDate(appointment);

                    return (
                      <li
                        key={appointment.id}
                        className="rounded-xl border border-slate-200/80 bg-white p-3 transition-all hover:border-cyan-200 hover:shadow-sm md:grid md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_140px_120px] md:items-center md:gap-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-[#01377D]">
                            {appointment.patient?.user?.name || 'N/A'} <span className="text-xs text-slate-400">#{appointment.id}</span>
                          </p>
                          <p className="mt-0.5 text-xs text-[#009DD1]">
                            {appointment.patient?.user?.email || 'N/A'}
                          </p>
                        </div>

                        <div className="mt-2 md:mt-0">
                          <p className="text-sm text-slate-800">{resolveAppointmentType(appointment) || 'N/A'}</p>
                        </div>

                        <div className="mt-2 md:mt-0">
                          <p className="text-sm text-slate-800">{startDate ? format(startDate, 'PPP') : 'N/A'}</p>
                          <p className="text-xs text-slate-500">
                            {startDate ? format(startDate, 'h:mm a') : 'N/A'}
                            {endDate ? ` – ${format(endDate, 'h:mm a')}` : ''}
                          </p>
                        </div>

                        <div className="mt-2 md:mt-0 md:justify-self-center">
                          <Badge variant="outline" className={getStatusBadgeVariant(appointment.status)}>
                            {formatStatus(appointment.status)}
                          </Badge>
                        </div>

                        <div className="mt-2 text-xs text-slate-500 md:mt-0">
                          {appointment.created_at ? format(new Date(appointment.created_at), 'PP') : 'N/A'}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">
                  Showing {pageStartIndex}-{pageEndIndex} of {totalCount} appointments
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="h-8 border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-xs text-slate-500">
                    Page {currentPage} of {Math.max(1, totalPages)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === Math.max(1, totalPages)}
                    className="h-8 border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Appointments;
