// Admin Audit Log Viewer
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Shield, Search, Filter, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import api from '../../api/axios';
import AdminPageSkeleton from '../../components/admin/AdminPageSkeleton';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [perPage] = useState(10);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when search changes
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filter changes
    loadAuditLogs();
  }, [eventFilter]);

  useEffect(() => {
    loadAuditLogs();
  }, [currentPage, debouncedSearchTerm]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        per_page: perPage,
        ...(eventFilter !== 'all' && { event: eventFilter }),
        ...(debouncedSearchTerm && { search: debouncedSearchTerm })
      };
      
      const response = await api.get('/api/activity-logs', { params });
      const data = response.data;
      
      // Handle the API response structure: response.data.data is the pagination object
      const logsData = data?.data?.data || [];
      setLogs(Array.isArray(logsData) ? logsData : []);
      setTotalPages(data?.data?.last_page || 1);
      setTotalRecords(data?.data?.total || 0);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      toast.error('Failed to load audit logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getEventBadgeVariant = (description) => {
    const descLower = description?.toLowerCase() || '';
    if (descLower.includes('created') || descLower.includes('requested')) {
      return 'bg-green-100 text-green-800 border-green-300';
    } else if (descLower.includes('updated') || descLower.includes('marked')) {
      return 'bg-blue-100 text-blue-800 border-blue-300';
    } else if (descLower.includes('deleted') || descLower.includes('cancelled')) {
      return 'bg-red-100 text-red-800 border-red-300';
    } else if (descLower.includes('login') || descLower.includes('logout')) {
      return 'bg-purple-100 text-purple-800 border-purple-300';
    } else if (descLower.includes('approved') || descLower.includes('rejected') || descLower.includes('confirmed') || descLower.includes('no_show') || descLower.includes('completed')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  if (loading) {
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

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-slate-200/80 bg-white/95 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Total Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-900">
              {totalRecords}
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 bg-white/95 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-blue-600 font-bold">
              {logs.filter(log => {
                const logDate = new Date(log.created_at);
                const today = new Date();
                return logDate.toDateString() === today.toDateString();
              }).length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 bg-white/95 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Unique Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-purple-600 font-bold">
              {new Set(logs.map(log => log.causer_id).filter(Boolean)).size}
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 bg-white/95 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Last Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium text-slate-800">
              {logs.length > 0 && logs[0]?.created_at
                ? format(new Date(logs[0].created_at), 'pp')
                : 'No activity'}
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
                placeholder="Search by user, event, or model type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-200 bg-white focus:border-cyan-500 focus:ring-cyan-500"
              />
            </div>
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="w-48 border-slate-200 bg-white focus:border-cyan-500 focus:ring-cyan-500">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-slate-200 bg-white">
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="updated">Updated</SelectItem>
                <SelectItem value="requested">Requested</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="marked">Marked</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card className="border-slate-200/80 bg-white/95 shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900">Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No audit logs found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-slate-700">Timestamp</TableHead>
                      <TableHead className="text-slate-700">User</TableHead>
                      <TableHead className="text-slate-700">Event</TableHead>
                      <TableHead className="text-slate-700">Model Type</TableHead>
                      <TableHead className="text-slate-700">Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm text-slate-800">
                          <div>
                            <p>{format(new Date(log.created_at), 'PP')}</p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(log.created_at), 'pp')}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900">
                              {log.causer?.name || 'System'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {log.causer?.email || 'N/A'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={getEventBadgeVariant(log.description)}
                          >
                            {log.description || 'unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600 text-sm font-mono">
                          {log.subject_type ? log.subject_type.split('\\').pop() : 'N/A'}
                        </TableCell>
                        <TableCell className="max-w-md text-slate-800">
                          <p className="truncate text-sm">
                            {log.description || 'No details'}
                          </p>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-6">
                  <p className="text-sm text-gray-500">
                    Showing {logs.length > 0 ? ((currentPage - 1) * perPage) + 1 : 0} to {Math.min(currentPage * perPage, totalRecords)} of {totalRecords} results
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

export default AuditLogs;
