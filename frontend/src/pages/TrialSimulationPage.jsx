import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";

const API = "https://mpj-backend-java.onrender.com/api";

const CASE_TYPES = ["Criminal", "Civil", "Corporate", "Constitutional", "Family", "Tax"];
const PHASES     = ["Opening", "Examination", "Cross", "Closing"];

const CASE_TYPE_META = {
  Criminal:      { color: "#E05B5B", icon: "⚔", desc: "IPC · CrPC · Evidence Act" },
  Civil:         { color: "#5BA4E0", icon: "⚖", desc: "CPC · Specific Relief Act" },
  Corporate:     { color: "#C8A84B", icon: "🏛", desc: "Companies Act · SEBI · IBC" },
  Constitutional:{ color: "#50C878", icon: "📜", desc: "Constitution · Fundamental Rights" },
  Family:        { color: "#B07FE0", icon: "👨‍👩‍👧", desc: "HMA · Guardianship · Succession" },
  Tax:           { color: "#E09D4A", icon: "📊", desc: "Income Tax · GST · Customs" },
};

const QUICK_ARGS = {
  Criminal: [
    { label: "§302 Murder",  text: `My Lord, the State relies on the testimony of three independent eyewitnesses who placed the accused at the scene at 11:15 PM on the night of the incident. CCTV footage further establishes the presence of the accused. We submit this constitutes cogent proof under Section 302 IPC.` },
    { label: "Default Bail", text: `Your Honour, the chargesheet was not filed within the statutory 90-day period under Section 167(2) CrPC. The accused is entitled to default bail as a matter of right — continued detention violates Article 21.` },
    { label: "POCSO §6",     text: `Your Honour, the survivor is a minor aged 9 years. Medical examination within 24 hours confirms penetrative sexual assault. The statement under Section 164 CrPC is consistent and credible. We charge under Section 6 POCSO Act.` },
  ],
  Civil: [
    { label: "Specific Performance", text: `My Lord, the defendant entered into a registered sale agreement dated 12 March 2022 for a sum of Rs. 45 lakhs. The plaintiff has paid the entire consideration. Despite repeated demands, the defendant refuses to execute the sale deed. We seek specific performance under Section 10 of the Specific Relief Act, 1963.` },
    { label: "Injunction",           text: `Your Honour, the defendant is attempting to alienate the disputed property pendente lite. The plaintiff has a prima facie case, balance of convenience favours the plaintiff, and irreparable harm will result if the status quo is not maintained. We seek a temporary injunction under Order 39 Rule 1 CPC.` },
  ],
  Corporate: [
    { label: "§138 NI Act",  text: `My Lord, the accused drew a cheque of Rs. 15 lakhs returned unpaid as 'funds insufficient'. A proper legal notice was served within 15 days. The accused failed to make payment within the stipulated period. The ingredients of Section 138 NI Act are fully established.` },
    { label: "§420 Fraud",   text: `My Lord, the accused represented himself as a SEBI-registered investment advisor, which he is not. On this false representation, the complainant transferred Rs. 50 lakhs in four tranches. WhatsApp chats show explicit promises of guaranteed returns — a clear case under Section 420 IPC.` },
  ],
  Constitutional: [
    { label: "Art. 32 Writ", text: `This Hon'ble Court is approached under Article 32. The impugned amendment violates the basic structure doctrine settled in Kesavananda Bharati v. State of Kerala (1973). The amendment strips the judiciary of its essential function and must be struck down.` },
  ],
  Family: [
    { label: "Maintenance",  text: `Your Honour, the petitioner has been deserted by the respondent for over two years without any means of sustenance. She has two minor children to support. We submit that the respondent is liable to pay maintenance under Section 125 CrPC, and request interim maintenance pending the final order.` },
  ],
  Tax: [
    { label: "Reassessment", text: `My Lord, the impugned reassessment notice under Section 148 of the Income Tax Act was issued beyond the statutory period of limitation. No tangible material existed to form a reason to believe that income had escaped assessment. The notice is therefore without jurisdiction and liable to be quashed.` },
  ],
};

const confColor   = (s) => s >= 70 ? "#4AD98C" : s >= 50 ? "#C8A84B" : "#D94A4A";
const rulingColor = (r = "") => {
  const l = r.toLowerCase();
  if (l.includes("sustained"))  return "#4AD98C";
  if (l.includes("overruled"))  return "#D94A4A";
  if (l.includes("directs"))    return "#5BA4E0";
  if (l.includes("reserved"))   return "#B07FE0";
  return "#C8A84B";
};

// ─── Shared atoms ───────────────────────────────────────────────────────────────

