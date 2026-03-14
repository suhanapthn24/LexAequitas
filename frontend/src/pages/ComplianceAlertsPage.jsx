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
import { toast } from "sonner";
import axios from "axios";
import { format, isPast, isToday } from "date-fns";
import {
  Siren,
  Plus,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Loader2,
  Bell,
  X
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ComplianceAlertsPage = () => {
  const { getAuthHeader } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("active");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    alert_type: "deadline",
    case_id: "",
    due_date: null,
    description: "",
    priority: "medium"
  });

  useEffect(() => {
    fetchAlerts();
    fetchCases();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get(`${API}/alerts`, getAuthHeader());
      setAlerts(response.data);
    } catch (error) {
      toast.error("Failed to fetch alerts");
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
      alert_type: "deadline",
      case_id: "",
      due_date: null,
      description: "",
      priority: "medium"
    });
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      const payload = {
        ...formData,
        due_date: formData.due_date ? format(formData.due_date, "yyyy-MM-dd") : null,
        case_id: formData.case_id || null
      };

      await axios.post(`${API}/alerts`, payload, getAuthHeader());
      toast.success("Alert created successfully");
      setDialogOpen(false);
      resetForm();
      fetchAlerts();
    } catch (error) {
      toast.error("Failed to create alert");
    }
  };

  const handleResolve = async (alertId) => {
    try {
      await axios.put(`${API}/alerts/${alertId}/resolve`, {}, getAuthHeader());
      toast.success("Alert resolved");
      fetchAlerts();
    } catch (error) {
      toast.error("Failed to resolve alert");
    }
  };

  const handleDelete = async (alertId) => {
    try {
      await axios.delete(`${API}/alerts/${alertId}`, getAuthHeader());
      toast.success("Alert deleted");
      fetchAlerts();
    } catch (error) {
      toast.error("Failed to delete alert");
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "critical":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Critical</Badge>;
      case "high":
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">High</Badge>;
      case "medium":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Medium</Badge>;
      case "low":
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Low</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  const getAlertTypeIcon = (type) => {
    switch (type) {
      case "deadline":
        return <Clock className="w-5 h-5 text-amber-400" />;
      case "risk":
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case "procedural":
        return <Shield className="w-5 h-5 text-blue-400" />;
      default:
        return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  const getDueDateStatus = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isPast(date) && !isToday(date)) {
      return { label: "Overdue", class: "text-red-400" };
    }
    if (isToday(date)) {
      return { label: "Due Today", class: "text-amber-400" };
    }
    return { label: format(date, "MMM d"), class: "text-slate-400" };
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesType = filterType === "all" || alert.alert_type === filterType;
    const matchesStatus = filterStatus === "all" || alert.status === filterStatus;
    return matchesType && matchesStatus;
  });

  // Sort by priority and due date
  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    if (a.due_date && b.due_date) {
      return new Date(a.due_date) - new Date(b.due_date);
    }
    return 0;
  });

  const activeCount = alerts.filter(a => a.status === "active").length;
  const criticalCount = alerts.filter(a => a.status === "active" && a.priority === "critical").length;

  return (
    <div className="min-h-screen bg-[#0F172A] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-white mb-2">Compliance Alerts</h1>
            <p className="text-slate-400">Track deadlines, risks, and procedural requirements</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button 
                className="mt-4 md:mt-0 bg-[#D4AF37] text-[#0F172A] hover:bg-[#c9a430] rounded-none uppercase tracking-wide text-xs font-bold"
                data-testid="new-alert-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Alert
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0F172A] border-slate-800 max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-serif text-xl text-white">Create Alert</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Alert Title *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Filing Deadline - Motion Response"
                    className="bg-transparent border-slate-700 text-white"
                    data-testid="alert-form-title"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Alert Type</label>
                    <Select value={formData.alert_type} onValueChange={(v) => setFormData({...formData, alert_type: v})}>
                      <SelectTrigger className="bg-transparent border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0F172A] border-slate-700">
                        <SelectItem value="deadline">Deadline</SelectItem>
                        <SelectItem value="risk">Risk Alert</SelectItem>
                        <SelectItem value="procedural">Procedural</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Priority</label>
                    <Select value={formData.priority} onValueChange={(v) => setFormData({...formData, priority: v})}>
                      <SelectTrigger className="bg-transparent border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0F172A] border-slate-700">
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                  <label className="block text-sm text-slate-400 mb-2">Due Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start bg-transparent border-slate-700 text-white hover:bg-slate-800"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.due_date ? format(formData.due_date, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[#0F172A] border-slate-700">
                      <Calendar
                        mode="single"
                        selected={formData.due_date}
                        onSelect={(date) => setFormData({...formData, due_date: date})}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Description *</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe the alert details..."
                    className="bg-transparent border-slate-700 text-white resize-none"
                    rows={3}
                    data-testid="alert-form-description"
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  className="w-full bg-[#D4AF37] text-[#0F172A] hover:bg-[#c9a430] rounded-none uppercase tracking-wide font-bold"
                  data-testid="alert-form-submit"
                >
                  Create Alert
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-[#020617] border-slate-800 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{activeCount}</p>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Active Alerts</p>
              </div>
            </div>
          </Card>
          <Card className="bg-[#020617] border-slate-800 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <Siren className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{criticalCount}</p>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Critical</p>
              </div>
            </div>
          </Card>
          <Card className="bg-[#020617] border-slate-800 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{alerts.filter(a => a.status === "resolved").length}</p>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Resolved</p>
              </div>
            </div>
          </Card>
          <Card className="bg-[#020617] border-slate-800 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{alerts.length}</p>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Total</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40 bg-transparent border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0F172A] border-slate-700">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="deadline">Deadlines</SelectItem>
              <SelectItem value="risk">Risk Alerts</SelectItem>
              <SelectItem value="procedural">Procedural</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 bg-transparent border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0F172A] border-slate-700">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Alerts List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
          </div>
        ) : sortedAlerts.length === 0 ? (
          <Card className="bg-[#020617] border-slate-800 p-12 text-center">
            <Bell className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg text-white mb-2">No alerts found</h3>
            <p className="text-slate-400 mb-4">Create alerts to track deadlines and risks</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedAlerts.map((alert) => {
              const dueDateStatus = getDueDateStatus(alert.due_date);
              return (
                <Card 
                  key={alert.id} 
                  className={`bg-[#020617] border-slate-800 ${
                    alert.status === "resolved" ? "opacity-60" : ""
                  } ${
                    alert.priority === "critical" ? "border-l-4 border-l-red-500" :
                    alert.priority === "high" ? "border-l-4 border-l-orange-500" : ""
                  }`}
                  data-testid={`alert-card-${alert.id}`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-slate-800 flex items-center justify-center">
                          {getAlertTypeIcon(alert.alert_type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-medium text-white">{alert.title}</h3>
                            {getPriorityBadge(alert.priority)}
                            {alert.status === "resolved" && (
                              <Badge className="bg-[#10B981]/20 text-[#10B981]">Resolved</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-400 mb-2">
                            {alert.alert_type.charAt(0).toUpperCase() + alert.alert_type.slice(1)} Alert
                          </p>
                          <p className="text-slate-300">{alert.description}</p>
                          {dueDateStatus && (
                            <p className={`mt-2 text-sm flex items-center gap-1 ${dueDateStatus.class}`}>
                              <Clock className="w-4 h-4" />
                              {dueDateStatus.label}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {alert.status === "active" && (
                          <Button
                            onClick={() => handleResolve(alert.id)}
                            variant="outline"
                            size="sm"
                            className="border-[#10B981]/50 text-[#10B981] hover:bg-[#10B981]/10"
                            data-testid={`resolve-alert-${alert.id}`}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Resolve
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDelete(alert.id)}
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplianceAlertsPage;
