import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Search, Loader2, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../api/axios';
import StaffRoleBanner from '../../components/staff/StaffRoleBanner';
import StaffPageSkeleton from '../../components/staff/StaffPageSkeleton';
import LaboratoryRequestTemplate, {
  openLaboratoryRequestPrintView,
} from '../../components/laboratory/LaboratoryRequestTemplate';

const PreviousLaboratory = () => {
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [query, setQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const loadLaboratoryDocuments = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/clinician/documents', {
          params: {
            per_page: 200,
            laboratory_only: true,
          },
        });
        const payload = response?.data;
        const data = Array.isArray(payload?.data) ? payload.data : [];
        setDocuments(data);
      } catch (error) {
        console.error('Failed to load clinician laboratory documents:', error);
        toast.error('Unable to load previous laboratory files');
      } finally {
        setLoading(false);
      }
    };

    loadLaboratoryDocuments();
  }, []);

  const patientOptions = useMemo(() => {
    const map = new Map();
    documents.forEach((doc) => {
      const patientId = doc?.patient?.id;
      const patientName = doc?.patient?.user?.name;
      if (patientId && patientName && !map.has(patientId)) {
        map.set(patientId, {
          id: String(patientId),
          name: patientName,
        });
      }
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [documents]);

  const selectedPatientName = useMemo(() => {
    if (!selectedPatientId) return '';
    const selected = patientOptions.find((option) => option.id === selectedPatientId);
    return selected?.name || '';
  }, [patientOptions, selectedPatientId]);

  const filteredDocuments = useMemo(() => {
    const lowered = query.toLowerCase().trim();
    return documents.filter((doc) => {
      const matchesPatient = selectedPatientId ? String(doc?.patient?.id) === selectedPatientId : true;
      if (!matchesPatient) return false;

      if (!lowered) return true;
      const patientName = String(doc?.patient?.user?.name || '').toLowerCase();
      const fileName = String(doc?.name || '').toLowerCase();
      const description = String(doc?.description || '').toLowerCase();
      const typeName = String(doc?.documentType?.name || '').toLowerCase();
      return (
        patientName.includes(lowered) ||
        fileName.includes(lowered) ||
        description.includes(lowered) ||
        typeName.includes(lowered)
      );
    });
  }, [documents, query, selectedPatientId]);

  const handleDownload = async (doc) => {
    try {
      setDownloadingId(doc.id);
      const response = await api.get(`/api/documents/${doc.id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.file_name || doc.name || 'laboratory-document');
      window.document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download laboratory file');
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePrintForm = () => {
    openLaboratoryRequestPrintView({
      patientName: selectedPatientName,
    });
  };

  if (loading) {
    return <StaffPageSkeleton variant="list" rows={4} />;
  }

  return (
    <div className="space-y-6">
      <StaffRoleBanner
        title="Previous Laboratory"
        subtitle="Find and review historical laboratory records across patients quickly."
        primaryAction={{ label: 'Open Documents', to: '/clinician/documents' }}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#01377D]">Previous Laboratory</h1>
          <p className="text-[#009DD1] mt-2">Review and download patient laboratory history.</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[#009DD1]">{filteredDocuments.length}</p>
          <p className="text-xs text-gray-500">Laboratory Files</p>
        </div>
      </div>

      <Card className="border-[#97E7F5] shadow-sm bg-white">
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by patient, file name, or type..."
              className="pl-10 bg-white"
            />
          </div>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="w-full rounded-md border border-[#97E7F5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#009DD1]"
          >
            <option value="">All Patients</option>
            {patientOptions.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <LaboratoryRequestTemplate
        patientName={selectedPatientName}
        onPrint={handlePrintForm}
      />

      <Card className="border-[#97E7F5] shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-[#01377D]">Laboratory Records</CardTitle>
          <CardDescription className="text-[#009DD1]">
            Files tagged or detected as laboratory-related.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="py-10 text-center text-gray-500">No previous laboratory files found.</div>
          ) : (
            <div className="space-y-3">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-start justify-between rounded-lg border border-[#97E7F5] p-4 hover:bg-[#F8FCFF]"
                >
                  <div className="flex gap-3">
                    <FileText className="mt-1 w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-[#01377D]">{doc.name}</p>
                      <p className="text-sm text-gray-600">
                        Patient: {doc?.patient?.user?.name || 'Unknown Patient'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Uploaded {doc.created_at ? format(new Date(doc.created_at), 'MMM d, yyyy • h:mm a') : 'N/A'}
                      </p>
                      {doc.documentType?.name && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {doc.documentType.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PreviousLaboratory;