const ConfBar = ({ score, label, color }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
    <span style={{ fontFamily: "monospace", fontSize: 10, color: "#6B7280", minWidth: 110 }}>{label}</span>
    <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${score}%`, background: color, borderRadius: 2, transition: "width 1s ease" }} />
    </div>
    <span style={{ fontFamily: "monospace", fontSize: 11, color, fontWeight: 500, minWidth: 32 }}>{score}%</span>
  </div>
);

const SidePanel = ({ title, badge, accent = "#C8A84B", children }) => (
  <div style={{ background: "#111827", border: "1px solid rgba(200,168,75,0.18)", borderRadius: 8, padding: 12, marginBottom: 10 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
      <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.1em", color: "#6B7280", textTransform: "uppercase" }}>{title}</div>
      {badge !== undefined && badge !== null && <span style={{ fontFamily: "monospace", fontSize: 10, color: accent }}>{badge}</span>}
    </div>
    {children}
  </div>
);

const StatRow = ({ label, value, color }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(200,168,75,0.06)", fontSize: 11 }}>
    <span style={{ color: "#6B7280" }}>{label}</span>
    <span style={{ fontFamily: "monospace", fontWeight: 500, color: color || "#DDD8CC" }}>{value}</span>
  </div>
);

const LoadingDots = ({ label = "Processing" }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ fontFamily: "monospace", fontSize: 10, color: "#C8A84B", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
      <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#C8A84B" }} />
      {label}
    </div>
    <div style={{ background: "rgba(200,168,75,0.05)", borderLeft: "2px solid #C8A84B", borderRadius: "2px 10px 10px 10px", padding: "10px 16px", display: "flex", gap: 5 }}>
      {[0, 0.18, 0.36].map((d, i) => (
        <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#C8A84B", animation: `pulse 1.1s ease-in-out ${d}s infinite` }} />
      ))}
    </div>
  </div>
);

// ─── Feature 1: AI Defense Attorney & Judge bubble ──────────────────────────────

const MessageBubble = ({ msg }) => {
  const configs = {
    user:     { speakerColor: "#5BA4E0", bg: "rgba(91,164,224,0.07)",  accent: "#5BA4E0",  align: "right"  },
    defense:  { speakerColor: "#E05B5B", bg: "rgba(224,91,91,0.07)",   accent: "#E05B5B",  align: "left"   },
    judge:    { speakerColor: "#50C878", bg: "rgba(80,200,120,0.07)",  accent: "#50C878",  align: "left"   },
    coaching: { speakerColor: "#C8A84B", bg: "rgba(200,168,75,0.07)",  accent: "#C8A84B",  align: "left"   },
    system:   { speakerColor: "#6B7280", bg: "rgba(200,168,75,0.04)",  accent: "transparent", align: "center" },
    error:    { speakerColor: "#E05B5B", bg: "rgba(224,91,91,0.05)",   accent: "#E05B5B",  align: "left"   },
  };
  const c       = configs[msg.type] || configs.system;
  const isRight  = c.align === "right";
  const isSystem = c.align === "center";

  return (
    <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", alignItems: isSystem ? "center" : isRight ? "flex-end" : "flex-start", animation: "fadeUp 0.25s ease" }}>
      {msg.speaker && (
        <div style={{ fontSize: 11, fontFamily: "monospace", color: c.speakerColor, marginBottom: 4, letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: c.speakerColor }} />
          {msg.speaker}
          {msg.ruling && (
            <span style={{ fontSize: 10, background: `${rulingColor(msg.ruling)}18`, color: rulingColor(msg.ruling), padding: "1px 7px", borderRadius: 10, marginLeft: 4, fontWeight: 600 }}>
              {msg.ruling}
            </span>
          )}
          {msg.type === "coaching" && (
            <span style={{ fontSize: 10, background: "rgba(200,168,75,0.18)", color: "#C8A84B", padding: "1px 7px", borderRadius: 10, marginLeft: 4 }}>COACHING</span>
          )}
        </div>
      )}
      <div style={{
        maxWidth: isSystem ? "80%" : "88%",
        background: c.bg,
        borderLeft:  !isSystem && !isRight ? `2px solid ${c.accent}` : "none",
        borderRight: isRight               ? `2px solid ${c.accent}` : "none",
        border:      isSystem              ? "1px dashed rgba(200,168,75,0.18)" : undefined,
        borderRadius: isRight ? "10px 2px 10px 10px" : isSystem ? 8 : "2px 10px 10px 10px",
        padding: "11px 15px", fontSize: 13.5, lineHeight: 1.75,
        color: "#DDD8CC", textAlign: isSystem ? "center" : "left", fontStyle: isSystem ? "italic" : "normal",
      }}>
        {msg.text}
        {msg.type === "defense" && msg.prosecutionConf !== undefined && (
          <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <ConfBar score={msg.prosecutionConf} label="Prosecution" color={confColor(msg.prosecutionConf)} />
            <ConfBar score={msg.defenseConf}     label="Defense"     color={confColor(msg.defenseConf)} />
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Feature 2: Real-time Objection Flash ───────────────────────────────────────

const ObjectionBanner = ({ ruling, visible }) => {
  if (!visible || !ruling) return null;
  const color = rulingColor(ruling);
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 10,
      background: `${color}14`, border: `1px solid ${color}44`,
      borderRadius: 8, padding: "8px 16px", marginBottom: 10,
      display: "flex", alignItems: "center", gap: 10,
      animation: "slideDown 0.3s ease",
    }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 10px ${color}` }} />
      <span style={{ fontFamily: "monospace", fontSize: 12, color, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>
        {ruling}
      </span>
    </div>
  );
};

// ─── Precedent Card ─────────────────────────────────────────────────────────────

const PrecedentCard = ({ p }) => {
  const [open, setOpen] = useState(false);
  const fc = p.favours === "Prosecution" ? "#5BA4E0" : p.favours === "Defense" ? "#E05B5B" : "#C8A84B";
  return (
    <div style={{ background: "#0D1221", border: "1px solid rgba(200,168,75,0.15)", borderRadius: 8, marginBottom: 8, overflow: "hidden" }}>
      <div onClick={() => setOpen(o => !o)} style={{ padding: "10px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "#DDD8CC", marginBottom: 3 }}>{p.case_name}</div>
          <div style={{ fontFamily: "monospace", fontSize: 10, color: "#6B7280" }}>{p.citation} · {p.court} · {p.year}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8, flexShrink: 0 }}>
          <span style={{ fontFamily: "monospace", fontSize: 9, padding: "2px 7px", borderRadius: 10, background: `${fc}18`, color: fc }}>{p.favours}</span>
          <span style={{ color: "#6B7280", fontSize: 12 }}>{open ? "▲" : "▼"}</span>
        </div>
      </div>
      {open && (
        <div style={{ padding: "0 14px 12px", borderTop: "1px solid rgba(200,168,75,0.08)" }}>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: "#6B7280", textTransform: "uppercase", marginBottom: 4 }}>Key Principle</div>
            <div style={{ fontSize: 12, color: "#B0AAA0", lineHeight: 1.65 }}>{p.key_principle}</div>
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: "#6B7280", textTransform: "uppercase", marginBottom: 4 }}>Relevance</div>
            <div style={{ fontSize: 12, color: "#B0AAA0", lineHeight: 1.65 }}>{p.relevance}</div>
          </div>
          {p.ratio_decidendi && (
            <div style={{ marginTop: 8, padding: "8px 12px", background: "rgba(200,168,75,0.05)", borderLeft: "2px solid #C8A84B", borderRadius: "0 4px 4px 0" }}>
              <div style={{ fontFamily: "monospace", fontSize: 9, color: "#C8A84B", marginBottom: 3 }}>RATIO</div>
              <div style={{ fontSize: 11, color: "#C8A84B", lineHeight: 1.6, fontStyle: "italic" }}>{p.ratio_decidendi}</div>
            </div>
          )}
          {p.judge_quote && <div style={{ marginTop: 8, fontSize: 11, color: "#8B8570", fontStyle: "italic", lineHeight: 1.6 }}>"{p.judge_quote}"</div>}
          {p.bench && <div style={{ marginTop: 6, fontFamily: "monospace", fontSize: 9, color: "#6B7280" }}>Bench: {p.bench}</div>}
        </div>
      )}
    </div>
  );
};

