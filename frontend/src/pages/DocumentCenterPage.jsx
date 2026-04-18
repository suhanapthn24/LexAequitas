import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import axios from "axios";
import { format } from "date-fns";
import {
  FileText, Plus, Upload, Download, Trash2, MoreVertical,
  Search, File, FileImage, FileCode, Loader2, FolderOpen,
  ChevronDown, ChevronUp, Users, Calendar, Scale, Shield,
  Swords, BookOpen, AlertCircle, CheckCircle2, X,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const API = "https://mpj-backend-java.onrender.com/api";

// ─── Auth helper (same pattern as ComplianceAlertsPage) ───────────────────────
const useAuthCfg = (getAuthHeader) => () => {
  try {
    const h = getAuthHeader();
    if (h && h.headers) return h;
    if (h && h.Authorization) return { headers: h };
    return {};
  } catch { return {}; }
};

// ─── Analysis response shape from /analyse ────────────────────────────────────
// {
//   filename, parties:[{name,type}], dates:[{raw,parsed,context}],
//   clauses:{obligations[],penalties[],jurisdiction[],termination[]},
//   ai_legal_analysis:{
//     document_type, ipc_sections_mentioned[], key_legal_issues[],
//     strengths_for_prosecution[], strengths_for_defense[], recommended_arguments[]
//   }
// }

// ─── Analysis Summary Panel ───────────────────────────────────────────────────
const AnalysisPanel = ({ analysis, onClose }) => {
  const [tab, setTab] = useState("overview");
  if (!analysis) return null;

  const ai  = analysis.ai_legal_analysis || {};
  const tabs = [
    { id: "overview",   label: "Overview",   icon: BookOpen },
    { id: "parties",    label: "Parties",    icon: Users },
    { id: "clauses",    label: "Clauses",    icon: Scale },
    { id: "strategy",   label: "Strategy",   icon: Swords },
  ];

  const Section = ({ title, items, color = "#C8A84B", emptyMsg = "None found" }) => (
    <div className="mb-5">
      <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color }}>
        {title}
      </div>
      {items && items.length > 0 ? (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
              <span style={{ color }} className="mt-0.5 flex-shrink-0">·</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-600 italic">{emptyMsg}</p>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[#080E1C] border border-slate-700 rounded-xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-[#C8A84B] mb-1">
              AI Legal Analysis
            </div>
            <div className="text-white font-serif text-lg">
              {ai.document_type || "Legal Document"}
            </div>
            <div className="text-slate-500 text-xs font-mono mt-0.5">{analysis.filename}</div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* IPC chips */}
        {ai.ipc_sections_mentioned?.length > 0 && (
          <div className="px-6 py-3 border-b border-slate-800 flex flex-wrap gap-1.5">
            {ai.ipc_sections_mentioned.map((s, i) => (
              <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Tab bar */}
        <div className="flex border-b border-slate-800 px-6">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-mono uppercase tracking-wider border-b-2 transition-colors ${
                tab === id
                  ? "border-[#C8A84B] text-[#C8A84B]"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon className="w-3 h-3" /> {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="overflow-y-auto flex-1 px-6 py-5">

          {tab === "overview" && (
            <div>
              <Section
                title="Key Legal Issues"
                items={ai.key_legal_issues}
                color="#C8A84B"
              />
              {analysis.dates?.length > 0 && (
                <div className="mb-5">
                  <div className="text-xs font-mono uppercase tracking-widest text-[#C8A84B] mb-2">
                    Important Dates
                  </div>
                  <div className="space-y-2">
                    {analysis.dates.slice(0, 6).map((d, i) => (
                      <div key={i} className="flex gap-3 items-start text-sm">
                        <span className="font-mono text-[#C8A84B] text-xs bg-[#C8A84B]/10 px-2 py-0.5 rounded flex-shrink-0">
                          {d.parsed || d.raw}
                        </span>
                        <span className="text-slate-400 text-xs leading-relaxed">{d.context}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Section
                title="Recommended Arguments"
                items={ai.recommended_arguments}
                color="#50C878"
              />
            </div>
          )}

          {tab === "parties" && (
            <div>
              {analysis.parties?.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {analysis.parties.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        p.type === "PERSON"
                          ? "bg-purple-500/20 text-purple-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}>
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm text-white font-medium leading-tight">{p.name}</div>
                        <div className="text-[10px] font-mono text-slate-500 uppercase">{p.type}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm italic">No parties identified</p>
              )}
            </div>
          )}

          {tab === "clauses" && (
            <div>
              <Section title="Obligations" items={analysis.clauses?.obligations} color="#FBBF24" />
              <Section title="Penalties"   items={analysis.clauses?.penalties}   color="#EF4444" />
              <Section title="Jurisdiction" items={analysis.clauses?.jurisdiction} color="#60A5FA" />
              <Section title="Termination" items={analysis.clauses?.termination} color="#A78BFA" />
            </div>
          )}

          {tab === "strategy" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-mono uppercase tracking-widest text-blue-400">Prosecution Strengths</span>
                </div>
                <ul className="space-y-2">
                  {ai.strengths_for_prosecution?.length > 0
                    ? ai.strengths_for_prosecution.map((s, i) => (
                        <li key={i} className="text-sm text-slate-300 leading-relaxed pl-3 border-l-2 border-blue-500/40">{s}</li>
                      ))
                    : <li className="text-xs text-slate-600 italic">None identified</li>
                  }
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-red-400" />
                  <span className="text-xs font-mono uppercase tracking-widest text-red-400">Defense Strengths</span>
                </div>
                <ul className="space-y-2">
                  {ai.strengths_for_defense?.length > 0
                    ? ai.strengths_for_defense.map((s, i) => (
                        <li key={i} className="text-sm text-slate-300 leading-relaxed pl-3 border-l-2 border-red-500/40">{s}</li>
                      ))
                    : <li className="text-xs text-slate-600 italic">None identified</li>
                  }
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between">
          {/* FIX: Download Analysis button — was completely missing from the panel */}
          <button
            onClick={() => {
              const blob = new Blob(
                [JSON.stringify(analysis, null, 2)],
                { type: "application/json" }
              );
              const url  = window.URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href  = url;
              link.setAttribute("download", `${analysis.filename || "analysis"}_analysis.json`);
              document.body.appendChild(link);
              link.click();
              link.remove();
              window.URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#C8A84B] hover:text-white transition-colors px-4 py-1.5 border border-[#C8A84B]/30 rounded hover:border-[#C8A84B]"
          >
            <Download className="w-3.5 h-3.5" /> Download Analysis
          </button>
          <button
            onClick={onClose}
            className="text-xs font-mono uppercase tracking-wider text-slate-500 hover:text-white transition-colors px-4 py-1.5 border border-slate-700 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Inline mini-summary shown on each document card ──────────────────────────
const MiniSummary = ({ analysis }) => {
  const ai = analysis?.ai_legal_analysis;
  if (!ai) return null;
  return (
    <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
      {ai.document_type && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-500 uppercase">Type</span>
          <span className="text-[10px] font-mono text-[#C8A84B]">{ai.document_type}</span>
        </div>
      )}
      {ai.ipc_sections_mentioned?.slice(0, 2).map((s, i) => (
        <span key={i} className="inline-block mr-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
          {s}
        </span>
      ))}
      {ai.key_legal_issues?.slice(0, 1).map((issue, i) => (
        <p key={i} className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{issue}</p>
      ))}
    </div>
  );
};

// ─── Document card ─────────────────────────────────────────────────────────────
const DocumentCard = ({ doc, onDownload, onDelete, onViewAnalysis, onDownloadAnalysis }) => {
  const getDocTypeIcon = (type) => {
    const icons = {
      contract:       <FileText     className="w-5 h-5 text-blue-400" />,
      brief:          <File         className="w-5 h-5 text-purple-400" />,
      motion:         <FileCode     className="w-5 h-5 text-green-400" />,
      evidence:       <FileImage    className="w-5 h-5 text-amber-400" />,
      correspondence: <FileText     className="w-5 h-5 text-cyan-400" />,
    };
    return icons[type] || <File className="w-5 h-5 text-slate-400" />;
  };

  const typeBadgeColors = {
    contract:       "bg-blue-500/20 text-blue-400 border-blue-500/30",
    brief:          "bg-purple-500/20 text-purple-400 border-purple-500/30",
    motion:         "bg-green-500/20 text-green-400 border-green-500/30",
    evidence:       "bg-amber-500/20 text-amber-400 border-amber-500/30",
    correspondence: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  };

  const formatSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <Card
      className="bg-[#080E1C] border-slate-800 hover:border-[#C8A84B]/25 transition-all"
      data-testid={`document-card-${doc.id}`}
    >
      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 bg-slate-800 rounded flex items-center justify-center">
            {getDocTypeIcon(doc.document_type)}
          </div>
          <div className="flex items-center gap-1">
            {doc.analysis && (
              <button
                onClick={() => onViewAnalysis(doc)}
                className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded bg-[#C8A84B]/10 text-[#C8A84B] border border-[#C8A84B]/20 hover:bg-[#C8A84B]/20 transition-colors"
              >
                View Analysis
              </button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#0B1120] border-slate-700">
                <DropdownMenuItem onClick={() => onDownload(doc)} className="text-slate-300 cursor-pointer">
                  <Download className="w-4 h-4 mr-2" /> Download File
                </DropdownMenuItem>
                {doc.analysis && (
                  <DropdownMenuItem onClick={() => onDownloadAnalysis(doc)} className="text-[#C8A84B] cursor-pointer">
                    <Download className="w-4 h-4 mr-2" /> Download Analysis
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onDelete(doc.id)} className="text-red-400 cursor-pointer">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <h3 className="font-medium text-white mb-1 truncate">{doc.title}</h3>
        <p className="text-xs text-slate-500 font-mono truncate mb-3">{doc.file_name}</p>

        <div className="flex items-center justify-between">
          <Badge className={typeBadgeColors[doc.document_type] || "bg-slate-500/20 text-slate-400"}>
            {doc.document_type}
          </Badge>
          {doc.file_size && (
            <span className="text-xs text-slate-500">{formatSize(doc.file_size)}</span>
          )}
        </div>

        {/* Mini summary from analysis */}
        <MiniSummary analysis={doc.analysis} />

        {doc.description && !doc.analysis && (
          <p className="mt-3 text-sm text-slate-400 line-clamp-2 border-t border-slate-800 pt-3">
            {doc.description}
          </p>
        )}

        {doc.uploaded_at && (
          <p className="mt-3 text-xs text-slate-600">
            Uploaded {format(new Date(doc.uploaded_at), "MMM d, yyyy")}
          </p>
        )}
      </div>
    </Card>
  );
};

// ─── Upload progress overlay ───────────────────────────────────────────────────
const UploadProgress = ({ step }) => {
  const steps = ["Uploading file...", "Extracting text...", "Running AI analysis...", "Done"];
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <div className="bg-[#080E1C] border border-slate-700 rounded-xl p-8 w-80 text-center">
        <Loader2 className="w-10 h-10 text-[#C8A84B] animate-spin mx-auto mb-4" />
        <div className="text-white font-serif text-base mb-4">{steps[step]}</div>
        <div className="flex gap-1 justify-center">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                i <= step ? "bg-[#C8A84B]" : "bg-slate-700"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Main component ────────────────────────────────────────────────────────────
const DocumentCenterPage = () => {
  const { getAuthHeader } = useAuth();
  const authCfg = useAuthCfg(getAuthHeader);

  const [documents,    setDocuments]    = useState([]);
  const [cases,        setCases]        = useState([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [dialogOpen,   setDialogOpen]   = useState(false);
  const [searchTerm,   setSearchTerm]   = useState("");
  const [filterType,   setFilterType]   = useState("all");
  const [uploadStep,   setUploadStep]   = useState(-1);   // -1 = idle
  const [viewingDoc,   setViewingDoc]   = useState(null); // doc with .analysis to show

  const [formData, setFormData] = useState({
    title: "", document_type: "brief", case_id: "none_case",
    description: "", file: null,
  });


  // GET /api/documents — backend currently returns [] but we layer in local state
  const fetchDocuments = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/documents`, authCfg());
      // Only update if the backend actually returns something
      if (Array.isArray(res.data) && res.data.length > 0) {
        setDocuments(prev => {
          // Merge: keep local docs that have analysis, add any new from backend
          const backendIds = new Set(res.data.map(d => String(d.id)));
          const localOnly  = prev.filter(d => !backendIds.has(String(d.id)));
          return [...localOnly, ...res.data];
        });
      }
    } catch (err) {
      console.error("fetchDocuments error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [authCfg]);

  const fetchCases = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/cases`, authCfg());
      setCases(res.data || []);
    } catch { /* silent */ }
  }, [authCfg]);

  const resetForm = () => setFormData({
    title: "", document_type: "brief", case_id: "none_case",
    description: "", file: null,
  });

  useEffect(() => {
    fetchDocuments();
    fetchCases();
  }, [fetchDocuments, fetchCases]);

  const handleUpload = async () => {
    if (!formData.title || !formData.file) {
      toast.error("Please provide a title and select a file");
      return;
    }

    setDialogOpen(false);
    setUploadStep(0);   // "Uploading file..."

    try {
      const fd = new FormData();
      fd.append("title",         formData.title);
      fd.append("document_type", formData.document_type);
      fd.append("file",          formData.file);
      if (formData.description) fd.append("description", formData.description);

      setUploadStep(1);  // "Extracting text..."

      const res = await axios.post(`${API}/documents`, fd, authCfg());

      setUploadStep(2);  // "Running AI analysis..."

      // Response: { message: "success", analysis: "<JSON string or object>" }
      let analysis = null;
      if (res.data?.analysis) {
        try {
          // Spring returns the Python JSON as a string — parse it
          analysis = typeof res.data.analysis === "string"
            ? JSON.parse(res.data.analysis)
            : res.data.analysis;
        } catch {
          analysis = null;
        }
      }

      setUploadStep(3);  // "Done"

      // Build local document entry and add it to state
      const newDoc = {
        id:            `local_${Date.now()}`,
        title:         formData.title,
        file_name:     formData.file.name,
        document_type: formData.document_type,
        description:   formData.description,
        file_size:     formData.file.size,
        uploaded_at:   new Date().toISOString(),
        analysis,
      };

      setDocuments(prev => [newDoc, ...prev]);
      resetForm();

      // If we got analysis, open it immediately
      if (analysis) {
        setTimeout(() => {
          setUploadStep(-1);
          setViewingDoc(newDoc);
        }, 600);
      } else {
        setTimeout(() => setUploadStep(-1), 800);
      }

      toast.success("Document uploaded and analysed");

    } catch (err) {
      setUploadStep(-1);
      const msg = err?.response?.data?.error || err.message || "Upload failed";
      console.error("Upload error:", err?.response?.data || err);
      toast.error(msg);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm("Delete this document?")) return;
    try {
      await axios.delete(`${API}/documents/${docId}`, authCfg());
      setDocuments(prev => prev.filter(d => String(d.id) !== String(docId)));
      toast.success("Document deleted");
    } catch {
      // If it's a local-only doc just remove it from state
      setDocuments(prev => prev.filter(d => String(d.id) !== String(docId)));
      toast.success("Document removed");
    }
  };

  const handleDownload = async (doc) => {
    // FIX: Local-only docs (id starts with "local_") were never persisted to the
    // backend, so calling GET /api/documents/local_.../download always 404s.
    // For these we offer the analysis JSON as a download instead.
    if (String(doc.id).startsWith("local_")) {
      if (doc.analysis) {
        const blob = new Blob(
          [JSON.stringify(doc.analysis, null, 2)],
          { type: "application/json" }
        );
        const url  = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href  = url;
        link.setAttribute("download", `${doc.title}_analysis.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast.success("Analysis downloaded");
      } else {
        toast.error("This document was not saved to the server — original file unavailable");
      }
      return;
    }

    // Persisted backend doc — fetch the actual file as a blob
    try {
      const res = await axios.get(`${API}/documents/${doc.id}/download`, {
        ...authCfg(),
        responseType: "blob",
      });
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", doc.file_name || `document_${doc.id}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Download failed — file may have been removed from the server");
    }
  };

  // Download the analysis JSON for any doc that has one
  const handleDownloadAnalysis = (doc) => {
    if (!doc?.analysis) {
      toast.error("No analysis available for this document");
      return;
    }
    const blob = new Blob(
      [JSON.stringify(doc.analysis, null, 2)],
      { type: "application/json" }
    );
    const url  = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href  = url;
    link.setAttribute("download", `${doc.title}_analysis.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    toast.success("Analysis downloaded");
  };

  const filteredDocuments = documents.filter(doc => {
    const name   = (doc.title || "").toLowerCase();
    const fname  = (doc.file_name || "").toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchesSearch = name.includes(search) || fname.includes(search);
    const matchesType   = filterType === "all" || doc.document_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-[#080E1C] py-20">

      {/* Upload progress overlay */}
      {uploadStep >= 0 && <UploadProgress step={uploadStep} />}

      {/* Analysis modal */}
      {viewingDoc?.analysis && (
        <AnalysisPanel
          analysis={viewingDoc.analysis}
          onClose={() => setViewingDoc(null)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-white mb-2">Document Center</h1>
            <p className="text-slate-400">Upload legal documents — AI extracts parties, clauses, and legal issues automatically</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button
                className="mt-4 md:mt-0 bg-[#C8A84B] text-[#080E1C] hover:bg-[#b8953e] rounded-none uppercase tracking-wide text-xs font-bold"
                data-testid="upload-document-btn"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0B1120] border-slate-700 max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-serif text-xl text-white">Upload Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-mono uppercase tracking-wider">Document Title *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g. FIR No. 142/2024"
                    className="bg-transparent border-slate-700 text-white"
                    data-testid="doc-form-title"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-mono uppercase tracking-wider">Type</label>
                    <Select value={formData.document_type} onValueChange={(v) => setFormData({...formData, document_type: v})}>
                      <SelectTrigger className="bg-transparent border-slate-700 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#0B1120] border-slate-700">
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="brief">Brief</SelectItem>
                        <SelectItem value="motion">Motion</SelectItem>
                        <SelectItem value="evidence">Evidence</SelectItem>
                        <SelectItem value="correspondence">Correspondence</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-mono uppercase tracking-wider">Associated Case</label>
                    <Select value={formData.case_id} onValueChange={(v) => setFormData({...formData, case_id: v})}>
                      <SelectTrigger className="bg-transparent border-slate-700 text-white">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0B1120] border-slate-700">
                        <SelectItem value="none_case">None</SelectItem>
                        {cases.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-mono uppercase tracking-wider">Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Brief description..."
                    className="bg-transparent border-slate-700 text-white resize-none"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-mono uppercase tracking-wider">File * (PDF, DOCX, image)</label>
                  <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-[#C8A84B]/50 transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.tiff"
                      onChange={(e) => setFormData({...formData, file: e.target.files[0]})}
                      className="hidden"
                      id="file-upload"
                      data-testid="doc-form-file"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                      {formData.file ? (
                        <div>
                          <p className="text-[#C8A84B] text-sm font-medium">{formData.file.name}</p>
                          <p className="text-slate-500 text-xs mt-0.5">
                            {(formData.file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-slate-400 text-sm">Click to select a file</p>
                          <p className="text-slate-600 text-xs mt-0.5">PDF, DOCX, or image</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <Button
                  onClick={handleUpload}
                  className="w-full bg-[#C8A84B] text-[#080E1C] hover:bg-[#b8953e] rounded-none uppercase tracking-wide font-bold"
                  data-testid="doc-form-submit"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload &amp; Analyse
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats bar */}
        <div className="flex gap-4 mb-6 flex-wrap">
          {[
            { label: "Total Documents", value: documents.length, color: "#C8A84B" },
            { label: "Analysed",        value: documents.filter(d => d.analysis).length, color: "#50C878" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[#0D1627] border border-slate-800 rounded-lg px-4 py-2 flex items-center gap-3">
              <span className="text-xl font-bold font-mono" style={{ color }}>{value}</span>
              <span className="text-xs text-slate-500 uppercase tracking-wider font-mono">{label}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
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
            <SelectContent className="bg-[#0B1120] border-slate-700">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="contract">Contracts</SelectItem>
              <SelectItem value="brief">Briefs</SelectItem>
              <SelectItem value="motion">Motions</SelectItem>
              <SelectItem value="evidence">Evidence</SelectItem>
              <SelectItem value="correspondence">Correspondence</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Documents grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#C8A84B] animate-spin" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <Card className="bg-[#0B1120] border-slate-800 p-16 text-center">
            <FolderOpen className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg text-white font-serif mb-2">No documents yet</h3>
            <p className="text-slate-500 text-sm mb-6">
              Upload a FIR, chargesheet, contract, or any legal document — the AI will extract parties, clauses, IPC sections, and key legal issues automatically.
            </p>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-[#C8A84B] text-[#080E1C] hover:bg-[#b8953e] rounded-none uppercase tracking-wide text-xs font-bold"
            >
              <Upload className="w-4 h-4 mr-2" /> Upload First Document
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                onDownload={handleDownload}
                onDelete={handleDelete}
                onViewAnalysis={(d) => setViewingDoc(d)}
                onDownloadAnalysis={handleDownloadAnalysis}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentCenterPage;