import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import axios from "axios";
import { format } from "date-fns";
import {
  FileText,
  Plus,
  Upload,
  Download,
  Trash2,
  MoreVertical,
  Search,
  File,
  FileImage,
  FileCode,
  Loader2,
  FolderOpen
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DocumentCenterPage = () => {
  const { getAuthHeader, token } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [uploading, setUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    document_type: "brief",
    case_id: "",
    description: "",
    file: null
  });

  useEffect(() => {
    fetchDocuments();
    fetchCases();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API}/documents`, getAuthHeader());
      setDocuments(response.data);
    } catch (error) {
      toast.error("Failed to fetch documents");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCases = async () => {
    try {
      const response = await axios.get(`${API}/cases`, getAuthHeader());
      setCases(response.data);
    } catch (error) {
      console.error("Failed to fetch cases");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      document_type: "brief",
      case_id: "",
      description: "",
      file: null
    });
  };

  const handleUpload = async () => {
    if (!formData.title || !formData.file) {
      toast.error("Please provide a title and select a file");
      return;
    }

    setUploading(true);
    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("document_type", formData.document_type);
      data.append("file", formData.file);
      if (formData.case_id) data.append("case_id", formData.case_id);
      if (formData.description) data.append("description", formData.description);

      await axios.post(`${API}/documents`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      toast.success("Document uploaded successfully");
      setDialogOpen(false);
      resetForm();
      fetchDocuments();
    } catch (error) {
      toast.error("Failed to upload document");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const response = await axios.get(`${API}/documents/${doc.id}/download`, {
        ...getAuthHeader(),
        responseType: "blob"
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", doc.file_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Failed to download document");
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;

    try {
      await axios.delete(`${API}/documents/${docId}`, getAuthHeader());
      toast.success("Document deleted successfully");
      fetchDocuments();
    } catch (error) {
      toast.error("Failed to delete document");
    }
  };

  const getDocTypeIcon = (type) => {
    switch (type) {
      case "contract":
        return <FileText className="w-5 h-5 text-blue-400" />;
      case "brief":
        return <File className="w-5 h-5 text-purple-400" />;
      case "motion":
        return <FileCode className="w-5 h-5 text-green-400" />;
      case "evidence":
        return <FileImage className="w-5 h-5 text-amber-400" />;
      case "correspondence":
        return <FileText className="w-5 h-5 text-cyan-400" />;
      default:
        return <File className="w-5 h-5 text-slate-400" />;
    }
  };

  const getDocTypeBadge = (type) => {
    const colors = {
      contract: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      brief: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      motion: "bg-green-500/20 text-green-400 border-green-500/30",
      evidence: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      correspondence: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
    };
    return <Badge className={colors[type] || "bg-slate-500/20 text-slate-400"}>{type}</Badge>;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.file_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || doc.document_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-[#0F172A] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-white mb-2">Document Center</h1>
            <p className="text-slate-400">Manage your legal documents and files</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button 
                className="mt-4 md:mt-0 bg-[#D4AF37] text-[#0F172A] hover:bg-[#c9a430] rounded-none uppercase tracking-wide text-xs font-bold"
                data-testid="upload-document-btn"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0F172A] border-slate-800 max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-serif text-xl text-white">Upload Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Document Title *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Motion to Dismiss"
                    className="bg-transparent border-slate-700 text-white"
                    data-testid="doc-form-title"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Document Type</label>
                  <Select value={formData.document_type} onValueChange={(v) => setFormData({...formData, document_type: v})}>
                    <SelectTrigger className="bg-transparent border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0F172A] border-slate-700">
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="brief">Brief</SelectItem>
                      <SelectItem value="motion">Motion</SelectItem>
                      <SelectItem value="evidence">Evidence</SelectItem>
                      <SelectItem value="correspondence">Correspondence</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Associated Case</label>
                  <Select value={formData.case_id} onValueChange={(v) => setFormData({...formData, case_id: v})}>
                    <SelectTrigger className="bg-transparent border-slate-700 text-white">
                      <SelectValue placeholder="Select a case (optional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0F172A] border-slate-700">
                      <SelectItem value="">None</SelectItem>
                      {cases.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Brief description of the document..."
                    className="bg-transparent border-slate-700 text-white resize-none"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">File *</label>
                  <div className="border-2 border-dashed border-slate-700 rounded-sm p-6 text-center hover:border-[#D4AF37]/50 transition-colors">
                    <input
                      type="file"
                      onChange={(e) => setFormData({...formData, file: e.target.files[0]})}
                      className="hidden"
                      id="file-upload"
                      data-testid="doc-form-file"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                      {formData.file ? (
                        <p className="text-[#D4AF37]">{formData.file.name}</p>
                      ) : (
                        <p className="text-slate-400">Click to select a file</p>
                      )}
                    </label>
                  </div>
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full bg-[#D4AF37] text-[#0F172A] hover:bg-[#c9a430] rounded-none uppercase tracking-wide font-bold"
                  data-testid="doc-form-submit"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Upload Document
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search documents..."
              className="pl-10 bg-transparent border-slate-700 text-white placeholder:text-slate-500"
              data-testid="doc-search-input"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40 bg-transparent border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0F172A] border-slate-700">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="contract">Contracts</SelectItem>
              <SelectItem value="brief">Briefs</SelectItem>
              <SelectItem value="motion">Motions</SelectItem>
              <SelectItem value="evidence">Evidence</SelectItem>
              <SelectItem value="correspondence">Correspondence</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Documents Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <Card className="bg-[#020617] border-slate-800 p-12 text-center">
            <FolderOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg text-white mb-2">No documents found</h3>
            <p className="text-slate-400 mb-4">Upload your first document to get started</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc) => (
              <Card 
                key={doc.id} 
                className="bg-[#020617] border-slate-800 hover:border-[#D4AF37]/20 transition-colors"
                data-testid={`document-card-${doc.id}`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-slate-800 flex items-center justify-center">
                      {getDocTypeIcon(doc.document_type)}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white h-8 w-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#0F172A] border-slate-700">
                        <DropdownMenuItem 
                          onClick={() => handleDownload(doc)}
                          className="text-slate-300 cursor-pointer"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(doc.id)}
                          className="text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h3 className="font-medium text-white mb-1 truncate">{doc.title}</h3>
                  <p className="text-xs text-slate-500 font-mono truncate mb-3">{doc.file_name}</p>
                  
                  <div className="flex items-center justify-between">
                    {getDocTypeBadge(doc.document_type)}
                    <span className="text-xs text-slate-500">{formatFileSize(doc.file_size)}</span>
                  </div>

                  {doc.description && (
                    <p className="mt-3 text-sm text-slate-400 line-clamp-2 border-t border-slate-800 pt-3">
                      {doc.description}
                    </p>
                  )}

                  <p className="mt-3 text-xs text-slate-500">
                    Uploaded {format(new Date(doc.created_at), "MMM d, yyyy")}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentCenterPage;