// ─── Feature 3: Performance Metrics Panel ───────────────────────────────────────

const MetricsPanel = ({ stats, confidenceHistory }) => {
  const avgConf    = stats.args > 0 ? Math.round(stats.totalConf / stats.args) : null;
  const trend      = confidenceHistory.length >= 2
    ? confidenceHistory[confidenceHistory.length - 1] - confidenceHistory[confidenceHistory.length - 2]
    : null;
  const grade      = avgConf === null ? "—" : avgConf >= 75 ? "A" : avgConf >= 60 ? "B" : avgConf >= 45 ? "C" : "D";
  const gradeColor = avgConf === null ? "#6B7280" : avgConf >= 75 ? "#4AD98C" : avgConf >= 60 ? "#C8A84B" : avgConf >= 45 ? "#E09D4A" : "#D94A4A";
  const totalObj   = stats.objectionsSustained + stats.objectionsOverruled;

  return (
    <SidePanel title="Performance Metrics" badge={grade} accent={gradeColor}>
      <StatRow label="Arguments Made"       value={stats.args} />
      <StatRow label="Avg. Confidence"      value={avgConf !== null ? `${avgConf}%` : "—"} color={avgConf !== null ? confColor(avgConf) : "#6B7280"} />
      <StatRow label="Trend"                value={trend === null ? "—" : trend > 0 ? `▲ +${trend}%` : trend < 0 ? `▼ ${trend}%` : "→ Stable"} color={trend === null ? "#6B7280" : trend > 0 ? "#4AD98C" : trend < 0 ? "#D94A4A" : "#C8A84B"} />
      <StatRow label="Precedents Cited"     value={stats.cited} />
      <StatRow label="Rulings — Sustained"  value={stats.objectionsSustained} color="#4AD98C" />
      <StatRow label="Rulings — Overruled"  value={stats.objectionsOverruled} color="#D94A4A" />
      <StatRow label="Grade"                value={grade} color={gradeColor} />
      {confidenceHistory.length > 1 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: "#6B7280", marginBottom: 5, textTransform: "uppercase" }}>Confidence Arc</div>
          <svg width="100%" height="28" viewBox={`0 0 ${Math.max(confidenceHistory.length * 12, 60)} 28`} preserveAspectRatio="none">
            <polyline points={confidenceHistory.map((v, i) => `${i * 12},${27 - (v / 100) * 26}`).join(" ")} fill="none" stroke="#C8A84B" strokeWidth="1.5" strokeLinejoin="round" />
            {confidenceHistory.map((v, i) => <circle key={i} cx={i * 12} cy={27 - (v / 100) * 26} r="2" fill="#C8A84B" />)}
          </svg>
        </div>
      )}
    </SidePanel>
  );
};

// ─── Feature 4a: Argument Analysis Panel ────────────────────────────────────────

const AnalysisPanel = ({ lastAnalysis }) => {
  if (!lastAnalysis) return (
    <SidePanel title="Argument Analysis">
      <p style={{ fontFamily: "monospace", fontSize: 10, color: "#4B5563", textAlign: "center", padding: "10px 0" }}>Submit an argument to see analysis</p>
    </SidePanel>
  );
  const { prosecutionConf, defenseConf, weaknesses, coaching, ipcSections, citations } = lastAnalysis;
  return (
    <SidePanel title="Argument Analysis">
      <ConfBar score={prosecutionConf} label="Prosecution" color={confColor(prosecutionConf)} />
      <ConfBar score={defenseConf}     label="Defense"     color={confColor(defenseConf)} />
      {coaching && (
        <div style={{ marginTop: 10, padding: "8px 10px", background: "rgba(200,168,75,0.07)", borderLeft: "2px solid #C8A84B", borderRadius: "0 6px 6px 0" }}>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: "#C8A84B", marginBottom: 4, textTransform: "uppercase" }}>💡 Improvement Tip</div>
          <div style={{ fontSize: 11, color: "#B0AAA0", lineHeight: 1.6 }}>{coaching}</div>
        </div>
      )}
      {weaknesses?.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: "#6B7280", textTransform: "uppercase", marginBottom: 6 }}>⚠ Weaknesses</div>
          {weaknesses.map((w, i) => <div key={i} style={{ fontSize: 11, color: "#E05B5B", padding: "4px 8px", background: "rgba(224,91,91,0.06)", borderRadius: 4, marginBottom: 4, lineHeight: 1.4 }}>· {w}</div>)}
        </div>
      )}
      {ipcSections?.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: "#6B7280", textTransform: "uppercase", marginBottom: 6 }}>📋 Active Sections</div>
          {ipcSections.map((s, i) => <div key={i} style={{ fontFamily: "monospace", fontSize: 9.5, color: "#5BA4E0", padding: "4px 8px", background: "rgba(91,164,224,0.06)", borderRadius: 4, marginBottom: 4 }}>{s}</div>)}
        </div>
      )}
      {citations?.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: "#6B7280", textTransform: "uppercase", marginBottom: 6 }}>📎 Cited Cases</div>
          {citations.map((c, i) => <div key={i} style={{ fontFamily: "monospace", fontSize: 9.5, color: "#8B8570", padding: "5px 8px", background: "rgba(200,168,75,0.04)", borderRadius: 4, borderLeft: "2px solid #C8A84B", lineHeight: 1.5, marginBottom: 5 }}>{c}</div>)}
        </div>
      )}
    </SidePanel>
  );
};

// ─── Feature 4b: Strategy Panel ─────────────────────────────────────────────────

