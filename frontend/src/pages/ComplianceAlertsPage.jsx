import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import axios from "axios";
import {
  format, isPast, isToday, isSameDay, isSameMonth,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, addWeeks, subWeeks,
  startOfDay, getHours,
} from "date-fns";
import {
  Siren, Plus, Calendar as CalendarIcon, CheckCircle2,
  AlertTriangle, Clock, Shield, Loader2, Bell, X,
  ChevronLeft, ChevronRight, MoreVertical,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const API = "https://mpj-backend-java.onrender.com/api";

// ─── Timezone-safe date parser ─────────────────────────────────────────────────
// Spring Boot serialises LocalDateTime in THREE possible ways depending on config:
//   1. Array:      [2026, 4, 15, 10, 30, 0]       ← DEFAULT Jackson (most likely your case)
//   2. ISO string: "2026-04-15T10:30:00"           ← with @JsonFormat or java8 module
//   3. Number:     epoch milliseconds              ← rare fallback
// We always parse to LOCAL noon so isSameDay works in IST (+5:30) and everywhere else.
const parseLocalDate = (raw) => {
  if (!raw) return null;
  if (raw instanceof Date) return raw;

  // Case 1: Array [year, month(1-based), day, hour, min, sec]  ← Spring Boot default
  if (Array.isArray(raw)) {
    const [y, m, d] = raw;
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d, 12, 0, 0);  // local noon — survives any UTC offset
  }

  // Case 2: ISO string "2026-04-15" or "2026-04-15T10:30:00"
  if (typeof raw === "string") {
    const [y, m, d] = raw.split("T")[0].split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d, 12, 0, 0);  // local noon
  }

  // Case 3: Epoch number
  if (typeof raw === "number") {
    const dt = new Date(raw);
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 12, 0, 0);
  }

  return null;
};

// ─── Colour helpers ────────────────────────────────────────────────────────────
const PRIORITY_META = {
  critical: { dot: "#EF4444", bg: "rgba(239,68,68,0.15)",  text: "#FCA5A5", label: "Critical" },
  high:     { dot: "#F97316", bg: "rgba(249,115,22,0.15)", text: "#FDBA74", label: "High" },
  medium:   { dot: "#D4AF37", bg: "rgba(212,175,55,0.15)", text: "#FDE68A", label: "Medium" },
  low:      { dot: "#64748B", bg: "rgba(100,116,139,0.15)",text: "#94A3B8", label: "Low" },
};

const TYPE_META = {
  deadline:   { icon: Clock,         color: "#FBBF24" },
  risk:       { icon: AlertTriangle, color: "#EF4444" },
  procedural: { icon: Shield,        color: "#60A5FA" },
  general:    { icon: Bell,          color: "#94A3B8" },
};

const pm  = (p) => PRIORITY_META[p] || PRIORITY_META.medium;
const tm  = (t) => TYPE_META[t]     || TYPE_META.general;

// ─── Tiny event chip used in the month grid ────────────────────────────────────
const EventChip = ({ alert, onClick }) => {
  const { dot, bg, text } = pm(alert.priority);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(alert); }}
      style={{ background: bg, borderLeft: `2px solid ${dot}` }}
      className="w-full text-left truncate text-[10px] px-1.5 py-0.5 rounded-r mb-0.5 cursor-pointer hover:brightness-125 transition-all"
    >
      <span style={{ color: text }}>{alert.title}</span>
    </button>
  );
};

// ─── Alert detail popover content ─────────────────────────────────────────────
const AlertDetail = ({ alert, onResolve, onDelete, onClose }) => {
  if (!alert) return null;
  const { dot, bg, text: textC, label } = pm(alert.priority);
  const Icon = tm(alert.alert_type).icon;
  const iconColor = tm(alert.alert_type).color;
  const dueDateStatus = getDueDateStatus(alert.due_date);

  return (
    <div className="bg-[#0B1120] border border-slate-700 rounded-xl shadow-2xl p-5 w-80 z-50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-800 rounded flex items-center justify-center">
            <Icon className="w-4 h-4" style={{ color: iconColor }} />
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-wider" style={{ color: iconColor }}>
              {alert.alert_type || "general"} alert
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <h3 className="text-white font-medium text-sm mb-2">{alert.title}</h3>

      {alert.description && (
        <p className="text-slate-400 text-xs leading-relaxed mb-3">{alert.description}</p>
      )}

      <div className="flex items-center gap-2 mb-4">
        <span
          className="text-xs px-2 py-0.5 rounded-full font-mono"
          style={{ background: bg, color: textC, border: `1px solid ${dot}40` }}
        >
          {label}
        </span>
        {alert.status === "resolved" && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
            Resolved
          </span>
        )}
        {dueDateStatus && (
          <span className={`text-xs flex items-center gap-1 ${dueDateStatus.class}`}>
            <Clock className="w-3 h-3" /> {dueDateStatus.label}
          </span>
        )}
      </div>

      {alert.status === "active" && (
        <div className="flex gap-2">
          <button
            onClick={() => { onResolve(alert.id); onClose(); }}
            className="flex-1 text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded px-3 py-1.5 transition-colors flex items-center justify-center gap-1"
          >
            <CheckCircle2 className="w-3 h-3" /> Resolve
          </button>
          <button
            onClick={() => { onDelete(alert.id); onClose(); }}
            className="flex-1 text-xs bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 rounded px-3 py-1.5 transition-colors flex items-center justify-center gap-1"
          >
            <X className="w-3 h-3" /> Delete
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Utility ──────────────────────────────────────────────────────────────────
function getDueDateStatus(dateStr) {
  if (!dateStr) return null;
  const date = parseLocalDate(dateStr);
  if (!date) return null;
  if (isPast(date) && !isToday(date)) return { label: "Overdue", class: "text-red-400" };
  if (isToday(date)) return { label: "Due Today", class: "text-amber-400" };
  return { label: format(date, "MMM d"), class: "text-slate-400" };
}

// ─── Month grid view ───────────────────────────────────────────────────────────
const MonthView = ({ currentDate, alerts, onDayClick, onAlertClick }) => {
  const monthStart  = startOfMonth(currentDate);
  const monthEnd    = endOfMonth(currentDate);
  const calStart    = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd      = endOfWeek(monthEnd,     { weekStartsOn: 1 });
  const days        = [];
  let d             = calStart;
  while (d <= calEnd) { days.push(d); d = addDays(d, 1); }

  const alertsOnDay = (day) =>
    alerts.filter(a => {
      const d = parseLocalDate(a.due_date);
      return d && isSameDay(d, day);
    });

  const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-slate-800">
        {WEEKDAYS.map(wd => (
          <div key={wd} className="text-center text-xs font-mono uppercase tracking-widest text-slate-500 py-2">
            {wd}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 flex-1" style={{ gridAutoRows: "minmax(90px, 1fr)" }}>
        {days.map((day, idx) => {
          const inMonth  = isSameMonth(day, currentDate);
          const isNow    = isToday(day);
          const dayAlerts = alertsOnDay(day);

          return (
            <div
              key={idx}
              onClick={() => onDayClick(day)}
              className={`border-r border-b border-slate-800/60 p-1 cursor-pointer group transition-colors ${
                inMonth ? "bg-[#080E1C] hover:bg-[#0D1628]" : "bg-[#050A14] hover:bg-[#080E1C]"
              }`}
            >
              {/* Day number */}
              <div className="flex justify-between items-center mb-1">
                <span
                  className={`text-xs w-6 h-6 flex items-center justify-center rounded-full font-mono transition-all ${
                    isNow
                      ? "bg-[#D4AF37] text-[#080E1C] font-bold"
                      : inMonth
                      ? "text-slate-300 group-hover:text-white"
                      : "text-slate-600"
                  }`}
                >
                  {format(day, "d")}
                </span>
                {dayAlerts.length > 0 && (
                  <span className="text-[9px] font-mono text-slate-500">{dayAlerts.length}</span>
                )}
              </div>

              {/* Event chips — show first 3 */}
              <div className="space-y-0.5">
                {dayAlerts.slice(0, 3).map(a => (
                  <EventChip key={a.id} alert={a} onClick={onAlertClick} />
                ))}
                {dayAlerts.length > 3 && (
                  <div className="text-[9px] font-mono text-slate-500 pl-1">+{dayAlerts.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state — alerts exist but none in this month */}
      {alerts.length > 0 && !alerts.some(a => {
        const d = parseLocalDate(a.due_date);
        return d && isSameMonth(d, currentDate);
      }) && (
        <div className="text-center py-3 text-xs font-mono text-slate-600 border-t border-slate-800/40">
          No alerts in {format(currentDate, "MMMM yyyy")} — navigate to a month with alerts or create a new one
        </div>
      )}
    </div>
  );
};

// ─── Week view ─────────────────────────────────────────────────────────────────
const WeekView = ({ currentDate, alerts, onAlertClick }) => {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const alertsOnDay = (day) =>
    alerts.filter(a => {
      const d = parseLocalDate(a.due_date);
      return d && isSameDay(d, day);
    });

  return (
    <div className="flex-1 overflow-auto">
      {/* Header row */}
      <div className="grid border-b border-slate-800 sticky top-0 z-10 bg-[#080E1C]" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
        <div />
        {days.map((day, i) => (
          <div key={i} className="text-center py-2 border-l border-slate-800">
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
              {format(day, "EEE")}
            </div>
            <div className={`mx-auto mt-1 w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono ${
              isToday(day) ? "bg-[#D4AF37] text-[#080E1C] font-bold" : "text-slate-300"
            }`}>
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>

      {/* All-day events row */}
      <div className="grid border-b border-slate-800" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
        <div className="text-[9px] font-mono text-slate-600 p-1 flex items-center justify-end pr-2">ALL DAY</div>
        {days.map((day, i) => {
          const dayAlerts = alertsOnDay(day);
          return (
            <div key={i} className="border-l border-slate-800 min-h-[36px] p-1">
              {dayAlerts.map(a => (
                <EventChip key={a.id} alert={a} onClick={onAlertClick} />
              ))}
            </div>
          );
        })}
      </div>

      {/* Hour grid */}
      <div className="grid" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
        {/* Hour labels */}
        <div className="col-start-1">
          {hours.map(h => (
            <div key={h} className="h-14 flex items-start justify-end pr-2 pt-1">
              <span className="text-[9px] font-mono text-slate-600">
                {h === 0 ? "" : `${h.toString().padStart(2, "0")}:00`}
              </span>
            </div>
          ))}
        </div>
        {/* Day columns */}
        {days.map((day, di) => (
          <div key={di} className="border-l border-slate-800 relative">
            {hours.map(h => (
              <div key={h} className="h-14 border-b border-slate-800/40" />
            ))}
            {/* Current time indicator */}
            {isToday(day) && (
              <div
                className="absolute left-0 right-0 z-10 pointer-events-none"
                style={{ top: `${(getHours(new Date()) / 24) * 100}%` }}
              >
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-[#D4AF37] -ml-1" />
                  <div className="flex-1 h-px bg-[#D4AF37]" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Day view ──────────────────────────────────────────────────────────────────
const DayView = ({ currentDate, alerts, onAlertClick }) => {
  const dayAlerts = alerts.filter(a => {
    const d = parseLocalDate(a.due_date);
    return d && isSameDay(d, currentDate);
  });
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="flex-1 overflow-auto">
      {/* Date header */}
      <div className="px-6 py-4 border-b border-slate-800 sticky top-0 bg-[#080E1C] z-10 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full flex flex-col items-center justify-center text-center ${
          isToday(currentDate) ? "bg-[#D4AF37]" : "bg-slate-800"
        }`}>
          <div className={`text-[10px] font-mono uppercase ${isToday(currentDate) ? "text-[#080E1C]" : "text-slate-400"}`}>
            {format(currentDate, "EEE")}
          </div>
          <div className={`text-lg font-bold font-mono leading-tight ${isToday(currentDate) ? "text-[#080E1C]" : "text-white"}`}>
            {format(currentDate, "d")}
          </div>
        </div>
        <div>
          <div className="text-white font-serif text-lg">{format(currentDate, "MMMM yyyy")}</div>
          <div className="text-slate-500 text-xs font-mono">{dayAlerts.length} alert{dayAlerts.length !== 1 ? "s" : ""} scheduled</div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "56px 1fr" }}>
        {/* Hours */}
        <div>
          {hours.map(h => (
            <div key={h} className="h-16 flex items-start justify-end pr-3 pt-1">
              <span className="text-[9px] font-mono text-slate-600">
                {h === 0 ? "" : `${h.toString().padStart(2, "0")}:00`}
              </span>
            </div>
          ))}
        </div>
        {/* Events column */}
        <div className="relative border-l border-slate-800">
          {hours.map(h => (
            <div key={h} className="h-16 border-b border-slate-800/40" />
          ))}
          {/* Today line */}
          {isToday(currentDate) && (
            <div
              className="absolute left-0 right-0 z-10 pointer-events-none"
              style={{ top: `${(getHours(new Date()) / 24) * 100}%` }}
            >
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-[#D4AF37] -ml-1" />
                <div className="flex-1 h-px bg-[#D4AF37]" />
              </div>
            </div>
          )}
          {/* Alert blocks — placed in morning band since events are date-only */}
          {dayAlerts.length > 0 && (
            <div className="absolute left-2 right-2 top-4 flex flex-col gap-2">
              {dayAlerts.map(a => {
                const { dot, bg, text: textC } = pm(a.priority);
                const Icon = tm(a.alert_type).icon;
                return (
                  <button
                    key={a.id}
                    onClick={() => onAlertClick(a)}
                    className="text-left rounded-lg p-3 border transition-all hover:brightness-125"
                    style={{ background: bg, borderColor: `${dot}40`, borderLeft: `3px solid ${dot}` }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-3 h-3" style={{ color: dot }} />
                      <span className="text-xs font-medium" style={{ color: textC }}>{a.title}</span>
                    </div>
                    {a.description && (
                      <div className="text-[10px] text-slate-400 line-clamp-2">{a.description}</div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main component ────────────────────────────────────────────────────────────
const ComplianceAlertsPage = () => {
  const { getAuthHeader } = useAuth();

  const [alerts,        setAlerts]        = useState([]);
  const [cases,         setCases]         = useState([]);
  const [isLoading,     setIsLoading]     = useState(true);
  const [dialogOpen,    setDialogOpen]    = useState(false);
  const [filterType,    setFilterType]    = useState("all");
  const [filterStatus,  setFilterStatus]  = useState("all");
  const [view,          setView]          = useState("month");
  const [currentDate,   setCurrentDate]   = useState(new Date());
  const [selectedAlert, setSelectedAlert] = useState(null);

  const [formData, setFormData] = useState({
    title: "", alert_type: "deadline", case_id: "none",
    due_date: null, description: "", priority: "medium",
  });


  // ── FIX 1: fetchAlerts no longer contains the stray due_date guard that was
  //           preventing the GET request from ever firing.
  const fetchAlerts = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/events`, getAuthHeader());

      const mapped = response.data.map(e => {
        // Backend Event.java exposes `date` (LocalDateTime). Support all aliases.
        const rawDate = e.date ?? e.dueDate ?? e.due_date ?? null;
        const parsed  = parseLocalDate(rawDate);
        console.log("[LexAequitas] Event:", e.id, e.title, "| raw date:", rawDate, "| parsed:", parsed);
        return {
          id:          e.id,
          title:       e.title,
          // ── FIX 2: normalise eventType → alert_type (backend uses UPPERCASE enum)
          alert_type:  e.eventType  ? e.eventType.toLowerCase()
                     : e.alert_type ? e.alert_type.toLowerCase()
                     : "general",
          due_date:    rawDate,     // keep raw; parseLocalDate re-runs at render time
          _parsedDate: parsed,      // pre-parsed reference for debugging
          // ── FIX 3: backend field is `notes`, not `description`
          description: e.notes || e.description || "",
          priority:    e.priority || "medium",
          status:      e.status   || "active",
        };
      });
      setAlerts(mapped);
    } catch {
      toast.error("Failed to fetch alerts");
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeader]);

  const fetchCases = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/cases`, getAuthHeader());
      setCases(r.data);
    } catch { /* silent */ }
  }, [getAuthHeader]);

  useEffect(() => { fetchAlerts(); fetchCases(); }, [fetchAlerts, fetchCases]);

  const resetForm = () => setFormData({
    title: "", alert_type: "deadline", case_id: "none",
    due_date: null, description: "", priority: "medium",
  });

  const handleSubmit = async () => {
    if (!formData.title || !formData.description) {
      toast.error("Please fill required fields");
      return;
    }
    // ── FIX 4: due_date validation belongs only here, not in fetchAlerts
    if (!formData.due_date) {
      toast.error("Please select a due date");
      return;
    }
    try {
      // POST body aligned to backend Event.java field names:
      //   title, eventType (UPPERCASE enum), date (ISO LocalDateTime), notes, priority, status, caseId
      await axios.post(`${API}/events`, {
        title:     formData.title,
        eventType: formData.alert_type.toUpperCase(),
        date:      format(formData.due_date, "yyyy-MM-dd'T'HH:mm:ss"),
        notes:     formData.description,
        priority:  formData.priority,
        status:    "active",
        caseId:    formData.case_id === "none" ? null : Number(formData.case_id),
      }, getAuthHeader());
      toast.success("Alert created");
      setDialogOpen(false);
      resetForm();
      fetchAlerts();
    } catch {
      toast.error("Failed to create alert");
    }
  };

  // PUT /api/events/{id}/resolve  →  EventController.resolve()  →  EventService.resolveEvent()
  const handleResolve = async (id) => {
    try {
      await axios.put(`${API}/events/${id}/resolve`, {}, getAuthHeader());
      toast.success("Resolved");
      fetchAlerts();
    } catch {
      toast.error("Failed to resolve");
    }
  };

  // DELETE /api/events/{id}  →  EventController.delete()  →  EventService.deleteEvent()
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/events/${id}`, getAuthHeader());
      toast.success("Deleted");
      fetchAlerts();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleAlertClick = (alert) => {
    setSelectedAlert(alert);
  };

  const handleDayClick = (day) => {
    setCurrentDate(day);
    setView("day");
  };

  // Navigation
  const navigate = (dir) => {
    if (view === "month") setCurrentDate(dir > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    if (view === "week")  setCurrentDate(dir > 0 ? addWeeks(currentDate, 1)  : subWeeks(currentDate, 1));
    if (view === "day")   setCurrentDate(addDays(currentDate, dir));
  };

  const headerLabel = () => {
    if (view === "month") return format(currentDate, "MMMM yyyy");
    if (view === "week") {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
      const we = endOfWeek(currentDate,   { weekStartsOn: 1 });
      return `${format(ws, "MMM d")} – ${format(we, "MMM d, yyyy")}`;
    }
    return format(currentDate, "EEEE, MMMM d, yyyy");
  };

  const filteredAlerts = alerts.filter(a => {
    const mt = filterType   === "all" || a.alert_type === filterType;
    const ms = filterStatus === "all" || a.status     === filterStatus;
    return mt && ms;
  });

  const activeCount   = alerts.filter(a => a.status === "active").length;
  const criticalCount = alerts.filter(a => a.status === "active" && a.priority === "critical").length;

  return (
    <div className="h-screen bg-[#080E1C] flex flex-col overflow-hidden" onClick={() => setSelectedAlert(null)}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-[#080E1C] flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[#D4AF37]" />
            <span className="font-serif text-white text-lg">Compliance Calendar</span>
          </div>

          {/* Stat pills */}
          <div className="hidden md:flex items-center gap-2 ml-4">
            {[
              { icon: Bell,         count: activeCount,   color: "amber",   label: "Active" },
              { icon: Siren,        count: criticalCount, color: "red",     label: "Critical" },
              { icon: CheckCircle2, count: alerts.filter(a => a.status === "resolved").length, color: "emerald", label: "Resolved" },
            ].map(({ icon: Icon, count, color, label }) => (
              <div key={label} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-${color}-500/10 border border-${color}-500/20`}>
                <Icon className={`w-3 h-3 text-${color}-400`} />
                <span className={`text-xs font-mono text-${color}-400`}>{count} {label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filters */}
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32 h-8 bg-transparent border-slate-700 text-slate-400 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0F172A] border-slate-700">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="deadline">Deadlines</SelectItem>
              <SelectItem value="risk">Risk</SelectItem>
              <SelectItem value="procedural">Procedural</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-28 h-8 bg-transparent border-slate-700 text-slate-400 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0F172A] border-slate-700">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>

          {/* View switcher */}
          <div className="flex border border-slate-700 rounded overflow-hidden">
            {["month", "week", "day"].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-mono capitalize transition-colors ${
                  view === v
                    ? "bg-[#D4AF37] text-[#080E1C] font-bold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* New Alert */}
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="bg-[#D4AF37] text-[#080E1C] hover:bg-[#c9a430] font-bold text-xs uppercase tracking-wide rounded"
                data-testid="new-alert-btn"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> New Alert
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0B1120] border-slate-700 max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-serif text-xl text-white">Create Compliance Alert</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-mono uppercase tracking-wider">Alert Title *</label>
                  <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g. Filing Deadline — Motion Response"
                    className="bg-transparent border-slate-700 text-white" data-testid="alert-form-title" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-mono uppercase tracking-wider">Type</label>
                    <Select value={formData.alert_type} onValueChange={v => setFormData({...formData, alert_type: v})}>
                      <SelectTrigger className="bg-transparent border-slate-700 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#0F172A] border-slate-700">
                        <SelectItem value="deadline">Deadline</SelectItem>
                        <SelectItem value="risk">Risk Alert</SelectItem>
                        <SelectItem value="procedural">Procedural</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-mono uppercase tracking-wider">Priority</label>
                    <Select value={formData.priority} onValueChange={v => setFormData({...formData, priority: v})}>
                      <SelectTrigger className="bg-transparent border-slate-700 text-white"><SelectValue /></SelectTrigger>
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
                  <label className="block text-xs text-slate-400 mb-1.5 font-mono uppercase tracking-wider">Associated Case</label>
                  <Select value={formData.case_id} onValueChange={v => setFormData({...formData, case_id: v})}>
                    <SelectTrigger className="bg-transparent border-slate-700 text-white">
                      <SelectValue placeholder="Select a case (optional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0F172A] border-slate-700">
                      <SelectItem value="none">None</SelectItem>
                      {cases.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-mono uppercase tracking-wider">Due Date *</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start bg-transparent border-slate-700 text-white hover:bg-slate-800">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.due_date ? format(formData.due_date, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[#0B1120] border-slate-700">
                      <Calendar mode="single" selected={formData.due_date} onSelect={d => setFormData({...formData, due_date: d})} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-mono uppercase tracking-wider">Description *</label>
                  <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe the compliance requirement..."
                    className="bg-transparent border-slate-700 text-white resize-none" rows={3}
                    data-testid="alert-form-description" />
                </div>
                <Button onClick={handleSubmit} className="w-full bg-[#D4AF37] text-[#080E1C] hover:bg-[#c9a430] font-bold uppercase tracking-wide"
                  data-testid="alert-form-submit">
                  Create Alert
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── Calendar nav bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 py-2.5 border-b border-slate-800 bg-[#080E1C] flex-shrink-0">
        <button
          onClick={() => setCurrentDate(new Date())}
          className="text-xs font-mono px-3 py-1.5 rounded border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
        >
          Today
        </button>
        <div className="flex items-center gap-1">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => navigate(1)}  className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <h2 className="font-serif text-white text-base">{headerLabel()}</h2>
      </div>

      {/* ── Calendar body ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
          </div>
        ) : (
          <>
            {view === "month" && (
              <MonthView
                currentDate={currentDate}
                alerts={filteredAlerts}
                onDayClick={handleDayClick}
                onAlertClick={handleAlertClick}
              />
            )}
            {view === "week" && (
              <WeekView
                currentDate={currentDate}
                alerts={filteredAlerts}
                onAlertClick={handleAlertClick}
              />
            )}
            {view === "day" && (
              <DayView
                currentDate={currentDate}
                alerts={filteredAlerts}
                onAlertClick={handleAlertClick}
              />
            )}
          </>
        )}

        {/* Alert detail overlay */}
        {selectedAlert && (
          <div
            className="absolute top-4 right-4 z-50"
            onClick={e => e.stopPropagation()}
          >
            <AlertDetail
              alert={selectedAlert}
              onResolve={handleResolve}
              onDelete={handleDelete}
              onClose={() => setSelectedAlert(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplianceAlertsPage;