// RequestCertificate.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { FileCheck, Calendar, Clock, Plus, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { createMedCert, getMedCerts, downloadMedCert } from '../../api/MedicalCertificates';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import PatientPageSkeleton from '../../components/patient/PatientPageSkeleton';
import PatientRoleBanner from '../../components/patient/PatientRoleBanner';

const statusStyles = {
  approved: 'bg-green-100 text-green-700 border-green-200',
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  'no-show': 'bg-gray-100 text-gray-700 border-gray-200',
  completed: 'bg-blue-100 text-blue-700 border-blue-200',
};

const titleCase = (value = '') =>
  value
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

const defaultForm = { type: '', reason: '', startDate: '', endDate: '', recommendations: '' };

export const RequestCertificate = () => {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [requests, setRequests] = useState([]);
  const [medcertTypes, setMedcertTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const cardClass =
    'border-[#D8EBFA] bg-white shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(2,132,199,0.12)]';
  const tabClass = (value) =>
    `rounded-full border px-4 text-xs sm:text-sm ${
      activeTab === value
        ? 'border-[#BFE6FB] bg-[#EAF5FF] text-[#0f2d57]'
        : 'border-[#D8EBFA] bg-white text-[#5A6F8F] hover:bg-[#F8FBFF] hover:text-[#0f2d57]'
    }`;

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getMedCerts({ per_page: 50 });
      const payload = response?.data;
      setRequests(Array.isArray(payload?.data) ? payload.data : []);
    } catch (error) {
      console.error('Failed to load certificates', error);
      toast.error('Unable to load certificate history');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMedcertTypes = useCallback(async () => {
    try {
      const response = await api.get('/api/medcert/types');
      console.log('Medcert types response:', response);
      
      // Extract types from the correct path in response
      const types = response?.data?.data?.types || response?.data?.types || [];
      
      if (!types || types.length === 0) {
        console.warn('No medical certificate types returned from API');
        toast.warning('No certificate types available. Please contact support.');
        setMedcertTypes([]);
        return;
      }
      
      const formattedTypes = types.map(t => ({
        value: t.type || t.reason || String(t.id),
        label: t.type || t.reason || 'Unknown Type',
      }));
      
      console.log('Formatted types:', formattedTypes);
      setMedcertTypes(formattedTypes);
    } catch (error) {
      console.error('Failed to load medical certificate types', error);
      toast.error('Unable to load certificate types. Please try again later.');
      setMedcertTypes([]);
    }
  }, []);

  useEffect(() => {
    loadRequests();
    loadMedcertTypes();
  }, [loadRequests, loadMedcertTypes]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.type || !form.reason || !form.startDate || !form.endDate) {
      toast.error('Please complete all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await createMedCert({
        type: form.type,
        start_date: form.startDate,
        end_date: form.endDate,
        purpose: form.reason,
        recommendations: form.recommendations || undefined,
      });
      toast.success('Certificate request submitted successfully!');
      setForm(defaultForm);
      setDialogOpen(false);
      loadRequests();
    } catch (error) {
      console.error('Failed to submit certificate', error);
      const message = error?.response?.data?.message || 'Unable to submit request';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (request) => {
    try {
      setDownloadingId(request.id);
      const response = await downloadMedCert(request.id);
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `med-cert-${request.certificate_number || request.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download certificate', error);
      toast.error('Unable to download certificate');
    } finally {
      setDownloadingId(null);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const rejectedRequests = requests.filter(r => r.status === 'rejected');
  const completedRequests = requests.filter(r => r.status === 'completed');
  const noShowRequests = requests.filter(r => r.status === 'no-show');

  const CertificateCard = ({ request, status }) => {
    const statusColor = statusStyles[status] || statusStyles.pending;
    const statusIcon = {
      approved: '✓',
      pending: '⏳',
      rejected: '✕',
    }[status] || '';

    return (
      <Card className={cardClass}>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-4 flex-1">
              <div className={`${status === 'approved' ? 'bg-green-50' : status === 'pending' ? 'bg-yellow-50' : 'bg-red-50'} p-4 rounded-lg`}>
                <FileCheck className={`w-6 h-6 ${status === 'approved' ? 'text-green-600' : status === 'pending' ? 'text-yellow-600' : 'text-red-600'}`} />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-[#01377D] text-lg font-semibold">
                  {request.type || 'Medical Certificate'}
                </h3>
                <p className="text-sm text-gray-600">
                  {request.medical_reason}
                </p>
                <div className="text-sm text-gray-500 space-y-1 mt-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(request.start_date), 'MMM d, yyyy')} - {format(new Date(request.end_date), 'MMM d, yyyy')}
                  </div>
                  {request.duration_days && (
                    <div className="text-xs text-gray-600">
                      Duration: {request.duration_days} day{request.duration_days !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                {status === 'pending' && (
                  <div className="mt-3 text-xs bg-yellow-50 border border-yellow-200 text-yellow-800 p-2 rounded">
                    ⏳ Waiting for clinic approval
                  </div>
                )}
                {status === 'rejected' && request.rejection_reason && (
                  <div className="mt-3 text-xs bg-red-50 border border-red-200 text-red-800 p-2 rounded">
                    Reason: {request.rejection_reason}
                  </div>
                )}
                {status === 'approved' && request.pickup_date && (
                  <div className="mt-3 text-xs bg-green-50 border border-green-200 text-green-800 p-2 rounded">
                    📅 Pickup Date: {format(new Date(request.pickup_date), 'MMM d, yyyy')}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={`capitalize border ${statusColor}`}>
                {statusIcon} {titleCase(status)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return <PatientPageSkeleton variant="tabs" rows={4} />;
  }

  return (
    <div className="space-y-6">
      <PatientRoleBanner
        title="Medical Certificates"
        subtitle="Request and monitor your certificate status in one place."
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#0f2d57]">Manage Certificate Requests</h1>
          <p className="mt-1 text-sm text-[#406A93]">Submit new requests and review approval progress.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex w-full items-center justify-center gap-2 bg-[#0ea5e9] text-white hover:bg-[#0284c7] sm:w-auto">
              <Plus className="w-4 h-4" />
              Request Certificate
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle>Request Medical Certificate</DialogTitle>
              <DialogDescription>
                Fill out the form to request a medical certificate
              </DialogDescription>
            </DialogHeader>

            <div className="p-3 rounded border border-dashed border-[#97E7F5] bg-[#f8fafc] text-sm text-[#01377D]">
              Your request will be reviewed and approved by clinic staff.
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cert-type">Certificate Type *</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, type: value }))}
                >
                  <SelectTrigger id="cert-type">
                    <SelectValue placeholder="Select certificate type" />
                  </SelectTrigger>
                  <SelectContent className="bg-blue-50">
                    {medcertTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date *</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date *</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Purpose *</Label>
                <Textarea
                  id="reason"
                  placeholder="What is the purpose of this certificate?..."
                  value={form.reason}
                  onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recommendations">Recommendations (Optional)</Label>
                <Textarea
                  id="recommendations"
                  placeholder="Any additional recommendations..."
                  value={form.recommendations}
                  onChange={(e) => setForm((prev) => ({ ...prev, recommendations: e.target.value }))}
                  rows={2}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setForm(defaultForm);
                    setDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#009DD1] text-white hover:bg-[#007ea8]"
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Submit Request'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-transparent gap-2 flex-wrap p-1">
          <TabsTrigger value="pending" className={tabClass('pending')}>
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className={tabClass('approved')}>
            Approved ({approvedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className={tabClass('rejected')}>
            Rejected ({rejectedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className={tabClass('completed')}>
            Completed ({completedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="no-show" className={tabClass('no-show')}>
            No Show ({noShowRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 pt-1 sm:pt-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#009DD1]" />
            </div>
          ) : pendingRequests.length === 0 ? (
            <Card className={cardClass}>
              <CardContent className="py-10 text-center text-gray-500">
                No pending certificate requests.
              </CardContent>
            </Card>
          ) : (
            pendingRequests.map((request) => (
              <CertificateCard key={request.id} request={request} status="pending" />
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4 pt-1 sm:pt-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#009DD1]" />
            </div>
          ) : approvedRequests.length === 0 ? (
            <Card className={cardClass}>
              <CardContent className="py-10 text-center text-gray-500">
                No approved certificate requests.
              </CardContent>
            </Card>
          ) : (
            approvedRequests.map((request) => (
              <CertificateCard key={request.id} request={request} status="approved" />
            ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4 pt-1 sm:pt-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#009DD1]" />
            </div>
          ) : rejectedRequests.length === 0 ? (
            <Card className={cardClass}>
              <CardContent className="py-10 text-center text-gray-500">
                No rejected certificate requests.
              </CardContent>
            </Card>
          ) : (
            rejectedRequests.map((request) => (
              <CertificateCard key={request.id} request={request} status="rejected" />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 pt-1 sm:pt-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#009DD1]" />
            </div>
          ) : completedRequests.length === 0 ? (
            <Card className={cardClass}>
              <CardContent className="py-10 text-center text-gray-500">
                No completed certificate requests.
              </CardContent>
            </Card>
          ) : (
            completedRequests.map((request) => (
              <CertificateCard key={request.id} request={request} status="completed" />
            ))
          )}
        </TabsContent>

        <TabsContent value="no-show" className="space-y-4 pt-1 sm:pt-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#009DD1]" />
            </div>
          ) : noShowRequests.length === 0 ? (
            <Card className={cardClass}>
              <CardContent className="py-10 text-center text-gray-500">
                No no-show certificate requests.
              </CardContent>
            </Card>
          ) : (
            noShowRequests.map((request) => (
              <CertificateCard key={request.id} request={request} status="no-show" />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RequestCertificate;