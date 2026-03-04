import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { FileText, Download, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { getDocuments, downloadDocument } from '../../api/Documents';
import PatientRoleBanner from '../../components/patient/PatientRoleBanner';
import PatientPageSkeleton from '../../components/patient/PatientPageSkeleton';
import LaboratoryRequestTemplate, {
  openLaboratoryRequestPrintView,
} from '../../components/laboratory/LaboratoryRequestTemplate';

const PreviousLaboratory = () => {
  const { user, loading: authLoading } = useAuth();
  const patientId = user?.patient?.id;
  const patientName = user?.name || user?.patient?.user?.name || '';
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!patientId) {
      setLoading(false);
      setDocuments([]);
      return;
    }

    const loadLaboratoryDocuments = async () => {
      try {
        setLoading(true);
        const response = await getDocuments(patientId, {
          per_page: 100,
          laboratory_only: true,
        });
        const payload = response?.data;
        const data = Array.isArray(payload?.data) ? payload.data : [];
        setDocuments(data);
      } catch (error) {
        console.error('Failed to load laboratory documents:', error);
        toast.error('Unable to load previous laboratory files');
      } finally {
        setLoading(false);
      }
    };

    loadLaboratoryDocuments();
  }, [authLoading, patientId]);

  const filteredDocuments = useMemo(() => {
    const lowered = query.toLowerCase().trim();
    if (!lowered) return documents;
    return documents.filter((doc) => {
      const name = String(doc?.name || '').toLowerCase();
      const description = String(doc?.description || '').toLowerCase();
      const type = String(doc?.documentType?.name || '').toLowerCase();
      return name.includes(lowered) || description.includes(lowered) || type.includes(lowered);
    });
  }, [documents, query]);

  const latestLaboratory = useMemo(() => {
    if (documents.length === 0) return null;
    return [...documents].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })[0];
  }, [documents]);

  const handleDownload = async (doc) => {
    try {
      setDownloadingId(doc.id);
      const response = await downloadDocument(doc.id);
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = doc.file_name || doc.name || 'laboratory-document';
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download laboratory file:', error);
      toast.error('Unable to download laboratory file');
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePrintForm = () => {
    openLaboratoryRequestPrintView({
      patientName,
      patientAge: user?.patient?.age || '',
      patientSex: user?.patient?.sex || '',
    });
  };

  if (authLoading || loading) {
    return <PatientPageSkeleton variant="list" rows={4} />;
  }

  return (
    <div className="space-y-6">
      <PatientRoleBanner
        title="Previous Laboratory"
        subtitle="Browse and download your historical laboratory files and recent uploads."
        primaryAction={{ label: 'Upload Document', to: '/patient/upload-document' }}
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search previous laboratory files..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 bg-white"
        />
      </div>

      <LaboratoryRequestTemplate
        patientName={patientName}
        patientAge={user?.patient?.age || ''}
        patientSex={user?.patient?.sex || ''}
        onPrint={handlePrintForm}
      />

      {!patientId && (
        <Card className="border-amber-200 bg-amber-50 shadow-sm">
          <CardContent className="py-4 text-sm text-amber-900">
            Wala pang linked patient record sa account mo. Paki-contact ang clinic para ma-link ang profile mo.
          </CardContent>
        </Card>
      )}

      {latestLaboratory && (
        <Card className="border-green-200 bg-green-50/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-green-800">Latest Laboratory File</CardTitle>
            <CardDescription>
              Uploaded {format(new Date(latestLaboratory.created_at), 'MMM d, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-[#01377D]">{latestLaboratory.name}</p>
              {latestLaboratory.description && (
                <p className="text-sm text-gray-600 mt-1">{latestLaboratory.description}</p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload(latestLaboratory)}
              disabled={downloadingId === latestLaboratory.id}
            >
              {downloadingId === latestLaboratory.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#009DD1]" />
        </div>
      ) : filteredDocuments.length === 0 ? (
        <Card className="border-[#97E7F5] shadow-sm bg-white">
          <CardContent className="py-10 text-center text-gray-500">
            No previous laboratory files found.
          </CardContent>
        </Card>
      ) : (
        filteredDocuments.map((doc) => (
          <Card key={doc.id} className="border-[#97E7F5] shadow-sm bg-white">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  <div className="mt-1">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[#01377D] mb-1">{doc.name}</h3>
                    <p className="text-sm text-gray-600">
                      Uploaded {format(new Date(doc.created_at), 'MMM d, yyyy')}
                    </p>
                    {doc.description && (
                      <p className="text-sm text-gray-500 mt-2">{doc.description}</p>
                    )}
                    {doc.documentType?.name && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        {doc.documentType.name}
                      </Badge>
                    )}
                  </div>
                </div>
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
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default PreviousLaboratory;