const StrategyPanel = ({ caseType, phase, weaknesses }) => {
  const base = {
    Opening:     ["Establish narrative clearly", "State charges with precision", "Preview your key evidence", "Cite landmark precedent early"],
    Examination: ["Elicit facts methodically", "Avoid leading questions", "Build towards your theory of the case", "Lock witness into consistent testimony"],
    Cross:       ["Challenge credibility firmly", "Use prior inconsistent statements", "Never ask what you don't know the answer to", "End on a high point"],
    Closing:     ["Synthesise all evidence", "Address each charge element", "Rebut defense's strongest point", "Cite relevant HC/SC precedents"],
  };
  const extra = {
    Criminal:       ["Establish mens rea clearly", "Don't overlook Section 27 Evidence Act"],
    Civil:          ["Quantify relief precisely", "Address limitation period proactively"],
    Corporate:      ["Cite SEBI circulars where relevant", "Establish board resolution chain"],
    Constitutional: ["Cite Constitution Bench ratio", "Address proportionality test"],
    Family:         ["Focus on welfare of minor children", "Document financial disclosures"],
    Tax:            ["Cite CBDT circular/instruction", "Address arm's length standard"],
  };
  const meta = CASE_TYPE_META[caseType] || {};
  const tips = [...(base[phase] || []), ...(extra[caseType] || [])];

  return (
    <SidePanel title="Strategy Recommendations" accent="#50C878">
      <div style={{ fontFamily: "monospace", fontSize: 9, color: meta.color || "#6B7280", marginBottom: 10, textTransform: "uppercase" }}>
        {meta.icon} {phase} · {caseType} — {meta.desc}
      </div>
      {tips.map((t, i) => (
        <div key={i} style={{ display: "flex", gap: 6, marginBottom: 7, alignItems: "flex-start" }}>
          <span style={{ color: "#50C878", fontSize: 10, marginTop: 1, flexShrink: 0 }}>→</span>
          <span style={{ fontSize: 11, color: "#B0AAA0", lineHeight: 1.5 }}>{t}</span>
        </div>
      ))}
      {weaknesses?.length > 0 && (
        <div style={{ marginTop: 10, padding: "8px 10px", background: "rgba(224,91,91,0.05)", borderLeft: "2px solid #E05B5B", borderRadius: "0 6px 6px 0" }}>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: "#E05B5B", marginBottom: 4, textTransform: "uppercase" }}>Fix This First</div>
          <div style={{ fontSize: 11, color: "#B0AAA0", lineHeight: 1.5 }}>{weaknesses[0]}</div>
        </div>
      )}
    </SidePanel>
  );
};

const InlinePrecedents = ({ precedents, loading }) => (
  <SidePanel title="Precedent Suggestions" badge={loading ? "…" : precedents.length || null} accent="#5BA4E0">
    {loading && <div style={{ fontFamily: "monospace", fontSize: 10, color: "#C8A84B", textAlign: "center", padding: "8px 0" }}>Fetching case law…</div>}
    {!loading && precedents.length === 0 && <p style={{ fontFamily: "monospace", fontSize: 10, color: "#4B5563", textAlign: "center", padding: "10px 0" }}>Submit argument to get relevant precedents</p>}
    {!loading && precedents.map((p, i) => <PrecedentCard key={i} p={p} />)}
  </SidePanel>
);

// ─── Feature 5: Post-Trial Performance Analysis Modal ───────────────────────────

