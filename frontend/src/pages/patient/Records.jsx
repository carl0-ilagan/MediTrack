// Records.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import { FileText, Download, Search, Calendar, User, Loader2, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { getDocuments, downloadDocument } from '../../api/Documents';
import { getMedCerts } from '../../api/MedicalCertificates';
import { getAppointments } from '../../api/Appointments';
import { normalizePaginated } from '../../api/PatientPortal';
import PatientPageSkeleton from '../../components/patient/PatientPageSkeleton';
import PatientRoleBanner from '../../components/patient/PatientRoleBanner';

const titleCase = (value = '') =>
  value
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

export const Records = () => {
  const { user, loading: authLoading } = useAuth();
  const patientId = user?.patient?.id;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('documents');
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState({ data: [], meta: {} });
  const [certificates, setCertificates] = useState({ data: [], meta: {} });
  const [visits, setVisits] = useState([]);
  const [downloadingId, setDownloadingId] = useState(null);
  const cardClass =
    'border-[#D8EBFA] bg-white shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(2,132,199,0.12)]';
  const tabClass = (value) =>
    `rounded-full border px-4 text-xs sm:text-sm ${
      activeTab === value
        ? 'border-[#BFE6FB] bg-[#EAF5FF] text-[#0f2d57]'
        : 'border-[#D8EBFA] bg-white text-[#5A6F8F] hover:bg-[#F8FBFF] hover:text-[#0f2d57]'
    }`;

  useEffect(() => {
    if (authLoading) return;
    if (!patientId) {
      setLoading(false);
      setDocuments({ data: [], meta: {} });
      setCertificates({ data: [], meta: {} });
      setVisits([]);
      return;
    }

    const loadRecords = async () => {
      try {
        setLoading(true);
        const [documentsRes, certificatesRes, visitsRes] = await Promise.all([
          getDocuments(patientId, { per_page: 50 }),
          getMedCerts({ per_page: 50 }),
          getAppointments({ per_page: 50 }),
        ]);

        setDocuments(normalizePaginated(documentsRes));
        setCertificates(normalizePaginated(certificatesRes));
        const visitsPayload = visitsRes?.data;
        setVisits(Array.isArray(visitsPayload?.data) ? visitsPayload.data : []);
      } catch (error) {
        console.error('Failed to load records', error);
        toast.error('Unable to load medical records');
      } finally {
        setLoading(false);
      }
    };

    loadRecords();
  }, [authLoading, patientId]);

  const searchLower = searchQuery.toLowerCase();

  const filteredDocuments = useMemo(() => {
    if (!searchLower) return documents.data;
    return documents.data.filter((doc) =>
      doc.name?.toLowerCase().includes(searchLower) ||
      doc.description?.toLowerCase().includes(searchLower)
    );
  }, [documents.data, searchLower]);

  const filteredCertificates = useMemo(() => {
    if (!searchLower) return certificates.data;
    return certificates.data.filter((cert) =>
      cert.type?.toLowerCase().includes(searchLower) ||
      cert.status?.toLowerCase().includes(searchLower)
    );
  }, [certificates.data, searchLower]);

  const filteredVisits = useMemo(() => {
    if (!searchLower) return visits;
    return visits.filter((visit) =>
      visit?.clinician?.name?.toLowerCase().includes(searchLower) ||
      visit.title?.toLowerCase().includes(searchLower)
    );
  }, [visits, searchLower]);

  const handleDownload = async (doc) => {
    try {
      setDownloadingId(doc.id);
      const response = await downloadDocument(doc.id);
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.file_name || `${doc.name}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download document', error);
      toast.error('Unable to download document');
    } finally {
      setDownloadingId(null);
    }
  };

  const searchPlaceholder = {
    documents: 'Search documents…',
    certificates: 'Search certificates…',
    visits: 'Search visits…',
  }[activeTab];

  if (authLoading || loading) {
    return <PatientPageSkeleton variant="tabs" rows={4} />;
  }

  return (
    <div className="space-y-6">
      <PatientRoleBanner
        title="Medical Records"
        subtitle="Review documents, certificates, and visit history with quick access to downloads."
      />

      <div>
        <h1 className="text-xl font-semibold text-[#0f2d57]">Manage Your Records</h1>
        <p className="mt-1 text-sm text-[#406A93]">Download files, track certificates, and check visit history.</p>
      </div>

      {!patientId && (
        <Card className={cardClass}>
          <CardContent className="py-4 text-sm text-amber-700">
            Wala pang linked patient record sa account mo, kaya limited ang records na makikita.
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 " />
        <Input
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-transparent gap-2 flex-wrap p-1">
          <TabsTrigger value="documents" className={tabClass('documents')}>
            Documents ({documents.meta?.total ?? documents.data.length})
          </TabsTrigger>
          <TabsTrigger value="certificates" className={tabClass('certificates')}>
            Certificates ({certificates.meta?.total ?? certificates.data.length})
          </TabsTrigger>
          <TabsTrigger value="visits" className={tabClass('visits')}>
            Visits ({visits.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4 pt-1 sm:pt-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#009DD1]" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <Card className={cardClass}>
              <CardContent className="py-10 text-center text-gray-500">
                No documents found.
              </CardContent>
            </Card>
          ) : (
            filteredDocuments.map((doc) => (
              <Card key={doc.id} className={cardClass}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4 flex-1">
                      <div className="mt-1">
                        <FileText className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-[#01377D] mb-1">{doc.name}</h3>
                        <p className="text-sm text-gray-600">Uploaded {format(new Date(doc.created_at), 'MMM d, yyyy')}</p>
                        {doc.description && (
                          <p className="text-sm text-gray-500 mt-2">{doc.description}</p>
                        )}
                        {Array.isArray(doc.tags) && doc.tags.length > 0 && (
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {doc.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(doc)}
                        disabled={downloadingId === doc.id}
                      >
                        {downloadingId === doc.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            Download
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="certificates" className="space-y-4 pt-1 sm:pt-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#009DD1]" />
            </div>
          ) : filteredCertificates.length === 0 ? (
            <Card className={cardClass}>
              <CardContent className="py-10 text-center text-gray-500">
                No certificates available.
              </CardContent>
            </Card>
          ) : (
            filteredCertificates.map((cert) => (
              <Card key={cert.id} className={cardClass}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4 flex-1">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <ClipboardList className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-[#01377D] mb-1">{titleCase(cert.type)}</h3>
                        <p className="text-sm text-gray-600 mb-1">
                          Requested {format(new Date(cert.created_at), 'MMM d, yyyy')}
                        </p>
                        <div className="text-sm text-gray-500">
                          <p>
                            Coverage: {format(new Date(cert.start_date), 'MMM d, yyyy')} - {format(new Date(cert.end_date), 'MMM d, yyyy')}
                          </p>
                          {cert.medical_reason && (
                            <p className="mt-1">Reason: {cert.medical_reason}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge className={`capitalize border ${cert.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' : cert.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                      {titleCase(cert.status)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="visits" className="space-y-4 pt-1 sm:pt-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#009DD1]" />
            </div>
          ) : filteredVisits.length === 0 ? (
            <Card className={cardClass}>
              <CardContent className="py-10 text-center text-gray-500">
                No visits recorded yet.
              </CardContent>
            </Card>
          ) : (
            filteredVisits.map((visit) => (
              <Card key={visit.id} className={cardClass}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4 flex-1">
                      <div className="bg-gray-100 p-3 rounded-lg">
                        <Calendar className="w-6 h-6 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-[#01377D] mb-1">{visit.title || titleCase(visit.type)}</h3>
                        <div className="text-sm text-gray-500 space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {visit?.clinician?.name || 'Assigned Clinician'}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(visit.start_time), 'MMM d, yyyy • h:mm a')}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Badge className={`capitalize border ${getStatusColor(visit.status)}`}>
                      {titleCase(visit.status)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const getStatusColor = (status = '') => {
  switch ((status || '').toLowerCase()) {
    case 'confirmed':
    case 'scheduled':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'cancelled':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'completed':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export default Records;