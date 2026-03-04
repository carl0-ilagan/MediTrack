// RequestManagement.jsx - Medical Certificate Approval with Real Data
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { FileBadge, Search, CheckCircle, XCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getMedCerts, getPendingMedCerts, approveMedCert, rejectMedCert, markMedCertCompleted } from '../../api/ClinicianDashboard';
import { toast } from 'sonner';
import { format } from 'date-fns';
import api from '../../api/axios';
import StaffRoleBanner from '../../components/staff/StaffRoleBanner';
import StaffPageSkeleton from '../../components/staff/StaffPageSkeleton';

export const RequestManagement = () => {
  const [medCerts, setMedCerts] = useState([]);
  const [allMedCerts, setAllMedCerts] = useState([]); // Keep all records for counting
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // Items per page
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCert, setSelectedCert] = useState(null);
  const [actionDialog, setActionDialog] = useState({ open: false, type: null });
  const [reason, setReason] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [noShowId, setNoShowId] = useState(null);
  const [completedId, setCompletedId] = useState(null);

  useEffect(() => {
    loadMedCerts();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when tab changes
  }, [activeTab]);

  const loadMedCerts = async () => {
    try {
      setLoading(true);
      // Load ALL medcerts without status filter to get accurate counts
      const response = await getMedCerts({ per_page: 999 });
      const allData = response.data.data || [];
      
      setAllMedCerts(allData);
      setMedCerts(allData);
      setTotalPages(1); // All data loaded, so only 1 page
    } catch (err) {
      console.error('Failed to load medical certificates:', err);
      toast.error('Failed to load medical certificates');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedCert) return;

    try {
      setProcessing(true);
      await approveMedCert(selectedCert.id, {
        pickup_date: pickupDate || null,
      });
      toast.success('Medical certificate approved successfully');
      setActionDialog({ open: false, type: null });
      setSelectedCert(null);
      setPickupDate('');
      loadMedCerts();
    } catch (err) {
      console.error('Failed to approve medical certificate:', err);
      toast.error(err.response?.data?.message || 'Failed to approve medical certificate');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedCert || !reason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessing(true);
      await rejectMedCert(selectedCert.id, reason);
      toast.success('Medical certificate rejected');
      setActionDialog({ open: false, type: null });
      setSelectedCert(null);
      setReason('');
      loadMedCerts();
    } catch (err) {
      console.error('Failed to reject medical certificate:', err);
      toast.error(err.response?.data?.message || 'Failed to reject medical certificate');
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkNoShow = async (certId) => {
    if (!certId) return;

    try {
      setNoShowId(certId);
      await api.post(`/api/med-certs/${certId}/no-show`);
      toast.success('Certificate marked as no-show');
      loadMedCerts();
    } catch (err) {
      console.error('Failed to mark as no-show:', err);
      toast.error(err.response?.data?.message || 'Failed to mark as no-show');
    } finally {
      setNoShowId(null);
    }
  };

  const handleMarkCompleted = async (certId) => {
    if (!certId) return;

    try {
      setCompletedId(certId);
      await markMedCertCompleted(certId);
      toast.success('Certificate marked as completed');
      loadMedCerts();
    } catch (err) {
      console.error('Failed to mark as completed:', err);
      toast.error(err.response?.data?.message || 'Failed to mark as completed');
    } finally {
      setCompletedId(null);
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
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'no-show':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const filteredCerts = medCerts.filter(cert => {
    const matchesSearch = 
      cert.patient?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.patient?.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.purpose?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by tab status
    if (activeTab === 'pending') {
      return matchesSearch && cert.status === 'pending';
    } else if (activeTab === 'approved') {
      return matchesSearch && cert.status === 'approved';
    } else if (activeTab === 'rejected') {
      return matchesSearch && cert.status === 'rejected';
    } else if (activeTab === 'completed') {
      return matchesSearch && cert.status === 'completed';
    } else if (activeTab === 'no-show') {
      return matchesSearch && cert.status === 'no-show';
    }
    
    return matchesSearch;
  });

  // Calculate counts from ALL data (not just filtered)
  const pendingCount = allMedCerts.filter(c => c.status === 'pending').length;
  const approvedCount = allMedCerts.filter(c => c.status === 'approved').length;
  const rejectedCount = allMedCerts.filter(c => c.status === 'rejected').length;
  const completedCount = allMedCerts.filter(c => c.status === 'completed').length;
  const noShowCount = allMedCerts.filter(c => c.status === 'no-show').length;

  // Pagination logic for current tab
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCerts = filteredCerts.slice(startIndex, endIndex);
  const tabTotalPages = Math.ceil(filteredCerts.length / pageSize);

  const renderDataTable = () => {
    if (filteredCerts.length === 0) {
      return (
        <Card className="border-[#97E7F5] shadow-sm bg-white">
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <FileBadge className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No {activeTab} certificate requests</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border-[#97E7F5] shadow-sm bg-white">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-[#97E7F5]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-[#01377D]">Patient</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#01377D]">Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#01377D]">Period</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#01377D]">Purpose</th>
                  {activeTab === 'rejected' && <th className="px-4 py-3 text-left font-semibold text-[#01377D]">Reason</th>}
                  {activeTab === 'approved' && <th className="px-4 py-3 text-left font-semibold text-[#01377D]">Pickup Date</th>}
                  <th className="px-4 py-3 text-left font-semibold text-[#01377D]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#97E7F5]">
                {paginatedCerts.map((cert) => (
                  <tr key={cert.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-[#01377D]">{cert.patient?.user?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{cert.patient?.user?.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#01377D]">{cert.type || 'N/A'}</td>
                    <td className="px-4 py-3 text-[#01377D] text-xs">
                      {cert.start_date && cert.end_date
                        ? `${format(new Date(cert.start_date), 'PP')} - ${format(new Date(cert.end_date), 'PP')}`
                        : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-[#01377D] max-w-xs truncate">{cert.purpose || 'N/A'}</td>
                    {activeTab === 'rejected' && <td className="px-4 py-3 text-red-600 text-xs">{cert.rejection_reason || 'N/A'}</td>}
                    {activeTab === 'approved' && <td className="px-4 py-3 text-[#01377D]">{cert.pickup_date ? format(new Date(cert.pickup_date), 'PP') : 'Not set'}</td>}
                    <td className="px-4 py-3">
                      <div className="flex gap-2 flex-wrap">
                        {activeTab === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedCert(cert);
                                setActionDialog({ open: true, type: 'approve' });
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white text-xs"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedCert(cert);
                                setActionDialog({ open: true, type: 'reject' });
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white text-xs"
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {activeTab === 'approved' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleMarkCompleted(cert.id)}
                              disabled={completedId === cert.id}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                            >
                              {completedId === cert.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Completed'}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleMarkNoShow(cert.id)}
                              disabled={noShowId === cert.id}
                              className="bg-orange-600 hover:bg-orange-700 text-white text-xs"
                            >
                              {noShowId === cert.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'No Show'}
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {tabTotalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#97E7F5]">
              <p className="text-sm text-gray-500">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredCerts.length)} of {filteredCerts.length}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="border-[#97E7F5]"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2 px-3 py-1 text-sm text-[#01377D]">
                  Page {currentPage} of {tabTotalPages}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(tabTotalPages, prev + 1))}
                  disabled={currentPage === tabTotalPages}
                  className="border-[#97E7F5]"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return <StaffPageSkeleton variant="tabs" rows={4} />;
  }

  return (
    <div className="space-y-6">
      <StaffRoleBanner
        title="Request Management"
        subtitle="Review and process medical certificate requests with clear status controls."
        primaryAction={{ label: 'Open Documents', to: '/clinician/documents' }}
      />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#01377D]">Medical Certificate Requests</h1>
          <p className="text-[#009DD1] mt-2">Review and approve medical certificate requests</p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full max-w-xs">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by name, email, type..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pr-10 border-[#97E7F5] focus:border-[#009DD1] focus:ring-[#009DD1]"
          />
        </div>
      </div>

      {/* Status Cards - Clickable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        <button
          onClick={() => { setActiveTab('pending'); setCurrentPage(1); }}
          className={`flex items-center gap-2 rounded-lg px-4 py-3 transition-all cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-yellow-100 border-2 border-yellow-600'
              : 'bg-yellow-50 border border-yellow-200 hover:border-yellow-400'
          }`}
        >
          <FileBadge className="w-5 h-5 text-yellow-600" />
          <div>
            <p className="text-xs text-yellow-600">Pending</p>
            <p className="text-lg font-bold text-yellow-800">{pendingCount}</p>
          </div>
        </button>
        <button
          onClick={() => { setActiveTab('approved'); setCurrentPage(1); }}
          className={`flex items-center gap-2 rounded-lg px-4 py-3 transition-all cursor-pointer ${
            activeTab === 'approved'
              ? 'bg-green-100 border-2 border-green-600'
              : 'bg-green-50 border border-green-200 hover:border-green-400'
          }`}
        >
          <FileBadge className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-xs text-green-600">Approved</p>
            <p className="text-lg font-bold text-green-800">{approvedCount}</p>
          </div>
        </button>
        <button
          onClick={() => { setActiveTab('rejected'); setCurrentPage(1); }}
          className={`flex items-center gap-2 rounded-lg px-4 py-3 transition-all cursor-pointer ${
            activeTab === 'rejected'
              ? 'bg-red-100 border-2 border-red-600'
              : 'bg-red-50 border border-red-200 hover:border-red-400'
          }`}
        >
          <FileBadge className="w-5 h-5 text-red-600" />
          <div>
            <p className="text-xs text-red-600">Rejected</p>
            <p className="text-lg font-bold text-red-800">{rejectedCount}</p>
          </div>
        </button>
        <button
          onClick={() => { setActiveTab('completed'); setCurrentPage(1); }}
          className={`flex items-center gap-2 rounded-lg px-4 py-3 transition-all cursor-pointer ${
            activeTab === 'completed'
              ? 'bg-blue-100 border-2 border-blue-600'
              : 'bg-blue-50 border border-blue-200 hover:border-blue-400'
          }`}
        >
          <FileBadge className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-xs text-blue-600">Completed</p>
            <p className="text-lg font-bold text-blue-800">{completedCount}</p>
          </div>
        </button>
        <button
          onClick={() => { setActiveTab('no-show'); setCurrentPage(1); }}
          className={`flex items-center gap-2 rounded-lg px-4 py-3 transition-all cursor-pointer ${
            activeTab === 'no-show'
              ? 'bg-gray-200 border-2 border-gray-600'
              : 'bg-gray-50 border border-gray-200 hover:border-gray-400'
          }`}
        >
          <FileBadge className="w-5 h-5 text-gray-600" />
          <div>
            <p className="text-xs text-gray-600">No Show</p>
            <p className="text-lg font-bold text-gray-800">{noShowCount}</p>
          </div>
        </button>
      </div>

      {/* DataTable */}
      {renderDataTable()}

      {/* Action Dialogs */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => {
        if (!open) {
          setActionDialog({ open: false, type: null });
          setSelectedCert(null);
          setReason('');
          setPickupDate('');
        }
      }}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#01377D]">
              {actionDialog.type === 'approve' ? 'Approve Medical Certificate' : 'Reject Medical Certificate'}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {actionDialog.type === 'approve'
                ? 'Review and approve this medical certificate request. Set a pickup date if needed.'
                : 'Please provide a reason for rejecting this medical certificate request.'}
            </DialogDescription>
          </DialogHeader>

          {selectedCert && (
            <div className="py-4 space-y-4">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Patient:</span> {selectedCert.patient?.user?.name}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Type:</span> {selectedCert.type}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Purpose:</span> {selectedCert.purpose}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Period:</span> {selectedCert.start_date && selectedCert.end_date ? `${format(new Date(selectedCert.start_date), 'PP')} - ${format(new Date(selectedCert.end_date), 'PP')}` : 'N/A'}
              </p>

              {actionDialog.type === 'approve' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#01377D] block">
                    Pickup Date *
                  </label>
                  <Input
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="bg-white border-[#97E7F5] focus:border-[#009DD1] focus:ring-[#009DD1]"
                  />
                  <p className="text-xs text-gray-500">
                    Set the date when the patient can pick up their certificate from the clinic.
                  </p>
                </div>
              )}

              {actionDialog.type === 'reject' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#01377D] mb-2 block">
                    Rejection Reason *
                  </label>
                  <Textarea
                    placeholder="Enter reason for rejection..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="bg-white border-[#97E7F5] focus:border-[#009DD1] focus:ring-[#009DD1]"
                    rows={4}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionDialog({ open: false, type: null });
                setSelectedCert(null);
                setReason('');
                setPickupDate('');
              }}
              disabled={processing}
              className="border-[#97E7F5]"
            >
              Cancel
            </Button>
            <Button
              onClick={actionDialog.type === 'approve' ? handleApprove : handleReject}
              disabled={processing || (actionDialog.type === 'reject' && !reason.trim()) || (actionDialog.type === 'approve' && !pickupDate.trim())}
              className={actionDialog.type === 'approve'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'}
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {actionDialog.type === 'approve' ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequestManagement;