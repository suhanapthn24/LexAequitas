import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const API = "https://mpj-backend-java.onrender.com/api";

// ── Constants ──────────────────────────────────────────────────────────────
const CASE_TYPES = ["civil", "criminal", "family", "corporate", "property", "labour", "tax", "constitutional"];

const STATUSES = [
  { value: "active",     label: "Active",     color: "#22c55e" },
  { value: "pending",    label: "Pending",    color: "#f59e0b" },
  { value: "adjourned",  label: "Adjourned",  color: "#6366f1" },
  { value: "appealed",   label: "Appealed",   color: "#ec4899" },
  { value: "closed",     label: "Closed",     color: "#6b7280" },
  { value: "won",        label: "Won",        color: "#10b981" },
  { value: "lost",       label: "Lost",       color: "#ef4444" },
];

const STATUS_PIPELINE = ["active", "pending", "adjourned", "appealed", "closed"];

const EMPTY_FORM = {
  title: "",
  caseNumber: "",
  caseType: "civil",
  clientName: "",
  opposingParty: "",
  courtName: "",
  judgeName: "",
  nextHearingDate: "",
  description: "",
  status: "active",
};

// ── Helpers ────────────────────────────────────────────────────────────────
const statusMeta = (val) => STATUSES.find((s) => s.value === val) || STATUSES[0];

const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const daysUntil = (d) => {
  if (!d) return null;
  const diff = Math.ceil((new Date(d) - new Date()) / 86400000);
  return diff;
};

// ── Sub-components ─────────────────────────────────────────────────────────
const Badge = ({ status }) => {
  const meta = statusMeta(status);
  return (
    <span
      style={{
        backgroundColor: meta.color + "22",
        color: meta.color,
        border: `1px solid ${meta.color}55`,
        borderRadius: "6px",
        padding: "2px 10px",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        display: "inline-block",
      }}
    >
      {meta.label}
    </span>
  );
};

