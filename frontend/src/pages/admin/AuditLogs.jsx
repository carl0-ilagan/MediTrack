// Admin Audit Log Viewer
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  Shield,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ChevronDown,
  Check,
  X,
  Loader2,
  Layers3,
  Clock3,
  Users,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import api from '../../api/axios';
import AdminPageSkeleton from '../../components/admin/AdminPageSkeleton';

export const AuditLogs = () => {
  const AUDIT_LOGS_PER_PAGE = 10;
  const EVENT_OPTIONS = useMemo(() => ([
    { value: 'all', label: 'All Events' },
    { value: 'created', label: 'Created' },
    { value: 'updated', label: 'Updated' },
    { value: 'requested', label: 'Requested' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'marked', label: 'Marked' },
    { value: 'completed', label: 'Completed' },
  ]), []);

  const [logs, setLogs] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [isEventFilterOpen, setIsEventFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [perPage, setPerPage] = useState(AUDIT_LOGS_PER_PAGE);
  const eventFilterMenuRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [eventFilter]);

  useEffect(() => {
    loadAuditLogs();
  }, [currentPage, eventFilter, debouncedSearchTerm]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (eventFilterMenuRef.current && !eventFilterMenuRef.current.contains(event.target)) {
        setIsEventFilterOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsEventFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const loadAuditLogs = async () => {
    try {
      if (initialLoading) {
        setInitialLoading(true);
      } else {
        setTableLoading(true);
      }

      const params = {
        page: currentPage,
        per_page: AUDIT_LOGS_PER_PAGE,
        ...(eventFilter !== 'all' && { event: eventFilter }),
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
      };

      const response = await api.get('/api/activity-logs', { params });
      const data = response.data;
      const logsData = data?.data?.data || [];
      const requestedPerPage = data?.data?.per_page || AUDIT_LOGS_PER_PAGE;
      const computedTotal = data?.data?.total ?? logsData.length;

      setLogs(Array.isArray(logsData) ? logsData : []);
      setTotalPages(data?.data?.last_page || 1);
      setTotalRecords(computedTotal);
      setPerPage(requestedPerPage);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      toast.error('Failed to load audit logs');
      setLogs([]);
      setTotalPages(1);
      setTotalRecords(0);
      setPerPage(AUDIT_LOGS_PER_PAGE);
    } finally {
      setInitialLoading(false);
      setTableLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const query = debouncedSearchTerm.toLowerCase();
    const userName = log.causer?.name?.toLowerCase() || '';
    const userEmail = log.causer?.email?.toLowerCase() || '';
    const modelName = log.subject_type ? log.subject_type.split('\\').pop().toLowerCase() : '';
    const description = log.description?.toLowerCase() || '';
    const matchesEvent = eventFilter === 'all' || description.includes(eventFilter);

    if (!matchesEvent) return false;
    if (!query) return true;
    return userName.includes(query) || userEmail.includes(query) || modelName.includes(query) || description.includes(query);
  });

  const getEventBadgeVariant = (description) => {
    const descLower = description?.toLowerCase() || '';
    if (descLower.includes('created') || descLower.includes('requested')) {
      return 'bg-green-100 text-green-800 border-green-300';
    }
    if (descLower.includes('updated') || descLower.includes('marked')) {
      return 'bg-blue-100 text-blue-800 border-blue-300';
    }
    if (descLower.includes('deleted') || descLower.includes('cancelled')) {
      return 'bg-red-100 text-red-800 border-red-300';
    }
    if (descLower.includes('login') || descLower.includes('logout')) {
      return 'bg-purple-100 text-purple-800 border-purple-300';
    }
    if (descLower.includes('approved') || descLower.includes('rejected') || descLower.includes('confirmed') || descLower.includes('no_show') || descLower.includes('completed')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const selectedEventLabel = EVENT_OPTIONS.find((option) => option.value === eventFilter)?.label || 'All Events';
  const todayCount = logs.filter((log) => {
    if (!log?.created_at) return false;
    return new Date(log.created_at).toDateString() === new Date().toDateString();
  }).length;
  const uniqueUsersCount = new Set(logs.map((log) => log.causer_id).filter(Boolean)).size;
  const pageStartIndex = totalRecords > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const pageEndIndex = totalRecords > 0 ? Math.min(currentPage * perPage, totalRecords) : 0;

  if (initialLoading) {
    return <AdminPageSkeleton variant="table" rows={5} />;
  }

  return (
    <div className="space-y-6">
      <div className="hidden rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm md:flex md:items-center md:justify-between">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">
          <Sparkles className="h-3.5 w-3.5 text-cyan-600" />
          Audit panel
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">
          <Shield className="h-4 w-4 text-cyan-600" />
          Security Monitoring
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-cyan-100 bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-700 p-5 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 left-20 h-36 w-36 rounded-full bg-cyan-300/20 blur-2xl" />
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs">
          <Sparkles className="h-3.5 w-3.5" />
          Compliance insights
        </div>
        <h2 className="mt-2 text-2xl font-semibold">Audit Logs</h2>
        <p className="mt-3 max-w-2xl text-sm text-cyan-100/90">Inspect key events, identify risky activities, and audit user actions faster with cleaner filtering.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200/80 bg-gradient-to-b from-white to-slate-50 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Total Activities</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{totalRecords}</p>
                <p className="mt-1 text-xs text-slate-500">All tracked events in dataset</p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700">
                <Layers3 className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200/60 bg-gradient-to-b from-white to-blue-50/40 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">Today</p>
                <p className="mt-3 text-3xl font-semibold text-blue-700">{todayCount}</p>
                <p className="mt-1 text-xs text-blue-700/80">Events created today</p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-blue-700">
                <Clock3 className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-violet-200/60 bg-gradient-to-b from-white to-violet-50/40 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-violet-700">Unique Users</p>
                <p className="mt-3 text-3xl font-semibold text-violet-700">{uniqueUsersCount}</p>
                <p className="mt-1 text-xs text-violet-700/80">Different users in current page</p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-100 text-violet-700">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-cyan-200/60 bg-gradient-to-b from-white to-cyan-50/40 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700">Last Activity</p>
                <p className="mt-3 text-xl font-semibold text-cyan-700">
                  {logs.length > 0 && logs[0]?.created_at ? format(new Date(logs[0].created_at), 'hh:mm a') : 'N/A'}
                </p>
                <p className="mt-1 text-xs text-cyan-700/80">
                  {logs.length > 0 && logs[0]?.created_at ? format(new Date(logs[0].created_at), 'PP') : 'No activity'}
                </p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-100 text-cyan-700">
                <Activity className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200/80 bg-white/95 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative w-full flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by user, event, or model type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 border-slate-200 bg-white pl-10 pr-9 transition-all duration-200 focus:border-cyan-500 focus:ring-cyan-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Clear audit search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div ref={eventFilterMenuRef} className="relative w-full md:w-56">
              <button
                type="button"
                onClick={() => setIsEventFilterOpen((prev) => !prev)}
                className="flex h-11 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 transition-all duration-200 hover:border-cyan-400 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                aria-expanded={isEventFilterOpen}
                aria-haspopup="listbox"
              >
                <span className="inline-flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  {selectedEventLabel}
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isEventFilterOpen ? 'rotate-180' : 'rotate-0'}`} />
              </button>

              <div
                className={`absolute right-0 z-30 mt-2 w-full origin-top rounded-md border border-slate-200 bg-white p-1.5 shadow-lg transition-all duration-200 ${
                  isEventFilterOpen
                    ? 'translate-y-0 scale-100 opacity-100'
                    : 'pointer-events-none -translate-y-1 scale-95 opacity-0'
                }`}
                role="listbox"
              >
                {EVENT_OPTIONS.map((option) => {
                  const isActive = option.value === eventFilter;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setEventFilter(option.value);
                        setIsEventFilterOpen(false);
                      }}
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
            Showing <span className="font-medium text-slate-700">{filteredLogs.length}</span> audit event{filteredLogs.length === 1 ? '' : 's'}
            {eventFilter !== 'all' ? ` • Filtered: ${selectedEventLabel}` : ''}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 bg-white/95 shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900">Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          {tableLoading && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs text-cyan-700">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Updating table...
            </div>
          )}

          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No audit logs found</p>
            </div>
          ) : (
            <>
              <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/40 p-3">
                <div className="mb-2 hidden grid-cols-[minmax(0,1.05fr)_minmax(0,1.15fr)_180px_140px_minmax(0,1.25fr)] gap-3 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 md:grid">
                  <span>Timestamp</span>
                  <span>User</span>
                  <span className="text-center">Event</span>
                  <span>Model</span>
                  <span>Description</span>
                </div>

                <ul className="space-y-2">
                  {filteredLogs.map((log) => (
                    <li
                      key={log.id}
                      className="rounded-xl border border-slate-200/80 bg-white p-3 transition-all hover:border-cyan-200 hover:shadow-sm md:grid md:grid-cols-[minmax(0,1.05fr)_minmax(0,1.15fr)_180px_140px_minmax(0,1.25fr)] md:items-center md:gap-3"
                    >
                      <div>
                        <p className="text-sm text-slate-800">{log.created_at ? format(new Date(log.created_at), 'PP') : 'N/A'}</p>
                        <p className="text-xs text-slate-500">{log.created_at ? format(new Date(log.created_at), 'pp') : 'N/A'}</p>
                      </div>

                      <div className="mt-2 md:mt-0">
                        <p className="text-sm font-medium text-slate-900">{log.causer?.name || 'System'}</p>
                        <p className="text-xs text-slate-500">{log.causer?.email || 'N/A'}</p>
                      </div>

                      <div className="mt-2 md:mt-0 md:justify-self-center">
                        <Badge
                          variant="outline"
                          className={`${getEventBadgeVariant(log.description)} max-w-full whitespace-normal break-words text-center`}
                        >
                          {log.description || 'unknown'}
                        </Badge>
                      </div>

                      <div className="mt-2 text-xs font-mono text-slate-600 md:mt-0">
                        {log.subject_type ? log.subject_type.split('\\').pop() : 'N/A'}
                      </div>

                      <div className="mt-2 text-sm text-slate-700 md:mt-0">
                        <p className="line-clamp-2">{log.description || 'No details'}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">
                  Showing {pageStartIndex}-{pageEndIndex} of {totalRecords} audit results
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

export default AuditLogs;
