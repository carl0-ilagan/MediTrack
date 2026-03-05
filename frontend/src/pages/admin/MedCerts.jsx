// Admin MedCert Monitoring (View Only)
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  FileText,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Sparkles,
  ChevronDown,
  Check,
  X,
  Loader2,
  Layers3,
  Clock3,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { getAllMedCerts } from '../../api/AdminDashboard';
import { toast } from 'sonner';
import { format } from 'date-fns';
import AdminPageSkeleton from '../../components/admin/AdminPageSkeleton';

export const MedCerts = () => {
  const MEDCERTS_PER_PAGE = 10;
  const STATUS_OPTIONS = useMemo(() => ([
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ]), []);

  const [medcerts, setMedcerts] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(MEDCERTS_PER_PAGE);
  const filterMenuRef = useRef(null);

  useEffect(() => {
    loadMedCerts();
  }, [currentPage, statusFilter]);

  const loadMedCerts = async () => {
    try {
      if (initialLoading) {
        setInitialLoading(true);
      } else {
        setTableLoading(true);
      }
      const params = {
        page: currentPage,
        per_page: MEDCERTS_PER_PAGE,
        ...(statusFilter !== 'all' && { status: statusFilter })
      };
      const response = await getAllMedCerts(params);
      
      // Handle both wrapped and direct data response structures
      const payload = response.data?.data || response.data;
      const medcertsData = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
      
      setMedcerts(medcertsData);
      setTotalPages(payload?.last_page || 1);
      setTotalCount(payload?.total ?? medcertsData.length);
      setPageSize(payload?.per_page || MEDCERTS_PER_PAGE);
    } catch (err) {
      console.error('Failed to load medical certificates:', err);
      toast.error('Failed to load medical certificates');
      setMedcerts([]);
      setTotalPages(1);
      setTotalCount(0);
      setPageSize(MEDCERTS_PER_PAGE);
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

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const filteredMedCerts = medcerts.filter((cert) => {
    const query = searchTerm.toLowerCase();
    const name = cert.patient?.user?.name?.toLowerCase() || '';
    const email = cert.patient?.user?.email?.toLowerCase() || '';
    const type = cert.type?.toLowerCase() || '';
    const purpose = cert.purpose?.toLowerCase() || '';
    const status = (cert.status || '').toLowerCase();
    const matchesStatus = statusFilter === 'all' || status === statusFilter;

    if (!matchesStatus) return false;
    if (!query) return true;

    return name.includes(query) || email.includes(query) || type.includes(query) || purpose.includes(query);
  });

  const statusCounts = useMemo(() => {
    return medcerts.reduce((acc, cert) => {
      const key = (cert?.status || '').toLowerCase();
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [medcerts]);

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
          Medical certificate panel
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
          <AlertCircle className="h-4 w-4" />
          View Only - Clinicians handle approvals
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-cyan-100 bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-700 p-5 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 left-20 h-36 w-36 rounded-full bg-cyan-300/20 blur-2xl" />
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs">
          <Sparkles className="h-3.5 w-3.5" />
          Request monitoring
        </div>
        <h2 className="mt-2 text-2xl font-semibold">Medical Certificate Monitoring</h2>
        <p className="mt-3 max-w-2xl text-sm text-cyan-100/90">Quickly review medical certificate volume, status distribution, and patient request details.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200/80 bg-gradient-to-b from-white to-slate-50 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Total Requests</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{totalCount}</p>
                <p className="mt-1 text-xs text-slate-500">All med cert requests in current dataset</p>
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
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">Pending Review</p>
                <p className="mt-3 text-3xl font-semibold text-amber-700">{statusCounts.pending || 0}</p>
                <p className="mt-1 text-xs text-amber-700/80">Waiting for clinician decision</p>
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
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Approved</p>
                <p className="mt-3 text-3xl font-semibold text-emerald-700">{statusCounts.approved || 0}</p>
                <p className="mt-1 text-xs text-emerald-700/80">Validated and released requests</p>
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
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-rose-700">Rejected</p>
                <p className="mt-3 text-3xl font-semibold text-rose-700">{statusCounts.rejected || 0}</p>
                <p className="mt-1 text-xs text-rose-700/80">Requests that did not pass review</p>
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
                placeholder="Search by patient name, email, or diagnosis..."
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
            Showing <span className="font-medium text-slate-700">{filteredMedCerts.length}</span> certificate request{filteredMedCerts.length === 1 ? '' : 's'}
            {statusFilter !== 'all' ? ` • Filtered: ${selectedStatusLabel}` : ''}
          </div>
        </CardContent>
      </Card>

      {/* MedCerts Table */}
      <Card className="border-slate-200/80 bg-white/95 shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900">All Medical Certificates</CardTitle>
        </CardHeader>
        <CardContent>
          {tableLoading && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs text-cyan-700">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Updating table...
            </div>
          )}
          {filteredMedCerts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No medical certificates found</p>
            </div>
          ) : (
            <>
              <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/40 p-3">
                <div className="mb-2 hidden grid-cols-[minmax(0,1.45fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_130px_minmax(0,1fr)_110px] gap-3 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 md:grid">
                  <span>Patient</span>
                  <span>Type</span>
                  <span>Duration</span>
                  <span className="text-center">Status</span>
                  <span>Reviewed By</span>
                  <span>Requested</span>
                </div>

                <ul className="space-y-2">
                  {filteredMedCerts.map((cert) => (
                    <li
                      key={cert.id}
                      className="rounded-xl border border-slate-200/80 bg-white p-3 transition-all hover:border-cyan-200 hover:shadow-sm md:grid md:grid-cols-[minmax(0,1.45fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_130px_minmax(0,1fr)_110px] md:items-center md:gap-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-[#01377D]">
                          {cert.patient?.user?.name || 'N/A'} <span className="text-xs text-slate-400">#{cert.id}</span>
                        </p>
                        <p className="mt-0.5 text-xs text-[#009DD1]">
                          {cert.patient?.user?.email || 'N/A'}
                        </p>
                      </div>

                      <div className="mt-2 md:mt-0">
                        <p className="text-sm text-slate-800">{cert.type || 'N/A'}</p>
                        {cert.purpose ? <p className="text-xs text-slate-500">{cert.purpose}</p> : null}
                      </div>

                      <div className="mt-2 md:mt-0">
                        {cert.start_date && cert.end_date ? (
                          <>
                            <p className="text-sm text-slate-800">{format(new Date(cert.start_date), 'PP')}</p>
                            <p className="text-xs text-slate-500">to {format(new Date(cert.end_date), 'PP')}</p>
                          </>
                        ) : (
                          <p className="text-sm text-slate-500">N/A</p>
                        )}
                      </div>

                      <div className="mt-2 md:mt-0 md:justify-self-center">
                        <Badge variant="outline" className={getStatusBadgeVariant(cert.status)}>
                          {cert.status || 'unknown'}
                        </Badge>
                      </div>

                      <div className="mt-2 md:mt-0">
                        {cert.approved_by ? (
                          <>
                            <p className="text-sm text-slate-800">
                              {cert.approved_by_user?.name || `User #${cert.approved_by}`}
                            </p>
                            <p className="text-xs text-slate-500">
                              {cert.approved_at ? format(new Date(cert.approved_at), 'PP') : 'N/A'}
                            </p>
                          </>
                        ) : (
                          <span className="text-sm text-slate-400">Not reviewed</span>
                        )}
                      </div>

                      <div className="mt-2 text-xs text-slate-500 md:mt-0">
                        {cert.created_at ? format(new Date(cert.created_at), 'PP') : 'N/A'}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">
                  Showing {pageStartIndex}-{pageEndIndex} of {totalCount} certificate requests
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
                    onClick={() => setCurrentPage((prev) => Math.min(Math.max(1, totalPages), prev + 1))}
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

export default MedCerts;
