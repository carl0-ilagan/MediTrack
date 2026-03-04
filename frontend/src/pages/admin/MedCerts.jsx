// Admin MedCert Monitoring (View Only)
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { FileText, Search, Filter, ChevronLeft, ChevronRight, AlertCircle, Sparkles } from 'lucide-react';
import { getAllMedCerts } from '../../api/AdminDashboard';
import { toast } from 'sonner';
import { format } from 'date-fns';
import AdminPageSkeleton from '../../components/admin/AdminPageSkeleton';

export const MedCerts = () => {
  const [medcerts, setMedcerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadMedCerts();
  }, [currentPage, statusFilter]);

  const loadMedCerts = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        per_page: 50,
        ...(statusFilter !== 'all' && { status: statusFilter })
      };
      const response = await getAllMedCerts(params);
      
      // Handle both wrapped and direct data response structures
      const payload = response.data?.data || response.data;
      const medcertsData = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
      
      setMedcerts(medcertsData);
      setTotalPages(payload?.last_page || 1);
    } catch (err) {
      console.error('Failed to load medical certificates:', err);
      toast.error('Failed to load medical certificates');
      setMedcerts([]);
    } finally {
      setLoading(false);
    }
  };

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

  const filteredMedCerts = medcerts.filter(cert => {
    const matchesSearch = 
      cert.patient?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.patient?.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.purpose?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (loading) {
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
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-slate-200/80 bg-white/95 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-900">
              {medcerts.length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 bg-white/95 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-yellow-600 font-bold">
              {medcerts.filter(c => c.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 bg-white/95 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-green-600 font-bold">
              {medcerts.filter(c => c.status === 'approved').length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 bg-white/95 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-red-600 font-bold">
              {medcerts.filter(c => c.status === 'rejected').length}
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
                placeholder="Search by patient name, email, or diagnosis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-200 bg-white focus:border-cyan-500 focus:ring-cyan-500"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 border-slate-200 bg-white focus:border-cyan-500 focus:ring-cyan-500">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-slate-200 bg-white">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* MedCerts Table */}
      <Card className="border-slate-200/80 bg-white/95 shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900">All Medical Certificates</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMedCerts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No medical certificates found</p>
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
                      <TableHead className="text-slate-700">Duration</TableHead>
                      <TableHead className="text-slate-700">Status</TableHead>
                      <TableHead className="text-slate-700">Reviewed By</TableHead>
                      <TableHead className="text-slate-700">Requested</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMedCerts.map((cert) => (
                      <TableRow key={cert.id}>
                        <TableCell className="font-medium text-slate-900">
                          #{cert.id}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900">
                              {cert.patient?.user?.name || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {cert.patient?.user?.email || 'N/A'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-slate-800">
                          {cert.type || 'N/A'}
                        </TableCell>
                        <TableCell className="text-slate-800">
                          {cert.start_date && cert.end_date ? (
                            <div>
                              <p>{format(new Date(cert.start_date), 'PP')}</p>
                              <p className="text-sm text-gray-500">
                                to {format(new Date(cert.end_date), 'PP')}
                              </p>
                            </div>
                          ) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={getStatusBadgeVariant(cert.status)}
                          >
                            {cert.status || 'unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {cert.approved_by ? (
                            <div>
                              <p className="text-sm text-slate-800">
                                {cert.approved_by_user?.name || `User #${cert.approved_by}`}
                              </p>
                              <p className="text-xs text-gray-500">
                                {cert.approved_at 
                                  ? format(new Date(cert.approved_at), 'PP')
                                  : 'N/A'}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Not reviewed</span>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {cert.created_at 
                            ? format(new Date(cert.created_at), 'PP')
                            : 'N/A'}
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

export default MedCerts;