const PostTrialModal = ({ stats, confidenceHistory, allWeaknesses, allCitations, caseType, phase, onClose }) => {
  const avgConf    = stats.args > 0 ? Math.round(stats.totalConf / stats.args) : 0;
  const grade      = avgConf >= 75 ? "A" : avgConf >= 60 ? "B" : avgConf >= 45 ? "C" : "D";
  const gradeColor = avgConf >= 75 ? "#4AD98C" : avgConf >= 60 ? "#C8A84B" : avgConf >= 45 ? "#E09D4A" : "#D94A4A";
  const verdict    = avgConf >= 65 ? "Likely Conviction" : avgConf >= 45 ? "Contested — Needs Strengthening" : "Likely Acquittal";
  const verdictColor = avgConf >= 65 ? "#4AD98C" : avgConf >= 45 ? "#C8A84B" : "#D94A4A";
  const totalObj   = stats.objectionsSustained + stats.objectionsOverruled;
  const objRate    = totalObj > 0 ? Math.round((stats.objectionsSustained / totalObj) * 100) : 0;

  const improvement = [
    avgConf < 60     && "Strengthen your chain of evidence — avoid conclusory statements without proof",
    allWeaknesses.length > 2 && "Address procedural gaps proactively before the defense raises them",
    stats.cited < 2  && "Cite more SC/HC precedents — judges in Indian courts expect legal authority",
    objRate < 50 && totalObj > 0 && "Your rulings are being overruled — re-examine the legal basis before objecting",
    stats.args < 3   && "Submit more arguments per phase to build a robust case record",
  ].filter(Boolean);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#0D1221", border: "1px solid rgba(200,168,75,0.3)", borderRadius: 12, width: "min(780px, 95vw)", maxHeight: "92vh", overflowY: "auto", padding: "28px 32px", scrollbarWidth: "thin", scrollbarColor: "rgba(200,168,75,0.2) transparent" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>Post-Trial Performance Report</div>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, color: "#C8A84B", margin: 0 }}>Trial Summary — {caseType}</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "1px solid rgba(200,168,75,0.2)", borderRadius: 6, color: "#6B7280", cursor: "pointer", padding: "6px 12px", fontFamily: "monospace", fontSize: 11 }}>✕ Close</button>
        </div>

        {/* Grade / Verdict / Objection Rate */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
          <div style={{ background: "#111827", borderRadius: 8, padding: "18px", textAlign: "center", border: `1px solid ${gradeColor}33` }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: "#6B7280", textTransform: "uppercase", marginBottom: 8 }}>Overall Grade</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 48, color: gradeColor, fontWeight: 700, lineHeight: 1 }}>{grade}</div>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: "#6B7280", marginTop: 6 }}>Avg {avgConf}% confidence</div>
          </div>
          <div style={{ background: "#111827", borderRadius: 8, padding: "18px", textAlign: "center", border: `1px solid ${verdictColor}33` }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: "#6B7280", textTransform: "uppercase", marginBottom: 8 }}>Probable Verdict</div>
            <div style={{ fontSize: 13, color: verdictColor, fontWeight: 600, lineHeight: 1.4, marginTop: 12 }}>{verdict}</div>
          </div>
          <div style={{ background: "#111827", borderRadius: 8, padding: "18px", textAlign: "center" }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: "#6B7280", textTransform: "uppercase", marginBottom: 8 }}>Ruling Win Rate</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 36, color: objRate >= 60 ? "#4AD98C" : "#D94A4A", fontWeight: 700, lineHeight: 1 }}>{totalObj > 0 ? `${objRate}%` : "—"}</div>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: "#6B7280", marginTop: 6 }}>{stats.objectionsSustained}✓ / {stats.objectionsOverruled}✗</div>
          </div>
        </div>

        {/* Confidence arc chart */}
        {confidenceHistory.length > 1 && (
          <div style={{ background: "#111827", borderRadius: 8, padding: 16, marginBottom: 16, border: "1px solid rgba(200,168,75,0.12)" }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: "#6B7280", textTransform: "uppercase", marginBottom: 12 }}>Prosecution Confidence — Round by Round</div>
            <svg width="100%" height="56" viewBox={`0 0 ${Math.max(confidenceHistory.length * 44, 200)} 56`} preserveAspectRatio="none">
              <defs>
                <linearGradient id="arcGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C8A84B" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#C8A84B" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon points={["0,55", ...confidenceHistory.map((v, i) => `${i * 44},${54 - (v / 100) * 52}`), `${(confidenceHistory.length - 1) * 44},55`].join(" ")} fill="url(#arcGrad)" />
              <polyline points={confidenceHistory.map((v, i) => `${i * 44},${54 - (v / 100) * 52}`).join(" ")} fill="none" stroke="#C8A84B" strokeWidth="2" strokeLinejoin="round" />
              {confidenceHistory.map((v, i) => (
                <g key={i}>
                  <circle cx={i * 44} cy={54 - (v / 100) * 52} r="3" fill="#C8A84B" />
                  <text x={i * 44} y={54 - (v / 100) * 52 - 7} textAnchor="middle" fontSize="9" fill="#C8A84B" fontFamily="monospace">{v}%</text>
                </g>
              ))}
            </svg>
          </div>
        )}

        {/* Weaknesses + Citations */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div style={{ background: "#111827", borderRadius: 8, padding: 14, border: "1px solid rgba(224,91,91,0.15)" }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: "#E05B5B", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>⚠ Case Weaknesses</div>
            {allWeaknesses.length === 0
              ? <div style={{ fontFamily: "monospace", fontSize: 10, color: "#4B5563" }}>None identified — strong case</div>
              : [...new Set(allWeaknesses)].slice(0, 6).map((w, i) => <div key={i} style={{ fontSize: 11, color: "#E05B5B", padding: "4px 0", borderBottom: "1px solid rgba(224,91,91,0.07)", lineHeight: 1.5 }}>· {w}</div>)
            }
          </div>
          <div style={{ background: "#111827", borderRadius: 8, padding: 14, border: "1px solid rgba(200,168,75,0.12)" }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: "#C8A84B", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>📎 Citations Used ({allCitations.length})</div>
            {allCitations.length === 0
              ? <div style={{ fontFamily: "monospace", fontSize: 10, color: "#4B5563" }}>No cases cited — cite more precedents</div>
              : allCitations.slice(0, 6).map((c, i) => <div key={i} style={{ fontFamily: "monospace", fontSize: 9.5, color: "#8B8570", padding: "4px 0", borderBottom: "1px solid rgba(200,168,75,0.06)", lineHeight: 1.5 }}>{c}</div>)
            }
          </div>
        </div>

        {/* Argument improvement suggestions */}
        {improvement.length > 0 && (
          <div style={{ background: "#111827", borderRadius: 8, padding: 14, border: "1px solid rgba(80,200,120,0.15)", marginBottom: 16 }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: "#50C878", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>💡 Argument Improvement Suggestions</div>
            {improvement.map((tip, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 9, alignItems: "flex-start" }}>
                <span style={{ color: "#50C878", fontSize: 12, flexShrink: 0 }}>→</span>
                <span style={{ fontSize: 12, color: "#B0AAA0", lineHeight: 1.6 }}>{tip}</span>
              </div>
            ))}
          </div>
        )}

        {/* Stats grid */}
        <div style={{ background: "#111827", borderRadius: 8, padding: 14, border: "1px solid rgba(200,168,75,0.1)" }}>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: "#6B7280", textTransform: "uppercase", marginBottom: 10 }}>Session Statistics</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {[
              ["Arguments",  stats.args],
              ["Avg. Conf.", `${avgConf}%`],
              ["Cited",      stats.cited],
              ["Sustained",  stats.objectionsSustained],
              ["Overruled",  stats.objectionsOverruled],
              ["Phase",      phase],
            ].map(([l, v]) => (
              <div key={l} style={{ textAlign: "center", padding: "10px 6px", background: "#0D1221", borderRadius: 6 }}>
                <div style={{ fontFamily: "monospace", fontSize: 9, color: "#6B7280", marginBottom: 4 }}>{l}</div>
                <div style={{ fontFamily: "monospace", fontSize: 14, color: "#DDD8CC", fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Precedence Tab ─────────────────────────────────────────────────────────────

const PrecedenceTab = ({ caseType }) => {
  const [query,   setQuery]   = useState("");
  const [file,    setFile]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error,   setError]   = useState("");
  const fileRef = useRef(null);

  const search = async () => {
    if (!query.trim() && !file) return;
    setLoading(true); setError(""); setResults(null);
    try {
      let res;
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        res = await axios.post(`${API}/precedence/from-document`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        setResults(res.data.precedents || res.data);
      } else {
        res = await axios.post(`${API}/precedence/search`, { query, case_type: caseType, max_results: 6 });
        setResults(res.data);
      }
    } catch (e) {
      setError(e?.response?.data?.error || "Search failed. Please retry.");
    } finally { setLoading(false); }
  };

  const precs   = results?.precedents || [];
  const statutes = results?.applicable_statutes || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
      <div style={{ background: "#111827", border: "1px solid rgba(200,168,75,0.18)", borderRadius: 8, padding: 14 }}>
        <div style={{ fontFamily: "monospace", fontSize: 9, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Search Indian Precedents</div>
        <textarea value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && e.ctrlKey && search()} placeholder="Describe the legal issue — or upload a document below" rows={3}
          style={{ width: "100%", background: "#0A0E1A", border: "1px solid rgba(200,168,75,0.2)", borderRadius: 6, color: "#DDD8CC", fontSize: 13, padding: "9px 12px", resize: "none", outline: "none", fontFamily: "Georgia, serif", lineHeight: 1.6, boxSizing: "border-box" }} />
        <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.png,.jpg,.jpeg" style={{ display: "none" }} onChange={e => setFile(e.target.files[0])} />
          <button onClick={() => fileRef.current.click()} style={{ fontFamily: "monospace", fontSize: 10, padding: "6px 14px", borderRadius: 6, border: "1px solid rgba(200,168,75,0.25)", background: "transparent", color: file ? "#C8A84B" : "#6B7280", cursor: "pointer" }}>
            {file ? `📄 ${file.name.slice(0, 24)}…` : "📎 Upload Document"}
          </button>
          {file && <button onClick={() => { setFile(null); fileRef.current.value = ""; }} style={{ fontFamily: "monospace", fontSize: 9, color: "#E05B5B", background: "none", border: "none", cursor: "pointer" }}>✕ Clear</button>}
          <button onClick={search} disabled={loading || (!query.trim() && !file)} style={{ marginLeft: "auto", background: "#C8A84B", color: "#0A0E1A", border: "none", borderRadius: 6, padding: "7px 20px", fontFamily: "monospace", fontSize: 11, fontWeight: 500, cursor: "pointer", opacity: (loading || (!query.trim() && !file)) ? 0.4 : 1 }}>
            {loading ? "Searching…" : "Find Precedents"}
          </button>
        </div>
        {error && <div style={{ marginTop: 8, fontSize: 11, color: "#E05B5B", fontFamily: "monospace" }}>{error}</div>}
      </div>
      {loading && <div style={{ padding: "0 4px" }}><LoadingDots label="Searching Indian case law…" /></div>}
      {results && !loading && (
        <div style={{ overflowY: "auto", flex: 1, scrollbarWidth: "thin", scrollbarColor: "rgba(200,168,75,0.2) transparent" }}>
          {results.legal_landscape && (
            <div style={{ background: "#111827", border: "1px solid rgba(200,168,75,0.15)", borderRadius: 8, padding: 14, marginBottom: 12 }}>
              <div style={{ fontFamily: "monospace", fontSize: 9, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>⚖ Legal Landscape</div>
              <div style={{ fontSize: 12.5, color: "#B0AAA0", lineHeight: 1.75 }}>{results.legal_landscape}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
                {results.strongest_precedent_for_prosecution && (
                  <div style={{ padding: "7px 10px", background: "rgba(91,164,224,0.07)", borderRadius: 6, borderLeft: "2px solid #5BA4E0" }}>
                    <div style={{ fontFamily: "monospace", fontSize: 9, color: "#5BA4E0", marginBottom: 3 }}>STRONGEST FOR PROSECUTION</div>
                    <div style={{ fontSize: 11, color: "#B0AAA0" }}>{results.strongest_precedent_for_prosecution}</div>
                  </div>
                )}
                {results.strongest_precedent_for_defense && (
                  <div style={{ padding: "7px 10px", background: "rgba(224,91,91,0.07)", borderRadius: 6, borderLeft: "2px solid #E05B5B" }}>
                    <div style={{ fontFamily: "monospace", fontSize: 9, color: "#E05B5B", marginBottom: 3 }}>STRONGEST FOR DEFENSE</div>
                    <div style={{ fontSize: 11, color: "#B0AAA0" }}>{results.strongest_precedent_for_defense}</div>
                  </div>
                )}
              </div>
            </div>
          )}
          {results.document_analysis && (
            <div style={{ background: "#111827", border: "1px solid rgba(91,164,224,0.15)", borderRadius: 8, padding: 14, marginBottom: 12 }}>
              <div style={{ fontFamily: "monospace", fontSize: 9, color: "#5BA4E0", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>📄 Document Analysis</div>
              {results.document_analysis.summary && <div style={{ fontSize: 12, color: "#B0AAA0", lineHeight: 1.7, marginBottom: 8 }}>{results.document_analysis.summary}</div>}
              {results.document_analysis.charges?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {results.document_analysis.charges.map((c, i) => <span key={i} style={{ fontFamily: "monospace", fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "rgba(224,91,91,0.1)", color: "#E05B5B" }}>{c}</span>)}
                </div>
              )}
            </div>
          )}
          {precs.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: "monospace", fontSize: 9, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{precs.length} Precedent{precs.length !== 1 ? "s" : ""} Found</div>
              {precs.map((p, i) => <PrecedentCard key={i} p={p} />)}
            </div>
          )}
          {statutes.length > 0 && (
            <div>
              <div style={{ fontFamily: "monospace", fontSize: 9, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Applicable Statutes</div>
              {statutes.map((s, i) => (
                <div key={i} style={{ background: "#111827", border: "1px solid rgba(91,164,224,0.15)", borderRadius: 6, padding: "9px 12px", marginBottom: 6 }}>
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: "#5BA4E0", marginBottom: 3 }}>{s.section}</div>
                  <div style={{ fontSize: 11, color: "#8B8570", lineHeight: 1.6 }}>{s.text_summary}</div>
                  {s.relevance && <div style={{ fontSize: 11, color: "#B0AAA0", marginTop: 4, fontStyle: "italic" }}>{s.relevance}</div>}
                </div>
              ))}
            </div>
          )}
          {precs.length === 0 && !results.legal_landscape && (
            <div style={{ textAlign: "center", color: "#6B7280", fontFamily: "monospace", fontSize: 11, padding: "2rem 0" }}>No precedents found. Try a more specific query.</div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────────

const TrialSimulationPage = () => {
  const [activeTab,    setActiveTab]    = useState("trial");
  const [sideTab,      setSideTab]      = useState("analysis");
  const [input,        setInput]        = useState("");
  const [conversation, setConversation] = useState([
    { type: "system", text: "Court is now in session. All rise." },
    { type: "system", text: "You appear as the Prosecution. Present your opening argument — the AI Defense Attorney and Judge will respond as they would in a real Indian courtroom." },
  ]);
  const [loading,      setLoading]      = useState(false);
  const [phase,        setPhase]        = useState("Opening");
  const [caseType,     setCaseType]     = useState("Criminal");
  const [history,      setHistory]      = useState([]);

  const [stats,             setStats]             = useState({ args: 0, totalConf: 0, cited: 0, objectionsSustained: 0, objectionsOverruled: 0 });
  const [confidenceHistory, setConfidenceHistory] = useState([]);
  const [lastAnalysis,      setLastAnalysis]      = useState(null);
  const [inlinePrecedents,  setInlinePrecedents]  = useState([]);
  const [precLoading,       setPrecLoading]       = useState(false);
  const [allWeaknesses,     setAllWeaknesses]     = useState([]);
  const [allCitations,      setAllCitations]      = useState([]);
  const [objFlash,          setObjFlash]          = useState({ visible: false, ruling: "" });
  const [showPostTrial,     setShowPostTrial]     = useState(false);

  const judgeName       = "Justice R.K. Sharma";
  const defenseName     = "Adv. S. Mehta";
  const prosecutionName = "APP D. Singh";

  const messagesRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [conversation, loading]);

  const flashRuling = useCallback((ruling) => {
    if (!ruling) return;
    setObjFlash({ visible: true, ruling });
    setTimeout(() => setObjFlash({ visible: false, ruling: "" }), 3200);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const arg = input.trim();
    setInput("");
    setConversation(prev => [...prev, { type: "user", speaker: prosecutionName, text: arg }]);
    setLoading(true);
    const newHistory = [...history, { role: "user", content: arg }];

    try {
      const res = await axios.post(`${API}/simulation/argue`, {
        argument: arg, phase, case_type: caseType,
        history: newHistory.slice(-6),
        judge_name: judgeName, defense_name: defenseName, prosecution_name: prosecutionName,
      });
      const d = res.data;

      const msgs = [
        { type: "defense", speaker: defenseName, text: d.defense, prosecutionConf: d.prosecution_confidence, defenseConf: d.defense_confidence },
        { type: "judge",   speaker: judgeName,   text: d.judge,   ruling: d.judge_ruling },
      ];
      if (d.coaching_tip) msgs.push({ type: "coaching", speaker: "Coaching Note", text: d.coaching_tip });

      setConversation(prev => [...prev, ...msgs]);
      setHistory([...newHistory, { role: "assistant", content: d.defense }]);
      flashRuling(d.judge_ruling);

      setLastAnalysis({
        prosecutionConf: d.prosecution_confidence,
        defenseConf:     d.defense_confidence,
        weaknesses:      d.weaknesses || [],
        coaching:        d.coaching_tip || "",
        ipcSections:     d.ipc_sections || [],
        citations:       d.citations || [],
      });
      setAllWeaknesses(d.weaknesses || []);
      setAllCitations(prev => [...new Set([...prev, ...(d.citations || [])])].slice(0, 12));

      const rl = (d.judge_ruling || "").toLowerCase();
      setStats(prev => ({
        args:                prev.args + 1,
        totalConf:           prev.totalConf + (d.prosecution_confidence || 0),
        cited:               prev.cited + (d.citations?.length || 0),
        objectionsSustained: prev.objectionsSustained + (rl.includes("sustained") ? 1 : 0),
        objectionsOverruled: prev.objectionsOverruled + (rl.includes("overruled") ? 1 : 0),
      }));
      setConfidenceHistory(prev => [...prev, d.prosecution_confidence || 0]);

      setPrecLoading(true); setSideTab("precedents");
      try {
        const pr = await axios.post(`${API}/precedence/from-argument`, { argument: arg, case_type: caseType });
        setInlinePrecedents(pr.data?.precedents || []);
      } catch { /* precedents are a bonus */ } finally { setPrecLoading(false); }

    } catch (err) {
      setConversation(prev => [...prev, { type: "error", text: err?.response?.data?.error || "Simulation failed. Check connection and retry." }]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const meta      = CASE_TYPE_META[caseType] || {};
  const quickArgs = QUICK_ARGS[caseType] || QUICK_ARGS.Criminal;

  const s = {
    page:      { minHeight: "100vh", background: "#080C18", padding: "1.25rem", fontFamily: "Georgia, serif", color: "#DDD8CC" },
    inner:     { maxWidth: 1220, margin: "0 auto" },
    header:    { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid rgba(200,168,75,0.18)" },
    title:     { fontSize: 20, color: "#C8A84B", fontWeight: 400, letterSpacing: "0.02em" },
    sub:       { fontSize: 10, fontFamily: "monospace", color: "#6B7280", letterSpacing: "0.07em", textTransform: "uppercase", marginTop: 3 },
    controls:  { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
    select:    { background: "#111827", border: "1px solid rgba(200,168,75,0.22)", borderRadius: 6, color: "#DDD8CC", padding: "5px 10px", fontFamily: "monospace", fontSize: 11, cursor: "pointer" },
    pill:      (a) => ({ fontFamily: "monospace", fontSize: 9, padding: "4px 11px", borderRadius: 20, border: `1px solid ${a ? "#C8A84B" : "rgba(200,168,75,0.18)"}`, background: a ? "rgba(200,168,75,0.1)" : "transparent", color: a ? "#C8A84B" : "#6B7280", cursor: "pointer", letterSpacing: "0.05em", textTransform: "uppercase", transition: "all 0.2s" }),
    tab:       (a) => ({ fontFamily: "monospace", fontSize: 11, padding: "8px 20px", border: "none", background: a ? "#C8A84B" : "transparent", color: a ? "#080C18" : "#6B7280", cursor: "pointer", borderBottom: a ? "none" : "2px solid rgba(200,168,75,0.15)", fontWeight: a ? 600 : 400, transition: "all 0.2s", letterSpacing: "0.05em" }),
    sideTab:   (a) => ({ fontFamily: "monospace", fontSize: 9, padding: "5px 10px", border: `1px solid ${a ? "rgba(200,168,75,0.4)" : "rgba(200,168,75,0.12)"}`, borderRadius: 4, background: a ? "rgba(200,168,75,0.1)" : "transparent", color: a ? "#C8A84B" : "#6B7280", cursor: "pointer", letterSpacing: "0.05em", textTransform: "uppercase", transition: "all 0.2s" }),
    grid:      { display: "grid", gridTemplateColumns: "1fr 272px", gap: 14, height: "calc(100vh - 230px)", minHeight: 520 },
    chatPanel: { display: "flex", flexDirection: "column", gap: 10, overflow: "hidden" },
    messages:  { flex: 1, overflowY: "auto", padding: "4px 2px", scrollbarWidth: "thin", scrollbarColor: "rgba(200,168,75,0.15) transparent" },
    inputArea: { display: "flex", flexDirection: "column", gap: 7 },
    quickRow:  { display: "flex", flexWrap: "wrap", gap: 5 },
    quickBtn:  { fontFamily: "monospace", fontSize: 9, padding: "3px 9px", borderRadius: 20, border: "1px solid rgba(200,168,75,0.18)", background: "transparent", color: "#6B7280", cursor: "pointer", letterSpacing: "0.04em", transition: "all 0.15s" },
    inputRow:  { display: "flex", gap: 8 },
    textarea:  { flex: 1, background: "#0D1221", border: "1px solid rgba(200,168,75,0.22)", borderRadius: 8, color: "#DDD8CC", fontFamily: "Georgia, serif", fontSize: 13, padding: "10px 12px", resize: "none", outline: "none", lineHeight: 1.65 },
    sendBtn:   { background: "#C8A84B", color: "#080C18", border: "none", borderRadius: 8, padding: "0 18px", fontFamily: "monospace", fontSize: 11, fontWeight: 600, cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase", minWidth: 72, transition: "opacity 0.2s" },
    sidebar:   { display: "flex", flexDirection: "column", overflow: "hidden", gap: 8 },
    sideScroll:{ overflowY: "auto", flex: 1, scrollbarWidth: "thin", scrollbarColor: "rgba(200,168,75,0.15) transparent" },
    footer:    { fontFamily: "monospace", fontSize: 8.5, color: "rgba(139,133,112,0.3)", textAlign: "center", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 10 },
  };

  return (
    <div style={s.page}>
      <style>{`
        @keyframes fadeUp    { from { opacity:0; transform:translateY(5px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse     { 0%,100% { opacity:0.25; transform:scale(0.8) } 50% { opacity:1; transform:scale(1) } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }
        textarea:focus { border-color: #C8A84B !important; box-shadow: 0 0 0 2px rgba(200,168,75,0.1); }
        select:focus   { outline: none; border-color: #C8A84B; }
        ::-webkit-scrollbar { width: 3px }
        ::-webkit-scrollbar-thumb { background: rgba(200,168,75,0.18); border-radius: 2px }
      `}</style>

      {showPostTrial && (
        <PostTrialModal
          stats={stats} confidenceHistory={confidenceHistory}
          allWeaknesses={allWeaknesses} allCitations={allCitations}
          caseType={caseType} phase={phase}
          onClose={() => setShowPostTrial(false)}
        />
      )}

      <div style={s.inner}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <div style={s.title}>⚖ LexAequitas — Indian Trial Simulator</div>
            <div style={s.sub}>IPC · CrPC · Evidence Act · Constitution of India · Precedence Engine</div>
          </div>
          <div style={s.controls}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: meta.color || "#6B7280", boxShadow: `0 0 6px ${meta.color || "#6B7280"}` }} />
              <select style={s.select} value={caseType} onChange={e => { setCaseType(e.target.value); setInput(""); }}>
                {CASE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {PHASES.map(p => <button key={p} style={s.pill(phase === p)} onClick={() => setPhase(p)}>{p}</button>)}
            </div>
            {stats.args > 0 && (
              <button onClick={() => setShowPostTrial(true)} style={{ fontFamily: "monospace", fontSize: 10, padding: "6px 14px", borderRadius: 6, border: "1px solid rgba(200,168,75,0.35)", background: "rgba(200,168,75,0.08)", color: "#C8A84B", cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                📊 End Trial
              </button>
            )}
          </div>
        </div>

        {/* Top tab bar */}
        <div style={{ display: "flex", gap: 0, marginBottom: 14, borderBottom: "2px solid rgba(200,168,75,0.15)" }}>
          <button style={s.tab(activeTab === "trial")}      onClick={() => setActiveTab("trial")}>Trial Simulation</button>
          <button style={s.tab(activeTab === "precedence")} onClick={() => setActiveTab("precedence")}>Precedence Search</button>
        </div>

        {/* ── Trial Tab ── */}
        {activeTab === "trial" && (
          <div style={s.grid}>
            <div style={s.chatPanel}>
              {/* Case context bar */}
              <div style={{ fontFamily: "monospace", fontSize: 9, color: meta.color || "#6B7280", letterSpacing: "0.08em", textTransform: "uppercase", paddingBottom: 8, borderBottom: "1px solid rgba(200,168,75,0.08)", display: "flex", alignItems: "center", gap: 6 }}>
                <span>{meta.icon}</span> {caseType} Matter — {meta.desc} · Phase: {phase}
              </div>

              {/* Objection banner + messages */}
              <div ref={messagesRef} style={s.messages}>
                <ObjectionBanner ruling={objFlash.ruling} visible={objFlash.visible} />
                {conversation.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
                {loading && <LoadingDots label={`${judgeName.split(" ").pop()} is considering…`} />}
              </div>

              <div style={s.inputArea}>
                <div style={s.quickRow}>
                  {quickArgs.map(q => (
                    <button key={q.label} style={s.quickBtn} onClick={() => setInput(q.text)}
                      onMouseEnter={e => { e.target.style.borderColor="#C8A84B"; e.target.style.color="#C8A84B"; }}
                      onMouseLeave={e => { e.target.style.borderColor="rgba(200,168,75,0.18)"; e.target.style.color="#6B7280"; }}>
                      {q.label}
                    </button>
                  ))}
                </div>
                <div style={s.inputRow}>
                  <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && e.ctrlKey && handleSend()} rows={3}
                    placeholder={`Present your ${caseType.toLowerCase()} argument to ${judgeName}… (Ctrl+Enter)`}
                    style={s.textarea} />
                  <button onClick={handleSend} disabled={loading || !input.trim()} style={{ ...s.sendBtn, opacity: (loading || !input.trim()) ? 0.35 : 1 }}>
                    Submit
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div style={s.sidebar}>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {[["analysis","Analysis"],["strategy","Strategy"],["precedents","Precedents"]].map(([k,l]) => (
                  <button key={k} style={s.sideTab(sideTab===k)} onClick={() => setSideTab(k)}>{l}</button>
                ))}
              </div>
              <div style={s.sideScroll}>
                <MetricsPanel stats={stats} confidenceHistory={confidenceHistory} />
                {sideTab === "analysis"   && <AnalysisPanel lastAnalysis={lastAnalysis} />}
                {sideTab === "strategy"   && <StrategyPanel caseType={caseType} phase={phase} weaknesses={allWeaknesses} />}
                {sideTab === "precedents" && <InlinePrecedents precedents={inlinePrecedents} loading={precLoading} />}
              </div>
            </div>
          </div>
        )}

        {/* ── Precedence Tab ── */}
        {activeTab === "precedence" && (
          <div style={{ height: "calc(100vh - 230px)", minHeight: 520 }}>
            <PrecedenceTab caseType={caseType} />
          </div>
        )}

        <div style={s.footer}>For advocacy training only · Not legal advice · © LexAequitas</div>
      </div>
    </div>
  );
};

export default TrialSimulationPage;