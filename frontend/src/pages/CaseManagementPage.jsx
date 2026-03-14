import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  Scale,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Briefcase,
  Calendar as CalendarIcon,
  Building,
  User,
  FileText,
  Loader2,
  Search,
  Gavel,
  AlertTriangle,
  CheckCircle2,
  Clock
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CaseManagementPage = () => {
  const { getAuthHeader } = useAuth();
  const [cases, setCases] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCase, setEditingCase] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    case_number: "",
    case_type: "civil",
    client_name: "",
    opposing_party: "",
    court_name: "",
    judge_name: "",
    next_hearing_date: null,
    description: "",
    status: "active"
  });

  useEffect(() => {
    fetchCases();
    fetchStats();
  }, []);

  const fetchCases = async () => {
    try {
      const response = await axios.get(`${API}/cases`, getAuthHeader());
      setCases(response.data);
    } catch (error) {
      toast.error("Failed to fetch cases");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`, getAuthHeader());
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      case_number: "",
      case_type: "civil",
      client_name: "",
      opposing_party: "",
      court_name: "",
      judge_name: "",
      next_hearing_date: null,
      description: "",
      status: "active"
    });
    setEditingCase(null);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.case_number || !formData.client_name) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      const payload = {
        ...formData,
        next_hearing_date: formData.next_hearing_date 
          ? format(formData.next_hearing_date, "yyyy-MM-dd") 
          : null
      };

      if (editingCase) {
        await axios.put(`${API}/cases/${editingCase.id}`, payload, getAuthHeader());
        toast.success("Case updated successfully");
      } else {
        await axios.post(`${API}/cases`, payload, getAuthHeader());
        toast.success("Case created successfully");
      }

      setDialogOpen(false);
      resetForm();
      fetchCases();
      fetchStats();
    } catch (error) {
      toast.error("Failed to save case");
    }
  };

  const handleEdit = (caseItem) => {
    setEditingCase(caseItem);
    setFormData({
      title: caseItem.title,
      case_number: caseItem.case_number,
      case_type: caseItem.case_type,
      client_name: caseItem.client_name,
      opposing_party: caseItem.opposing_party,
      court_name: caseItem.court_name,
      judge_name: caseItem.judge_name || "",
      next_hearing_date: caseItem.next_hearing_date ? new Date(caseItem.next_hearing_date) : null,
      description: caseItem.description || "",
      status: caseItem.status
    });
    setDialogOpen(true);
  };

  const handleDelete = async (caseId) => {
    if (!window.confirm("Are you sure you want to delete this case?")) return;

    try {
      await axios.delete(`${API}/cases/${caseId}`, getAuthHeader());
      toast.success("Case deleted successfully");
      fetchCases();
      fetchStats();
    } catch (error) {
      toast.error("Failed to delete case");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return <Badge className="bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30">Active</Badge>;
      case "pending":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Pending</Badge>;
      case "closed":
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getCaseTypeIcon = (type) => {
    switch (type) {
      case "civil":
        return <Scale className="w-4 h-4 text-blue-400" />;
      case "criminal":
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case "corporate":
        return <Building className="w-4 h-4 text-purple-400" />;
      case "family":
        return <User className="w-4 h-4 text-green-400" />;
      default:
        return <Briefcase className="w-4 h-4 text-slate-400" />;
    }
  };

  const filteredCases = cases.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.case_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.client_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#0F172A] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-white mb-2">Case Management</h1>
            <p className="text-slate-400">Manage and track your litigation cases</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button 
                className="mt-4 md:mt-0 bg-[#D4AF37] text-[#0F172A] hover:bg-[#c9a430] rounded-none uppercase tracking-wide text-xs font-bold"
                data-testid="new-case-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Case
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0F172A] border-slate-800 max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-serif text-xl text-white">
                  {editingCase ? "Edit Case" : "Create New Case"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Case Title *</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Smith v. Johnson"
                      className="bg-transparent border-slate-700 text-white"
                      data-testid="case-form-title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Case Number *</label>
                    <Input
                      value={formData.case_number}
                      onChange={(e) => setFormData({...formData, case_number: e.target.value})}
                      placeholder="2024-CV-12345"
                      className="bg-transparent border-slate-700 text-white"
                      data-testid="case-form-number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Case Type</label>
                    <Select value={formData.case_type} onValueChange={(v) => setFormData({...formData, case_type: v})}>
                      <SelectTrigger className="bg-transparent border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0F172A] border-slate-700">
                        <SelectItem value="civil">Civil</SelectItem>
                        <SelectItem value="criminal">Criminal</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="family">Family</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Status</label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                      <SelectTrigger className="bg-transparent border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0F172A] border-slate-700">
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Client Name *</label>
                    <Input
                      value={formData.client_name}
                      onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                      className="bg-transparent border-slate-700 text-white"
                      data-testid="case-form-client"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Opposing Party</label>
                    <Input
                      value={formData.opposing_party}
                      onChange={(e) => setFormData({...formData, opposing_party: e.target.value})}
                      className="bg-transparent border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Court Name</label>
                    <Input
                      value={formData.court_name}
                      onChange={(e) => setFormData({...formData, court_name: e.target.value})}
                      className="bg-transparent border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Judge Name</label>
                    <Input
                      value={formData.judge_name}
                      onChange={(e) => setFormData({...formData, judge_name: e.target.value})}
                      className="bg-transparent border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Next Hearing Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start bg-transparent border-slate-700 text-white hover:bg-slate-800"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.next_hearing_date ? format(formData.next_hearing_date, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[#0F172A] border-slate-700">
                      <Calendar
                        mode="single"
                        selected={formData.next_hearing_date}
                        onSelect={(date) => setFormData({...formData, next_hearing_date: date})}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="bg-transparent border-slate-700 text-white resize-none"
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  className="w-full bg-[#D4AF37] text-[#0F172A] hover:bg-[#c9a430] rounded-none uppercase tracking-wide font-bold"
                  data-testid="case-form-submit"
                >
                  {editingCase ? "Update Case" : "Create Case"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-[#020617] border-slate-800 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.total_cases}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Total Cases</p>
                </div>
              </div>
            </Card>
            <Card className="bg-[#020617] border-slate-800 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.active_cases}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Active</p>
                </div>
              </div>
            </Card>
            <Card className="bg-[#020617] border-slate-800 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center">
                  <Gavel className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.total_simulations}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Simulations</p>
                </div>
              </div>
            </Card>
            <Card className="bg-[#020617] border-slate-800 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.active_alerts}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Alerts</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search cases..."
              className="pl-10 bg-transparent border-slate-700 text-white placeholder:text-slate-500"
              data-testid="case-search-input"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 bg-transparent border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0F172A] border-slate-700">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cases List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
          </div>
        ) : filteredCases.length === 0 ? (
          <Card className="bg-[#020617] border-slate-800 p-12 text-center">
            <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg text-white mb-2">No cases found</h3>
            <p className="text-slate-400 mb-4">Create your first case to get started</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredCases.map((caseItem) => (
              <Card 
                key={caseItem.id} 
                className="bg-[#020617] border-slate-800 hover:border-[#D4AF37]/20 transition-colors"
                data-testid={`case-card-${caseItem.id}`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-slate-800 flex items-center justify-center">
                        {getCaseTypeIcon(caseItem.case_type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-serif text-lg text-white">{caseItem.title}</h3>
                          {getStatusBadge(caseItem.status)}
                        </div>
                        <p className="text-sm text-slate-400 font-mono">{caseItem.case_number}</p>
                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {caseItem.client_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building className="w-4 h-4" />
                            {caseItem.court_name}
                          </span>
                          {caseItem.next_hearing_date && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {format(new Date(caseItem.next_hearing_date), "MMM d, yyyy")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#0F172A] border-slate-700">
                        <DropdownMenuItem 
                          onClick={() => handleEdit(caseItem)}
                          className="text-slate-300 cursor-pointer"
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(caseItem.id)}
                          className="text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {caseItem.description && (
                    <p className="mt-4 text-slate-400 text-sm border-t border-slate-800 pt-4">
                      {caseItem.description}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseManagementPage;
