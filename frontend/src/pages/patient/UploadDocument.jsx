//UploadDocument.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Upload, FileText, Image as ImageIcon, FileCheck, Calendar, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../api/axios';
import { format } from 'date-fns';
import PatientPageSkeleton from '../../components/patient/PatientPageSkeleton';
import PatientRoleBanner from '../../components/patient/PatientRoleBanner';

export const UploadDocument = () => {
  const [documentType, setDocumentType] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const cardClass =
    'border-[#D8EBFA] bg-white shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(2,132,199,0.12)]';

  useEffect(() => {
    loadDocumentTypes();
    loadUploadedDocuments();
  }, []);

  const loadDocumentTypes = async () => {
    try {
      const response = await api.get('/api/document-types');
      const types = response.data?.data || [];
      setDocumentTypes(Array.isArray(types) ? types : []);
    } catch (err) {
      console.error('Failed to load document types:', err);
      toast.error('Failed to load document types');
    } finally {
      setLoading(false);
    }
  };

  const loadUploadedDocuments = async () => {
    try {
      const response = await api.get('/api/documents');
      const docs = response.data?.data || [];
      setUploadedDocuments(Array.isArray(docs) ? docs : []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!documentType || !selectedFile) {
      toast.error('Please select a document type and file');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('document_type_id', documentType);
      formData.append('file', selectedFile);
      if (description) {
        formData.append('description', description);
      }

      const response = await api.post('/api/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.success || response.status === 201) {
        toast.success('Document uploaded successfully');
        setDocumentType('');
        setDescription('');
        setSelectedFile(null);
        await loadUploadedDocuments();
      }
    } catch (err) {
      console.error('Failed to upload document:', err);
      const errorMsg = err.response?.data?.message || 'Failed to upload document';
      toast.error(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    try {
      await api.delete(`/api/documents/${docId}`);
      toast.success('Document deleted successfully');
      await loadUploadedDocuments();
    } catch (err) {
      console.error('Failed to delete document:', err);
      toast.error('Failed to delete document');
    }
  };

  const getFileIcon = (filename) => {
    if (filename.endsWith('.pdf')) return <FileText className="w-5 h-5 text-red-600" />;
    if (filename.endsWith('.jpg') || filename.endsWith('.png')) return <ImageIcon className="w-5 h-5 text-blue-600" />;
    return <FileCheck className="w-5 h-5 text-gray-600" />;
  };

  if (loading) {
    return <PatientPageSkeleton variant="form" rows={3} />;
  }

  return (
    <div className="space-y-6">
      <PatientRoleBanner
        title="Upload Document"
        subtitle="Securely submit medical files and keep your records updated in one place."
      />

      <div>
        <h1 className="text-xl font-semibold text-[#0f2d57]">Manage Your Documents</h1>
        <p className="mt-1 text-sm text-[#406A93]">Upload and manage your medical files with secure storage.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
        {/* Upload Form */}
        <Card className={`${cardClass} h-full`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload New Document
            </CardTitle>
            <CardDescription>Upload medical documents, test results, or insurance information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="documentType">Document Type *</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger id="documentType">
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent className="bg-blue-50">
                    {loading ? (
                      <div className="p-2 text-sm text-gray-500">Loading types...</div>
                    ) : documentTypes.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">No document types available</div>
                    ) : (
                      documentTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Upload File *</Label>
                <div className="rounded-lg border-2 border-dashed border-[#BFDDF4] p-8 text-center transition-colors hover:border-[#0ea5e9] hover:bg-[#F8FBFF]">
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <label htmlFor="file" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">
                      {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF, JPG, PNG up to 10MB
                    </p>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add any relevant notes about this document..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Privacy Notice:</strong> All uploaded documents are encrypted and only accessible 
                  to you and your authorized healthcare providers.
                </p>
              </div>

              <Button type="submit" className="w-full bg-[#0ea5e9] text-white hover:bg-[#0284c7]" disabled={!selectedFile || uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload Document'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Uploaded Documents */}
        <div className="space-y-4 lg:flex lg:h-full lg:flex-col">
          <Card className={cardClass}>
              <CardHeader>
              <CardTitle className="text-[#0f2d57]">Uploaded Documents</CardTitle>
              <CardDescription className="text-[#406A93]">Your previously uploaded files</CardDescription>
            </CardHeader>
            <CardContent>
              {uploadedDocuments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No documents uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {uploadedDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-start justify-between rounded-lg border border-[#D8EBFA] p-3 transition-all duration-300 hover:border-[#9FD5F5] hover:bg-[#F8FBFF]">
                      <div className="flex gap-3 flex-1">
                        <div className="mt-1">
                          {getFileIcon(doc.file_path || doc.name)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-[#01377D] mb-1 font-medium">{doc.title || doc.name}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{doc.document_type?.name || doc.type || 'Document'}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(doc.created_at || doc.uploadDate), 'MMM dd, yyyy')}
                            </div>
                          </div>
                          {doc.status && (
                            <Badge 
                              variant={doc.status === 'verified' ? 'default' : 'outline'} 
                              className="mt-2 text-xs capitalize"
                            >
                              {doc.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {doc.file_path && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.open(`/storage/${doc.file_path}`, '_blank')}
                          >
                            <FileText className="w-4 h-4 text-[#009DD1]" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-[#D8EBFA] bg-[#F8FBFF] lg:flex-1">
            <CardHeader>
              <CardTitle className="text-[#0f2d57] text-base">Upload Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="lg:h-full">
              <ul className="space-y-2 text-sm text-[#406A93]">
                <li>• Ensure documents are clear and legible</li>
                <li>• File size should not exceed 10MB</li>
                <li>• Supported formats: PDF, JPG, PNG</li>
                <li>• Remove any sensitive personal information if not needed</li>
                <li>• Documents are reviewed within 24-48 hours</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UploadDocument;