const HearingBadge = ({ date }) => {
  const days = daysUntil(date);
  if (days === null) return null;
  const urgent = days <= 3;
  const past = days < 0;
  return (
    <span
      style={{
        backgroundColor: past ? "#ef444422" : urgent ? "#f59e0b22" : "#6366f122",
        color: past ? "#ef4444" : urgent ? "#f59e0b" : "#a5b4fc",
        border: `1px solid ${past ? "#ef4444" : urgent ? "#f59e0b" : "#6366f1"}55`,
        borderRadius: "6px",
        padding: "2px 10px",
        fontSize: "11px",
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      {past ? "⚠ Overdue" : urgent ? `⚡ In ${days}d` : `📅 In ${days}d`}
    </span>
  );
};

const StatCard = ({ label, value, accent }) => (
  <div
    style={{
      background: "#0f172a",
      border: "1px solid #1e293b",
      borderRadius: "12px",
      padding: "18px 24px",
      borderLeft: `3px solid ${accent}`,
    }}
  >
    <p style={{ color: "#64748b", fontSize: "12px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>{label}</p>
    <p style={{ color: "#f1f5f9", fontSize: "28px", fontWeight: 800, fontFamily: "Georgia, serif" }}>{value}</p>
  </div>
);

const ProgressPipeline = ({ status }) => {
  const idx = STATUS_PIPELINE.indexOf(status);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0", margin: "8px 0 2px" }}>
      {STATUS_PIPELINE.map((s, i) => {
        const meta = statusMeta(s);
        const active = i === idx;
        const done = i < idx;
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: active ? meta.color : done ? "#334155" : "#1e293b",
                  border: `2px solid ${active ? meta.color : done ? "#475569" : "#1e293b"}`,
                  boxShadow: active ? `0 0 8px ${meta.color}` : "none",
                  transition: "all 0.3s",
                  flexShrink: 0,
                }}
              />
              <span style={{ color: active ? meta.color : "#475569", fontSize: "9px", marginTop: "3px", whiteSpace: "nowrap", fontWeight: active ? 700 : 400 }}>
                {meta.label}
              </span>
            </div>
            {i < STATUS_PIPELINE.length - 1 && (
              <div style={{ height: "2px", flex: 1, backgroundColor: done ? "#334155" : "#1e293b", marginBottom: "14px" }} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────
const CaseManagementPage = () => {
  const { user } = useAuth();

  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  // ── API helpers ──────────────────────────────────────────────────────────
  const getHeaders = () => ({ "Content-Type": "application/json" });

  const fetchCases = useCallback(async () => {
    try {
      const res = await fetch(`${API}/cases`, { headers: getHeaders() });
      const data = await res.json();
      setCases(data);
    } catch {
      toast.error("Failed to fetch cases");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  // ── CRUD ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!formData.title || !formData.caseNumber || !formData.clientName) {
      toast.error("Title, Case Number and Client Name are required");
      return;
    }

    const payload = {
      ...formData,
      nextHearingDate: formData.nextHearingDate || null,
    };

    try {
      const url = editingId ? `${API}/cases/${editingId}` : `${API}/cases`;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(payload) });

      if (!res.ok) { toast.error(editingId ? "Update failed" : "Create failed"); return; }

      toast.success(editingId ? "Case updated" : "Case created");
      setFormData(EMPTY_FORM);
      setEditingId(null);
      setShowForm(false);
      fetchCases();
    } catch {
      toast.error("Request failed");
    }
  };

  const handleEdit = (c) => {
    setFormData({
      title: c.title || "",
      caseNumber: c.caseNumber || "",
      caseType: c.caseType || "civil",
      clientName: c.clientName || "",
      opposingParty: c.opposingParty || "",
      courtName: c.courtName || "",
      judgeName: c.judgeName || "",
      nextHearingDate: c.nextHearingDate || "",
      description: c.description || "",
      status: c.status || "active",
    });
    setEditingId(c.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this case?")) return;
    try {
      await fetch(`${API}/cases/${id}`, { method: "DELETE", headers: getHeaders() });
      toast.success("Case deleted");
      fetchCases();
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleStatusChange = async (c, newStatus) => {
    try {
      const res = await fetch(`${API}/cases/${c.id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ ...c, status: newStatus }),
      });
      if (!res.ok) { toast.error("Status update failed"); return; }
      toast.success("Status updated");
      fetchCases();
    } catch {
      toast.error("Status update failed");
    }
  };

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filtered = cases.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.title?.toLowerCase().includes(q) ||
      c.caseNumber?.toLowerCase().includes(q) ||
      c.clientName?.toLowerCase().includes(q) ||
      c.courtName?.toLowerCase().includes(q) ||
      c.judgeName?.toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    const matchType = filterType === "all" || c.caseType === filterType;
    return matchSearch && matchStatus && matchType;
  });

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = {
    total: cases.length,
    active: cases.filter((c) => c.status === "active").length,
    upcoming: cases.filter((c) => { const d = daysUntil(c.nextHearingDate); return d !== null && d >= 0 && d <= 7; }).length,
    closed: cases.filter((c) => ["closed", "won", "lost"].includes(c.status)).length,
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const inputStyle = {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "8px",
    color: "#f1f5f9",
    padding: "10px 14px",
    fontSize: "14px",
    width: "100%",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    color: "#94a3b8",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: "5px",
    display: "block",
  };

  const field = (label, key, type = "text", options = null) => (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <label style={labelStyle}>{label}</label>
      {options ? (
        <select
          value={formData[key]}
          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
          style={inputStyle}
        >
          {options.map((o) => (
            <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={formData[key]}
          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
          style={inputStyle}
          placeholder={label}
        />
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#020817", color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", padding: "0" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1e293b", padding: "24px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#020817", position: "sticky", top: 0, zIndex: 50 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "26px", fontWeight: 800, color: "#f8fafc", margin: 0, letterSpacing: "-0.5px" }}>
            ⚖ LexAequitas
          </h1>
          <p style={{ color: "#475569", fontSize: "13px", margin: "2px 0 0" }}>Case Management System</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setFormData(EMPTY_FORM); setShowForm(!showForm); }}
          style={{
            background: showForm ? "#1e293b" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "10px 20px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {showForm ? "✕ Cancel" : "+ New Case"}
        </button>
      </div>

      <div style={{ padding: "32px 40px", maxWidth: "1400px", margin: "0 auto" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
          <StatCard label="Total Cases" value={stats.total} accent="#6366f1" />
          <StatCard label="Active" value={stats.active} accent="#22c55e" />
          <StatCard label="Hearing ≤7 days" value={stats.upcoming} accent="#f59e0b" />
          <StatCard label="Closed / Resolved" value={stats.closed} accent="#64748b" />
        </div>

        {/* Form */}
        {showForm && (
          <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "16px", padding: "28px", marginBottom: "32px" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 700, marginBottom: "24px", color: "#e2e8f0" }}>
              {editingId ? "✏ Edit Case" : "📁 New Case"}
            </h2>

            {/* Row 1 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              {field("Case Title *", "title")}
              {field("Case Number *", "caseNumber")}
              {field("Case Type", "caseType", "text", CASE_TYPES.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) })))}
            </div>

            {/* Row 2: Client Info */}
            <div style={{ border: "1px solid #1e293b", borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
              <p style={{ color: "#6366f1", fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "12px" }}>👤 Client Information</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {field("Client Name *", "clientName")}
                {field("Opposing Party", "opposingParty")}
              </div>
            </div>

            {/* Row 3: Court & Judge */}
            <div style={{ border: "1px solid #1e293b", borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
              <p style={{ color: "#10b981", fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "12px" }}>🏛 Court & Judge Details</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {field("Court Name", "courtName")}
                {field("Judge Name", "judgeName")}
              </div>
            </div>

            {/* Row 4: Scheduling & Status */}
            <div style={{ border: "1px solid #1e293b", borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
              <p style={{ color: "#f59e0b", fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "12px" }}>📅 Scheduling & Status</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {field("Next Hearing Date", "nextHearingDate", "date")}
                {field("Status", "status", "text", STATUSES.map((s) => ({ value: s.value, label: s.label })))}
              </div>
            </div>

            {/* Description */}
            <div style={{ display: "flex", flexDirection: "column", marginBottom: "20px" }}>
              <label style={labelStyle}>Description / Notes</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Case notes, background, relevant details..."
                style={{ ...inputStyle, resize: "vertical", lineHeight: "1.6" }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={handleSubmit}
                style={{
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px 28px",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  flex: 1,
                }}
              >
                {editingId ? "Update Case" : "Create Case"}
              </button>
              {editingId && (
                <button
                  onClick={() => { setEditingId(null); setFormData(EMPTY_FORM); setShowForm(false); }}
                  style={{ background: "#1e293b", color: "#94a3b8", border: "none", borderRadius: "8px", padding: "12px 20px", cursor: "pointer" }}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍  Search by title, number, client, judge..."
            style={{ ...inputStyle, flex: 2, minWidth: "220px" }}
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ ...inputStyle, flex: 1, minWidth: "130px" }}
          >
            <option value="all">All Statuses</option>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ ...inputStyle, flex: 1, minWidth: "130px" }}
          >
            <option value="all">All Types</option>
            {CASE_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <span style={{ color: "#475569", fontSize: "13px", whiteSpace: "nowrap" }}>
            {filtered.length} of {cases.length} cases
          </span>
        </div>

        {/* Case List */}
        {isLoading ? (
          <p style={{ color: "#475569", textAlign: "center", padding: "60px 0" }}>Loading cases…</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: "#475569", textAlign: "center", padding: "60px 0" }}>No cases found</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filtered.map((c) => {
              const expanded = expandedId === c.id;
              const days = daysUntil(c.nextHearingDate);
              return (
                <div
                  key={c.id}
                  style={{
                    background: "#0f172a",
                    border: `1px solid ${expanded ? "#334155" : "#1e293b"}`,
                    borderRadius: "12px",
                    overflow: "hidden",
                    transition: "border-color 0.2s",
                  }}
                >
                  {/* Card Header */}
                  <div
                    onClick={() => setExpandedId(expanded ? null : c.id)}
                    style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: "16px" }}
                  >
                    {/* Case type tag */}
                    <div style={{ background: "#1e293b", borderRadius: "6px", padding: "4px 10px", fontSize: "11px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
                      {c.caseType || "—"}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px", flexWrap: "wrap" }}>
                        <h3 style={{ fontWeight: 700, fontSize: "15px", color: "#f1f5f9", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</h3>
                        <Badge status={c.status} />
                        {c.nextHearingDate && <HearingBadge date={c.nextHearingDate} />}
                      </div>
                      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                        <span style={{ color: "#6366f1", fontSize: "12px", fontWeight: 600 }}>#{c.caseNumber}</span>
                        <span style={{ color: "#64748b", fontSize: "12px" }}>👤 {c.clientName}</span>
                        {c.courtName && <span style={{ color: "#64748b", fontSize: "12px" }}>🏛 {c.courtName}</span>}
                        {c.nextHearingDate && <span style={{ color: "#64748b", fontSize: "12px" }}>📅 {formatDate(c.nextHearingDate)}</span>}
                      </div>
                    </div>

                    <span style={{ color: "#475569", fontSize: "18px", userSelect: "none", flexShrink: 0 }}>
                      {expanded ? "▲" : "▼"}
                    </span>
                  </div>

                  {/* Expanded Detail */}
                  {expanded && (
                    <div style={{ borderTop: "1px solid #1e293b", padding: "20px" }}>
                      {/* Progress pipeline */}
                      <div style={{ marginBottom: "20px" }}>
                        <p style={{ ...labelStyle, marginBottom: "8px" }}>Case Progress</p>
                        <ProgressPipeline status={c.status} />
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "16px" }}>
                        {/* Client Info */}
                        <div style={{ background: "#020817", borderRadius: "8px", padding: "14px" }}>
                          <p style={{ ...labelStyle, color: "#6366f1" }}>Client Information</p>
                          <p style={{ color: "#e2e8f0", fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>{c.clientName || "—"}</p>
                          <p style={{ color: "#64748b", fontSize: "13px" }}>vs. {c.opposingParty || "—"}</p>
                        </div>

                        {/* Court & Judge */}
                        <div style={{ background: "#020817", borderRadius: "8px", padding: "14px" }}>
                          <p style={{ ...labelStyle, color: "#10b981" }}>Court & Judge</p>
                          <p style={{ color: "#e2e8f0", fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>{c.courtName || "—"}</p>
                          <p style={{ color: "#64748b", fontSize: "13px" }}>Hon. {c.judgeName || "—"}</p>
                        </div>

                        {/* Hearing */}
                        <div style={{ background: "#020817", borderRadius: "8px", padding: "14px" }}>
                          <p style={{ ...labelStyle, color: "#f59e0b" }}>Next Hearing</p>
                          <p style={{ color: "#e2e8f0", fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>{formatDate(c.nextHearingDate)}</p>
                          {days !== null && (
                            <p style={{ color: days < 0 ? "#ef4444" : days <= 3 ? "#f59e0b" : "#64748b", fontSize: "13px" }}>
                              {days < 0 ? `${Math.abs(days)} days ago` : days === 0 ? "Today" : `In ${days} days`}
                            </p>
                          )}
                        </div>
                      </div>

                      {c.description && (
                        <div style={{ background: "#020817", borderRadius: "8px", padding: "14px", marginBottom: "16px" }}>
                          <p style={labelStyle}>Notes / Description</p>
                          <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>{c.description}</p>
                        </div>
                      )}

                      {/* Quick Status Change */}
                      <div style={{ marginBottom: "16px" }}>
                        <p style={labelStyle}>Quick Status Update</p>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {STATUSES.map((s) => (
                            <button
                              key={s.value}
                              onClick={() => handleStatusChange(c, s.value)}
                              style={{
                                background: c.status === s.value ? s.color + "33" : "#1e293b",
                                color: c.status === s.value ? s.color : "#64748b",
                                border: `1px solid ${c.status === s.value ? s.color : "#1e293b"}`,
                                borderRadius: "6px",
                                padding: "5px 14px",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          onClick={() => handleEdit(c)}
                          style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: "8px", padding: "8px 20px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                        >
                          ✏ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          style={{ background: "#ef444422", color: "#ef4444", border: "1px solid #ef444455", borderRadius: "8px", padding: "8px 20px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseManagementPage;