import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Search, Loader2, FileText, Download, Eye, Trash2, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';
import { format } from 'date-fns';
import StaffRoleBanner from '../../components/staff/StaffRoleBanner';
import StaffPageSkeleton from '../../components/staff/StaffPageSkeleton';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [documentContent, setDocumentContent] = useState('');
  const [viewLoading, setViewLoading] = useState(false);

  useEffect(() => {
    loadDocuments();
    loadDocumentTypes();
  }, []);

  useEffect(() => {
    // Filter documents based on search query and selected type
    let filtered = documents;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.name?.toLowerCase().includes(query) ||
        doc.documentType?.name?.toLowerCase().includes(query) ||
        doc.patient?.user?.name?.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (selectedType) {
      filtered = filtered.filter(doc => doc.document_type_id === parseInt(selectedType));
    }

    setFilteredDocuments(filtered);
  }, [searchQuery, documents, selectedType]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/clinician/documents');
      
      console.log('Documents API Response:', response.data);
      
      // Handle paginated response
      const documentData = response.data?.data || response.data || [];
      console.log('Document Data:', documentData);
      console.log('Is Array:', Array.isArray(documentData));
      
      setDocuments(Array.isArray(documentData) ? documentData : []);
    } catch (err) {
      console.error('Failed to load documents:', err);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const loadDocumentTypes = async () => {
    try {
      const response = await api.get('/api/document-types');
      const types = response.data?.data || [];
      setDocumentTypes(Array.isArray(types) ? types : []);
    } catch (err) {
      console.error('Failed to load document types:', err);
    }
  };

  const handleDownload = async (document) => {
    try {
      const response = await api.get(`/api/documents/${document.id}/download`, {
        responseType: 'blob',
      });
      
      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', document.file_name || document.name || 'document');
      window.document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch (err) {
      console.error('Download failed:', err);
      toast.error('Failed to download document');
    }
  };

  const handleViewDocument = async (doc) => {
    try {
      setViewLoading(true);
      setViewingDocument(doc);

      // Determine file type and handle accordingly
      const fileType = doc.mime_type?.toLowerCase() || '';
      const fileName = doc.file_name?.toLowerCase() || '';

      if (fileType.includes('pdf') || fileName.endsWith('.pdf')) {
        // For PDFs, fetch from API and create data URL
        try {
          const response = await api.get(`/api/documents/${doc.id}/download`, {
            responseType: 'blob',
          });
          const url = window.URL.createObjectURL(response.data);
          setDocumentContent(url);
        } catch {
          setDocumentContent('');
        }
      } else if (fileType.includes('image') || fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        // For images, fetch from API and create data URL
        try {
          const response = await api.get(`/api/documents/${doc.id}/download`, {
            responseType: 'blob',
          });
          const url = window.URL.createObjectURL(response.data);
          setDocumentContent(url);
        } catch {
          setDocumentContent('');
        }
      } else if (fileType.includes('text') || fileName.endsWith('.txt')) {
        // For text files, fetch and display content
        try {
          const response = await api.get(`/api/documents/${doc.id}/download`, {
            responseType: 'text',
          });
          setDocumentContent(response.data);
        } catch {
          setDocumentContent('Unable to load file content');
        }
      } else {
        // For other types, try to fetch as blob and create URL
        try {
          const response = await api.get(`/api/documents/${doc.id}/download`, {
            responseType: 'blob',
          });
          const url = window.URL.createObjectURL(response.data);
          setDocumentContent(url);
        } catch {
          setDocumentContent('');
        }
      }
    } catch (err) {
      console.error('Failed to view document:', err);
      toast.error('Failed to view document');
    } finally {
      setViewLoading(false);
    }
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await api.delete(`/api/documents/${documentId}`);
      setDocuments(documents.filter(doc => doc.id !== documentId));
      toast.success('Document deleted successfully');
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete document');
    }
  };

  const getDocumentTypeBadge = (documentType) => {
    const typeName = typeof documentType === 'string' ? documentType : documentType?.name;
    
    const typeMap = {
      pdf: { className: 'bg-red-100 text-red-800', label: 'PDF' },
      image: { className: 'bg-blue-100 text-blue-800', label: 'Image' },
      document: { className: 'bg-orange-100 text-orange-800', label: 'Document' },
      prescription: { className: 'bg-green-100 text-green-800', label: 'Prescription' },
      lab_result: { className: 'bg-purple-100 text-purple-800', label: 'Lab Result' },
    };

    const config = typeMap[typeName?.toLowerCase()] || {
      className: 'bg-gray-100 text-gray-800',
      label: typeName || 'Document'
    };

    return (
      <Badge className={`${config.className} border-0`}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return <StaffPageSkeleton variant="tabs" rows={4} />;
  }

  return (
    <div className="space-y-6">
      <StaffRoleBanner
        title="Documents"
        subtitle="Manage patient-uploaded files with fast filtering, preview, and secure download."
        primaryAction={{ label: 'Previous Laboratory', to: '/clinician/previous-laboratory' }}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#01377D]">Patient Documents</h1>
          <p className="text-sm text-gray-500 mt-1">Manage patient uploaded documents</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[#009DD1]">{documents.length}</p>
          <p className="text-xs text-gray-500">Total Documents</p>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="border-[#97E7F5] shadow-sm bg-white">
        <CardContent className="p-4">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by document name, type, or patient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#97E7F5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009DD1] text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={`border-[#97E7F5] ${showFilters ? 'bg-[#F0F9FF]' : ''}`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            {(selectedType || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('');
                  setShowFilters(false);
                }}
                className="text-gray-500 hover:text-red-600"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-[#97E7F5]">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-[#01377D] mb-2">Document Type</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-3 py-2 border border-[#97E7F5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009DD1] text-sm"
                  >
                    <option value="">All Types</option>
                    {documentTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card className="border-[#97E7F5] shadow-sm bg-white">
        <CardContent className="p-0">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No documents found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-[#F0F9FF]">
                  <TableRow>
                    <TableHead className="text-[#01377D] font-semibold">Document Name</TableHead>
                    <TableHead className="text-[#01377D] font-semibold">Type</TableHead>
                    <TableHead className="text-[#01377D] font-semibold">Patient</TableHead>
                    <TableHead className="text-[#01377D] font-semibold">Uploaded Date</TableHead>
                    <TableHead className="text-[#01377D] font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((document) => (
                    <TableRow key={document.id} className="hover:bg-[#F9FAFB]">
                      <TableCell className="font-medium text-[#01377D]">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          {document.name || document.title || 'Unnamed'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getDocumentTypeBadge(document.documentType)}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>
                          <p className="font-medium text-[#01377D]">{document.patient?.user?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{document.patient?.student_number || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                        <div>
                          <p>{format(new Date(document.created_at), 'MMM dd, yyyy')}</p>
                          <p className="text-xs text-gray-500">{format(new Date(document.created_at), 'HH:mm:ss')}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="hover:bg-blue-50"
                            onClick={() => handleViewDocument(document)}
                            title="View document"
                            disabled={viewLoading}
                          >
                            <Eye className="w-4 h-4 text-[#009DD1]" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="hover:bg-green-50"
                            onClick={() => handleDownload(document)}
                            title="Download document"
                          >
                            <Download className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="hover:bg-red-50"
                            onClick={() => handleDelete(document.id)}
                            title="Delete document"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col border-0 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-[#01377D] truncate">
                {viewingDocument.name || viewingDocument.title || 'Document Viewer'}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (documentContent && documentContent.startsWith('blob:')) {
                    window.URL.revokeObjectURL(documentContent);
                  }
                  setViewingDocument(null);
                  setDocumentContent('');
                }}
              >
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {viewLoading ? (
                <div className="flex items-center justify-center h-96">
                  <Loader2 className="w-8 h-8 animate-spin text-[#009DD1]" />
                </div>
              ) : (
                <>
                  {viewingDocument.mime_type?.includes('pdf') || viewingDocument.file_name?.endsWith('.pdf') ? (
                    documentContent ? (
                      <embed
                        src={documentContent}
                        type="application/pdf"
                        className="w-full h-96"
                      />
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Unable to load PDF</p>
                      </div>
                    )
                  ) : viewingDocument.mime_type?.includes('image') || viewingDocument.file_name?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    documentContent ? (
                      <div className="flex justify-center">
                        <img
                          src={documentContent}
                          alt={viewingDocument.name}
                          className="max-w-full max-h-96 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Unable to load image</p>
                      </div>
                    )
                  ) : (
                    <div className="bg-gray-50 p-4 rounded border border-gray-200 overflow-auto max-h-96 text-sm font-mono text-gray-800 whitespace-pre-wrap break-words">
                      {documentContent || 'Unable to load file content'}
                    </div>
                  )}
                </>
              )}
            </CardContent>
            <div className="border-t border-[#97E7F5] p-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => handleDownload(viewingDocument)}
                className="border-[#97E7F5]"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  if (documentContent && documentContent.startsWith('blob:')) {
                    window.URL.revokeObjectURL(documentContent);
                  }
                  setViewingDocument(null);
                  setDocumentContent('');
                }}
                className="bg-[#009DD1] text-white hover:bg-[#007ea8]"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Documents;
