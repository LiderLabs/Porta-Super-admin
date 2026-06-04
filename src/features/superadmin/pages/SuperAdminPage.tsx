
import React from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/api";
import { useUser, useClerk } from "@clerk/clerk-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Theme = "dark" | "light";
type Tab = "overview" | "accounts" | "plans" | "features" | "audit" | "settings";
type Plan = "free" | "pro" | "enterprise" | "custom";
type OrgStatus = "active" | "trial" | "blocked" | "suspended";

// ─── Theme tokens ─────────────────────────────────────────────────────────────
const T: Record<Theme, Record<string, string>> = {
  dark: {
    bg: "#080a0f", surface: "#0d1117", surfaceEl: "#161b22",
    border: "#21262d", text: "#e6edf3", textSub: "#8b949e",
    textMute: "#484f58", accent: "#45ba50", accentBg: "rgba(69,186,80,0.08)",
    accentDim: "rgba(69,186,80,0.3)", danger: "#f85149", dangerBg: "rgba(248,81,73,0.08)",
    warn: "#d29922", info: "#58a6ff", purple: "#bc8cff", purpleBg: "rgba(188,140,255,0.08)",
  },
  light: {
    bg: "#f6f8fa", surface: "#ffffff", surfaceEl: "#f0f2f5",
    border: "#d0d7de", text: "#1f2328", textSub: "#656d76",
    textMute: "#9ba3ac", accent: "#2da44e", accentBg: "rgba(45,164,78,0.08)",
    accentDim: "rgba(45,164,78,0.3)", danger: "#cf222e", dangerBg: "rgba(207,34,46,0.08)",
    warn: "#9a6700", info: "#0969da", purple: "#8250df", purpleBg: "rgba(130,80,223,0.08)",
  },
};

// ─── Feature definitions ──────────────────────────────────────────────────────
const FEATURES = [
  { key: "checkInEnabled",          label: "Check-in",        desc: "Visitor check-in flow" },
  { key: "badgesEnabled",           label: "Badges",          desc: "Visitor badge printing" },
  { key: "schedulingEnabled",       label: "Scheduling",      desc: "Meeting scheduling" },
  { key: "messagingEnabled",        label: "Messaging",       desc: "In-app messaging" },
  { key: "analyticsEnabled",        label: "Analytics",       desc: "Reports & analytics" },
  { key: "notificationsEnabled",    label: "Notifications",   desc: "Push & email alerts" },
  { key: "attendanceEnabled",       label: "Attendance",      desc: "Staff attendance tracking" },
  { key: "multiLocationEnabled",    label: "Multi-location",  desc: "Multiple office locations" },
  { key: "apiAccessEnabled",        label: "API access",      desc: "REST API keys" },
  { key: "ssoEnabled",              label: "SSO",             desc: "Single sign-on" },
  { key: "whitelabelEnabled",       label: "White-label",     desc: "Custom branding" },
  { key: "dedicatedSupportEnabled", label: "Ded. support",    desc: "Dedicated support rep" },
];

const DEFAULT_FEATURES_BY_PLAN: Record<string, Record<string, boolean>> = {
  free:       { checkInEnabled:true,  badgesEnabled:false, schedulingEnabled:false, messagingEnabled:false, analyticsEnabled:false, notificationsEnabled:false, attendanceEnabled:false, multiLocationEnabled:false, apiAccessEnabled:false, ssoEnabled:false, whitelabelEnabled:false, dedicatedSupportEnabled:false },
  pro:        { checkInEnabled:true,  badgesEnabled:true,  schedulingEnabled:true,  messagingEnabled:true,  analyticsEnabled:true,  notificationsEnabled:true,  attendanceEnabled:true,  multiLocationEnabled:false, apiAccessEnabled:true,  ssoEnabled:false, whitelabelEnabled:false, dedicatedSupportEnabled:false },
  enterprise: { checkInEnabled:true,  badgesEnabled:true,  schedulingEnabled:true,  messagingEnabled:true,  analyticsEnabled:true,  notificationsEnabled:true,  attendanceEnabled:true,  multiLocationEnabled:true,  apiAccessEnabled:true,  ssoEnabled:true,  whitelabelEnabled:true,  dedicatedSupportEnabled:true  },
  custom:     { checkInEnabled:true,  badgesEnabled:true,  schedulingEnabled:true,  messagingEnabled:true,  analyticsEnabled:true,  notificationsEnabled:true,  attendanceEnabled:true,  multiLocationEnabled:true,  apiAccessEnabled:true,  ssoEnabled:true,  whitelabelEnabled:true,  dedicatedSupportEnabled:true  },
};

const DEFAULT_PLANS = [
  { id:"free",       name:"Free",       desc:"For small teams getting started",        price:0,   annualPrice:0,   maxUsers:10,  maxLocations:1,  color:"#8b949e", features:DEFAULT_FEATURES_BY_PLAN.free },
  { id:"pro",        name:"Pro",        desc:"For growing organisations",              price:49,  annualPrice:39,  maxUsers:100, maxLocations:5,  color:"#45ba50", features:DEFAULT_FEATURES_BY_PLAN.pro },
  { id:"enterprise", name:"Enterprise", desc:"For large orgs with complex needs",      price:199, annualPrice:159, maxUsers:999, maxLocations:99, color:"#d29922", features:DEFAULT_FEATURES_BY_PLAN.enterprise },
  { id:"custom",     name:"Custom",     desc:"Tailored pricing and feature set",       price:0,   annualPrice:0,   maxUsers:999, maxLocations:99, color:"#bc8cff", features:DEFAULT_FEATURES_BY_PLAN.custom },
];

// ─── Icons (inline SVG) ───────────────────────────────────────────────────────
const Ico = (d: string, vb = "0 0 24 24") => () =>
  <svg width="15" height="15" viewBox={vb} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>;

const IcoGrid      = Ico("M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z");
const IcoUsers     = Ico("M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75");
const IcoDollar    = Ico("M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6");
const IcoSliders   = Ico("M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6");
const IcoLog       = Ico("M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8");
const IcoGear      = Ico("M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z");
const IcoSun       = Ico("M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42");
const IcoMoon      = Ico("M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z");
const IcoSearch    = Ico("M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35");
const IcoClose     = Ico("M18 6 6 18M6 6l12 12");
const IcoPlus      = Ico("M12 5v14M5 12h14");
const IcoEdit      = Ico("M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z");
const IcoTrash     = Ico("M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2");
const IcoCheck     = Ico("M20 6 9 17l-5-5");
const IcoLogout    = Ico("M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9");
const IcoChevR     = Ico("M9 18l6-6-6-6");
const IcoUpload    = Ico("M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12");
const IcoShield    = Ico("M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z");
const IcoId        = Ico("M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zM7 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM13 10h5M13 14h3");

// ─── useTheme ─────────────────────────────────────────────────────────────────
function useTheme() {
  const [theme, setTheme] = React.useState<Theme>(() => {
    try { return (localStorage.getItem("porta-sa-theme") as Theme) || "dark"; } catch { return "dark"; }
  });
  const toggle = () => setTheme(t => {
    const n = t === "dark" ? "light" : "dark";
    try { localStorage.setItem("porta-sa-theme", n); } catch {}
    return n;
  });
  return { theme, toggle, c: T[theme] };
}

// ─── Shared UI components ─────────────────────────────────────────────────────
function Toggle({ on, onChange, c }: { on: boolean; onChange: () => void; c: Record<string,string> }) {
  return (
    <button onClick={onChange} role="switch" aria-checked={on} style={{ width:36,height:20,borderRadius:10,border:"none",background:on?c.accent:c.border,position:"relative",cursor:"pointer",transition:"background .2s",flexShrink:0 }}>
      <span style={{ position:"absolute",top:2,left:on?18:2,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .18s",display:"block",boxShadow:"0 1px 3px rgba(0,0,0,.3)" }}/>
    </button>
  );
}

function StatCard({ label, value, sub, accent, c }: { label:string; value:string|number; sub:string; accent:string; c:Record<string,string> }) {
  return (
    <div style={{ background:c.surface,border:"1px solid "+c.border,borderRadius:14,padding:"22px 24px",borderTop:"3px solid "+accent,display:"flex",flexDirection:"column",gap:6 }}>
      <div style={{ fontSize:10,fontWeight:700,color:c.textMute,textTransform:"uppercase" as const,letterSpacing:"0.1em" }}>{label}</div>
      <div style={{ fontSize:32,fontWeight:800,color:c.text,lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:12,color:c.textSub }}>{sub}</div>
    </div>
  );
}

function Modal({ title, onClose, children, c, wide }: { title:string; onClose:()=>void; children:React.ReactNode; c:Record<string,string>; wide?:boolean }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:24,backdropFilter:"blur(4px)" }} onClick={onClose}>
      <div style={{ background:c.surface,borderRadius:16,width:"100%",maxWidth:wide?680:500,maxHeight:"85vh",overflow:"auto",boxShadow:"0 32px 80px rgba(0,0,0,.4)",border:"1px solid "+c.border }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 24px",borderBottom:"1px solid "+c.border,position:"sticky",top:0,background:c.surface,zIndex:1 }}>
          <div style={{ fontSize:16,fontWeight:700,color:c.text }}>{title}</div>
          <button onClick={onClose} style={{ background:"none",border:"none",color:c.textSub,cursor:"pointer",display:"flex",padding:4 }}><IcoClose/></button>
        </div>
        <div style={{ padding:"22px 24px" }}>{children}</div>
      </div>
    </div>
  );
}

function ModalFooter({ children }: { children: React.ReactNode }) {
  return <div style={{ display:"flex",justifyContent:"flex-end",gap:8,marginTop:22,paddingTop:18,borderTop:"1px solid rgba(128,128,128,0.15)" }}>{children}</div>;
}

function Field({ label, required, children, c }: { label:string; required?:boolean; children:React.ReactNode; c:Record<string,string> }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:"block",fontSize:12,fontWeight:600,color:c.textSub,marginBottom:6 }}>
        {label}{required && <span style={{ color:c.danger,marginLeft:3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function inp(c: Record<string,string>): React.CSSProperties {
  return { width:"100%",padding:"9px 12px",fontSize:13,color:c.text,background:c.surfaceEl,border:"1px solid "+c.border,borderRadius:8,outline:"none",boxSizing:"border-box" as const,fontFamily:"inherit" };
}

function PriBtn({ children, disabled, onClick, c, danger }: { children:React.ReactNode; disabled?:boolean; onClick:()=>void; c:Record<string,string>; danger?:boolean }) {
  return <button onClick={onClick} disabled={disabled} style={{ padding:"9px 20px",borderRadius:8,border:"none",fontSize:13,fontWeight:600,cursor:disabled?"not-allowed":"pointer",background:danger?c.danger:c.accent,color:"#fff",opacity:disabled?0.5:1,fontFamily:"inherit" }}>{children}</button>;
}

function SecBtn({ children, onClick, c }: { children:React.ReactNode; onClick:()=>void; c:Record<string,string> }) {
  return <button onClick={onClick} style={{ padding:"9px 16px",borderRadius:8,border:"1px solid "+c.border,background:"transparent",color:c.textSub,fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit" }}>{children}</button>;
}

function LogoUploader({ current, onUpload, c }: { current?:string; onUpload:(b64:string)=>void; c:Record<string,string> }) {
  const ref = React.useRef<HTMLInputElement>(null);
  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => onUpload(r.result as string); r.readAsDataURL(f);
  };
  return (
    <div onClick={()=>ref.current?.click()} style={{ width:"100%",height:100,border:"2px dashed "+c.border,borderRadius:10,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",background:c.surfaceEl,overflow:"hidden",position:"relative" }}>
      {current
        ? <><img src={current} alt="logo" style={{ maxHeight:80,maxWidth:"90%",objectFit:"contain" }}/><div style={{ position:"absolute",bottom:6,right:8,fontSize:10,color:c.textMute }}>click to change</div></>
        : <><span style={{ color:c.textMute }}><IcoUpload/></span><span style={{ fontSize:12,color:c.textSub }}>Upload logo (PNG / SVG)</span></>
      }
      <input ref={ref} type="file" accept="image/*" style={{ display:"none" }} onChange={handle}/>
    </div>
  );
}

function FeatureRow({ org, onSave, c }: { org:any; onSave:(f:any)=>Promise<void>; c:Record<string,string> }) {
  const [feats, setFeats] = React.useState({ ...org.features });
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const dirty = JSON.stringify(feats) !== JSON.stringify(org.features);
  const save = async () => {
    setSaving(true);
    try { await onSave(feats); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    finally { setSaving(false); }
  };
  return (
    <tr style={{ borderBottom:"1px solid "+c.border }}>
      <td style={{ padding:"12px 20px",minWidth:180 }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          {org.logoUrl
            ? <img src={org.logoUrl} alt="" style={{ width:28,height:28,borderRadius:6,objectFit:"contain",background:c.surfaceEl }}/>
            : <div style={{ width:28,height:28,borderRadius:7,background:c.accentBg,color:c.accent,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12 }}>{org.name?.[0]?.toUpperCase()}</div>
          }
          <div>
            <div style={{ fontSize:13,fontWeight:600,color:c.text }}>{org.name}</div>
            <div style={{ fontSize:10,color:c.textMute,fontFamily:"monospace" }}>/{org.slug}</div>
          </div>
        </div>
      </td>
      {FEATURES.map(f => (
        <td key={f.key} style={{ padding:"12px 10px",textAlign:"center" as const }}>
          <Toggle on={!!feats[f.key]} onChange={()=>setFeats((p:any)=>({...p,[f.key]:!p[f.key]}))} c={c}/>
        </td>
      ))}
      <td style={{ padding:"12px 14px" }}>
        <button onClick={save} disabled={!dirty||saving} style={{ padding:"5px 14px",borderRadius:7,border:"1px solid "+(saved?c.accentDim:dirty?c.accent:c.border),background:saved?c.accentBg:dirty?c.accent:"transparent",color:saved?c.accent:dirty?"#fff":c.textMute,fontSize:12,fontWeight:600,cursor:dirty?"pointer":"default",display:"flex",alignItems:"center",gap:5,fontFamily:"inherit" }}>
          {saved ? <><IcoCheck/>Saved</> : saving ? "Saving..." : "Save"}
        </button>
      </td>
    </tr>
  );
}

function BookingRuleRow({ label, desc, on, onChange, c }: { label:string; desc:string; on:boolean; onChange:()=>void; c:Record<string,string> }) {
  return (
    <div onClick={onChange} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderRadius:8,border:"1px solid "+(on?c.accentDim:c.border),background:on?c.accentBg:c.surfaceEl,cursor:"pointer",marginBottom:8,transition:"all .15s" }}>
      <div>
        <div style={{ fontSize:13,fontWeight:600,color:c.text }}>{label}</div>
        <div style={{ fontSize:11,color:c.textMute,marginTop:2 }}>{desc}</div>
      </div>
      <Toggle on={on} onChange={onChange} c={c}/>
    </div>
  );
}

// ─── Settings Panel ───────────────────────────────────────────────────────────
function SettingsPanel({ user, c }: { user: any; c: Record<string,string> }) {
  const ps           = useQuery(api.superadmin.getPlatformSettings);
  const saveSettings = useMutation(api.superadmin.savePlatformSettings);
  const clearAudit   = useMutation(api.superadmin.clearAuditLog);
  const resetFlags   = useMutation(api.superadmin.resetAllFeatureFlags);

  const [form, setForm]                   = React.useState<any>(null);
  const [saving, setSaving]               = React.useState(false);
  const [saved, setSaved]                 = React.useState(false);
  const [dangerModal, setDangerModal]     = React.useState<"clear_audit"|"reset_flags"|null>(null);
  const [dangerLoading, setDangerLoading] = React.useState(false);

  React.useEffect(() => {
    if (ps && !form) setForm({ ...ps });
  }, [ps]);

  const set = (key: string, val: any) => setForm((f: any) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    try {
      await saveSettings({
        trialDays:          form.trialDays,
        selfServeSignups:   form.selfServeSignups,
        defaultPlan:        form.defaultPlan,
        requireEmailVerify: form.requireEmailVerify,
        apiAccessTier:      form.apiAccessTier,
        ssoEnforcement:     form.ssoEnforcement,
        currency:           form.currency,
        annualDiscount:     form.annualDiscount,
        gracePeriodDays:    form.gracePeriodDays,
        maintenanceMode:    form.maintenanceMode ?? false,
        platformName:       form.platformName ?? "",
        supportEmail:       form.supportEmail ?? "",
        actorClerkId:       user?.id ?? "",
        actorName:          user?.fullName ?? "Superadmin",
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally { setSaving(false); }
  };

  const handleDanger = async () => {
    setDangerLoading(true);
    try {
      const actor = { actorClerkId: user?.id ?? "", actorName: user?.fullName ?? "Superadmin" };
      if (dangerModal === "clear_audit") await clearAudit(actor);
      if (dangerModal === "reset_flags") await resetFlags(actor);
      setDangerModal(null);
    } finally { setDangerLoading(false); }
  };

  const sinp = (w?: number): React.CSSProperties => ({
    padding: "9px 12px",
    background: c.surfaceEl,
    border: "1px solid " + c.border,
    borderRadius: 8,
    color: c.text,
    fontSize: 13,
    outline: "none",
    fontFamily: "inherit",
    width: w ? w + "px" : "170px",
    boxSizing: "border-box" as const,
  });

  const tog = (on: boolean, key: string) => (
    <button
      onClick={() => set(key, !on)}
      style={{ width:42,height:24,borderRadius:12,background:on?c.accent:c.border,border:"none",cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0 }}
    >
      <span style={{ position:"absolute",top:3,left:on?21:3,width:18,height:18,borderRadius:9,background:"#fff",transition:"left 0.2s",display:"block" }}/>
    </button>
  );

  const SettingRow = ({ label, desc, node, last }: { label:string; desc:string; node:React.ReactNode; last?:boolean }) => (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",borderBottom:last?"none":"1px solid "+c.border,gap:16 }}>
      <div>
        <div style={{ fontSize:14,fontWeight:600,color:c.text }}>{label}</div>
        <div style={{ fontSize:12,color:c.textSub,marginTop:2 }}>{desc}</div>
      </div>
      <div style={{ flexShrink:0 }}>{node}</div>
    </div>
  );

  const SectionLabel = ({ label }: { label:string }) => (
    <div style={{ fontSize:11,fontWeight:700,color:c.textMute,textTransform:"uppercase" as const,letterSpacing:"0.1em",marginBottom:10,marginTop:24 }}>{label}</div>
  );

  if (!form) return (
    <div style={{ padding:40,color:c.textSub,fontSize:14 }}>Loading settings…</div>
  );

  return (
    <div style={{ padding:"32px 36px",maxWidth:740 }}>
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:24,fontWeight:800,color:c.text,marginBottom:4 }}>Platform Settings</h1>
          <p style={{ fontSize:13,color:c.textSub }}>Global configuration for the Porta platform</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ padding:"9px 22px",background:saved?c.accentBg:c.accent,border:saved?"1px solid "+c.accentDim:"none",borderRadius:9,color:saved?c.accent:"#fff",fontSize:13,fontWeight:700,cursor:saving?"not-allowed":"pointer",opacity:saving?0.7:1,fontFamily:"inherit",display:"flex",alignItems:"center",gap:7,transition:"all .2s" }}
        >
          {saving ? "Saving…" : saved ? "✓ Saved" : "Save changes"}
        </button>
      </div>

      <SectionLabel label="Onboarding" />
      <div style={{ background:c.surface,border:"1px solid "+c.border,borderRadius:12,overflow:"hidden",marginBottom:4 }}>
        <SettingRow label="Platform name" desc="Name shown across the platform and in emails" node={<input value={form.platformName ?? ""} onChange={e => set("platformName", e.target.value)} style={sinp()} placeholder="Porta"/>}/>
        <SettingRow label="Support email" desc="Contact email shown to users needing help" node={<input value={form.supportEmail ?? ""} onChange={e => set("supportEmail", e.target.value)} style={sinp()} placeholder="support@porta.com"/>}/>
        <SettingRow label="Trial period" desc="Days new accounts get before needing a paid plan" node={<div style={{ display:"flex",alignItems:"center",gap:8 }}><input type="number" min={0} max={365} value={form.trialDays} onChange={e => set("trialDays", Number(e.target.value))} style={sinp(72)}/><span style={{ fontSize:12,color:c.textSub }}>days</span></div>}/>
        <SettingRow label="Self-serve signups" desc="Allow organisations to sign up without superadmin approval" node={tog(form.selfServeSignups, "selfServeSignups")}/>
        <SettingRow last label="Default plan" desc="Plan assigned to new organisations on signup" node={<select value={form.defaultPlan} onChange={e => set("defaultPlan", e.target.value)} style={sinp()}><option value="free">Free</option><option value="pro">Pro</option><option value="enterprise">Enterprise</option><option value="custom">Custom</option></select>}/>
      </div>

      <SectionLabel label="Security & Access" />
      <div style={{ background:c.surface,border:"1px solid "+c.border,borderRadius:12,overflow:"hidden",marginBottom:4 }}>
        <SettingRow label="Require email verification" desc="Users must verify their email before accessing the platform" node={tog(form.requireEmailVerify, "requireEmailVerify")}/>
        <SettingRow label="API key access" desc="Minimum plan required to generate REST API keys" node={<select value={form.apiAccessTier} onChange={e => set("apiAccessTier", e.target.value)} style={sinp()}><option value="free">All plans</option><option value="pro">Pro+</option><option value="enterprise">Enterprise only</option></select>}/>
        <SettingRow label="SSO enforcement" desc="How single sign-on is handled for Enterprise accounts" node={<select value={form.ssoEnforcement} onChange={e => set("ssoEnforcement", e.target.value)} style={sinp()}><option value="optional">Optional</option><option value="required">Required</option><option value="disabled">Disabled</option></select>}/>
        <SettingRow last label="Maintenance mode" desc="Lock the platform to read-only for all organisations" node={tog(form.maintenanceMode ?? false, "maintenanceMode")}/>
      </div>

      <SectionLabel label="Billing" />
      <div style={{ background:c.surface,border:"1px solid "+c.border,borderRadius:12,overflow:"hidden",marginBottom:28 }}>
        <SettingRow label="Default currency" desc="Currency used for all plan pricing and invoices" node={<select value={form.currency} onChange={e => set("currency", e.target.value)} style={sinp()}>{["USD","GBP","EUR","GHS","NGN","KES","ZAR"].map(cur => (<option key={cur} value={cur}>{cur}</option>))}</select>}/>
        <SettingRow label="Annual billing discount" desc="Percentage discount applied when organisations choose annual billing" node={<div style={{ display:"flex",alignItems:"center",gap:8 }}><input type="number" min={0} max={100} value={form.annualDiscount} onChange={e => set("annualDiscount", Number(e.target.value))} style={sinp(72)}/><span style={{ fontSize:12,color:c.textSub }}>%</span></div>}/>
        <SettingRow last label="Grace period" desc="Days before blocking an organisation after a failed payment" node={<div style={{ display:"flex",alignItems:"center",gap:8 }}><input type="number" min={0} max={90} value={form.gracePeriodDays} onChange={e => set("gracePeriodDays", Number(e.target.value))} style={sinp(72)}/><span style={{ fontSize:12,color:c.textSub }}>days</span></div>}/>
      </div>

      <div style={{ background:c.dangerBg,border:"1px solid rgba(248,81,73,0.2)",borderRadius:12,padding:"20px 22px" }}>
        <div style={{ fontSize:14,fontWeight:700,color:c.danger,marginBottom:4 }}>Danger zone</div>
        <div style={{ fontSize:13,color:c.textSub,marginBottom:16 }}>These actions are irreversible and affect the entire platform.</div>
        <div style={{ display:"flex",gap:10,flexWrap:"wrap" as const }}>
          <button onClick={() => setDangerModal("reset_flags")} style={{ padding:"8px 16px",background:"transparent",border:"1px solid "+c.danger,borderRadius:8,color:c.danger,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>Reset all feature flags</button>
          <button onClick={() => setDangerModal("clear_audit")} style={{ padding:"8px 16px",background:"transparent",border:"1px solid "+c.danger,borderRadius:8,color:c.danger,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>Clear audit log</button>
        </div>
      </div>

      {dangerModal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,backdropFilter:"blur(4px)" }}>
          <div style={{ background:c.surface,border:"1px solid "+c.border,borderRadius:14,padding:"28px 32px",width:420,fontFamily:"inherit",boxShadow:"0 32px 80px rgba(0,0,0,.4)" }}>
            <div style={{ fontSize:18,fontWeight:700,color:c.danger,marginBottom:10 }}>Are you sure?</div>
            <div style={{ fontSize:13,color:c.textSub,marginBottom:24,lineHeight:1.6 }}>
              {dangerModal === "clear_audit" && "This will permanently delete all audit log entries. This cannot be undone."}
              {dangerModal === "reset_flags" && "This will reset feature flags to their defaults for every organisation on the platform. This cannot be undone."}
            </div>
            <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
              <button onClick={() => setDangerModal(null)} style={{ padding:"9px 18px",background:"transparent",border:"1px solid "+c.border,borderRadius:8,color:c.textSub,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>Cancel</button>
              <button onClick={handleDanger} disabled={dangerLoading} style={{ padding:"9px 18px",background:c.danger,border:"none",borderRadius:8,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",opacity:dangerLoading?0.6:1 }}>{dangerLoading ? "Processing…" : "Yes, proceed"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function SuperAdminPage() {
  const { user } = useUser();
  const savedPlans   = useQuery(api.superadmin.listPlanDefinitions);
  const upsertPlan   = useMutation(api.superadmin.upsertPlanDefinition);
  const { signOut }  = useClerk();
  const { theme, toggle, c } = useTheme();

  const [tab, setTab]                     = React.useState<Tab>("overview");
  const [mobileOpen, setMobileOpen]       = React.useState(false);
  const [search, setSearch]               = React.useState("");
  const [planFilter, setPlanFilter]       = React.useState<"ALL"|Plan>("ALL");
  const [statusFilter, setStatusFilter]   = React.useState<"ALL"|OrgStatus>("ALL");
  const [createOpen, setCreateOpen]       = React.useState(false);
  const [editOrg, setEditOrg]             = React.useState<any>(null);
  const [blockModal, setBlockModal]       = React.useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState<any>(null);
  const [blockReason, setBlockReason]     = React.useState("");
  const [submitting, setSubmitting]       = React.useState(false);
  const [createdOrg, setCreatedOrg]       = React.useState<{name:string,slug:string}|null>(null);
  const [planDefs, setPlanDefs]           = React.useState(DEFAULT_PLANS);
  const [planEditIdx, setPlanEditIdx]     = React.useState<number|null>(null);
  const [planEditVal, setPlanEditVal]     = React.useState<any>(null);

  React.useEffect(() => {
    if (savedPlans && savedPlans.length > 0) {
      setPlanDefs(savedPlans.map((p: any) => ({
        id: p.planId, name: p.name, desc: p.desc ?? "", price: p.price,
        annualPrice: p.annualPrice, maxUsers: p.maxUsers, maxLocations: p.maxLocations,
        color: p.color ?? "#22c55e",
        features: p.features ?? DEFAULT_FEATURES_BY_PLAN[p.planId] ?? DEFAULT_FEATURES_BY_PLAN.free,
      })));
    }
  }, [savedPlans]);

  const emptyBookingRules = { idRequired: false, photoRequired: false, approvalRequired: true, walkInEnabled: true };
  const emptyForm = { name:"", slug:"", ownerEmail:"", ownerName:"", ownerPhone:"", plan:"free" as Plan, adminNotes:"", logoUrl:"", address:"", website:"", taxId:"", maxUsers:"", maxLocations:"", bookingRules: emptyBookingRules };
  const [form, setForm]         = React.useState(emptyForm);
  const [editForm, setEditForm] = React.useState<any>({});

  const orgs  = useQuery(api.superadmin.listOrgs);
  const stats  = useQuery(api.superadmin.platformStats);
  const audit  = useQuery(api.superadmin.listAuditLog, { limit:100 });

  const createOrg       = useMutation(api.superadmin.createOrg);
  const sendAdminInvite = useAction(api.superadmin.sendAdminInvite);
  const updateOrg       = useMutation(api.superadmin.updateOrg);
  const blockOrg        = useMutation(api.superadmin.blockOrg);
  const unblockOrg      = useMutation(api.superadmin.unblockOrg);
  const updatePlan      = useMutation(api.superadmin.updatePlan);
  const updateFeatures  = useMutation(api.superadmin.updateFeatures);
  const deleteOrg       = useMutation(api.superadmin.deleteOrg);

  const actor = { actorClerkId: user?.id ?? "", actorName: user?.fullName ?? "Superadmin" };

  const filtered = orgs?.filter((o: any) => {
    const q = search.toLowerCase();
    const ok = !q || o.name.toLowerCase().includes(q) || (o.ownerEmail??"").toLowerCase().includes(q) || (o.slug??"").toLowerCase().includes(q);
    return ok && (planFilter === "ALL" || o.plan === planFilter) && (statusFilter === "ALL" || o.status === statusFilter);
  });

  const handleCreate = async () => {
    if (!form.name||!form.slug||!form.ownerEmail) return;
    setSubmitting(true);
    try {
      const orgId = await createOrg({...form,...actor});
      await sendAdminInvite({ orgId, orgName:form.name, adminName:form.ownerName||form.ownerEmail, adminEmail:form.ownerEmail, ...actor });
      setCreateOpen(false);
      setForm(emptyForm);
    } finally { setSubmitting(false); }
  };

  const handleEdit = async () => {
    if (!editOrg) return;
    setSubmitting(true);
    try { await updateOrg({orgId:editOrg._id,...editForm,...actor}); setEditOrg(null); }
    finally { setSubmitting(false); }
  };

  const handleBlockToggle = async () => {
    if (!blockModal) return;
    setSubmitting(true);
    try {
      blockModal.status==="blocked"
        ? await unblockOrg({orgId:blockModal._id,...actor})
        : await blockOrg({orgId:blockModal._id,reason:blockReason||undefined,...actor});
      setBlockModal(null); setBlockReason("");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setSubmitting(true);
    try { await deleteOrg({orgId:deleteConfirm._id,...actor}); setDeleteConfirm(null); }
    finally { setSubmitting(false); }
  };

  const savePlanEdit = () => {
    const pd = planEditVal as any;
    const feats: Record<string,boolean> = {};
    FEATURES.forEach(f => { feats[f.key] = !!pd.features?.[f.key]; });
    if (planEditIdx !== null && planEditIdx < planDefs.length) {
      setPlanDefs(d => d.map((p,i) => i===planEditIdx ? {...pd,features:feats} : p));
    } else {
      setPlanDefs(d => [...d, {...pd,features:feats}]);
    }
    upsertPlan({ planId:(pd.id??pd.name??"plan").toLowerCase().replace(/\s+/g,"-"), name:pd.name??"", desc:pd.desc??"", price:Number(pd.price)||0, annualPrice:Number(pd.annualPrice)||0, maxUsers:Number(pd.maxUsers)||0, maxLocations:Number(pd.maxLocations)||0, color:pd.color??"#22c55e", features:feats, ...actor }).catch(console.error);
    setPlanEditIdx(null); setPlanEditVal(null);
  };

  const NAV: {id:Tab; label:string; Icon:()=>React.ReactElement; group:string}[] = [
    { id:"overview",  label:"Overview",        Icon:IcoGrid,    group:"Platform" },
    { id:"accounts",  label:"Accounts",         Icon:IcoUsers,   group:"Platform" },
    { id:"plans",     label:"Plans & Pricing",  Icon:IcoDollar,  group:"Platform" },
    { id:"features",  label:"Feature flags",    Icon:IcoSliders, group:"Platform" },
    { id:"audit",     label:"Audit log",         Icon:IcoLog,     group:"System" },
    { id:"settings",  label:"Settings",          Icon:IcoGear,    group:"System" },
  ];

  const th: React.CSSProperties = { padding:"11px 14px",textAlign:"left" as const,fontSize:10,fontWeight:700,color:c.textMute,textTransform:"uppercase" as const,letterSpacing:"0.08em",background:c.surfaceEl,whiteSpace:"nowrap" as const };
  const planColor: Record<string,string> = { free:c.textSub, pro:c.accent, enterprise:c.warn, custom:c.purple };
  const statusDot: Record<string,string>  = { active:c.accent, trial:c.info, blocked:c.danger, suspended:c.warn };
  const groups = ["Platform","System"];

  return (
    <div style={{ display:"flex",height:"100vh",fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif",background:c.bg,color:c.text }}>

      {/* ── SIDEBAR ── */}
      <aside className="sa-sidebar" style={{ width:232,flexShrink:0,background:c.surface,borderRight:"1px solid "+c.border,display:"flex",flexDirection:"column",height:"100vh",position:"sticky",top:0 }}>
        <div style={{ padding:"18px 16px 14px",borderBottom:"1px solid "+c.border }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <img src="/Porta.png" alt="Porta" style={{ height:28,width:"auto" }}/>
            <span style={{ fontSize:10,fontWeight:700,color:c.accent,background:c.accentBg,padding:"2px 8px",borderRadius:20,letterSpacing:".06em",textTransform:"uppercase" as const }}>Superadmin</span>
          </div>
        </div>

        <nav style={{ padding:"10px",flex:1,overflowY:"auto" }}>
          {groups.map(grp => (
            <div key={grp}>
              <div style={{ fontSize:9,fontWeight:700,color:c.textMute,textTransform:"uppercase" as const,letterSpacing:"0.1em",padding:"10px 10px 6px" }}>{grp}</div>
              {NAV.filter(n => n.group===grp).map(n => (
                <button key={n.id} onClick={()=>setTab(n.id)} style={{ display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 12px",borderRadius:8,border:"none",background:tab===n.id?c.accentBg:"transparent",color:tab===n.id?c.accent:c.textSub,fontSize:13,fontWeight:tab===n.id?600:400,cursor:"pointer",textAlign:"left" as const,transition:"all .15s",marginBottom:2,fontFamily:"inherit" }}>
                  <n.Icon/>
                  <span style={{ flex:1 }}>{n.label}</span>
                  {n.id==="accounts" && orgs && (
                    <span style={{ background:c.surfaceEl,color:c.textSub,borderRadius:20,fontSize:10,fontWeight:700,padding:"1px 7px" }}>{orgs.length}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div style={{ padding:"14px 16px",borderTop:"1px solid "+c.border }}>
          <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:10 }}>
            <div style={{ width:32,height:32,borderRadius:"50%",background:c.accentBg,color:c.accent,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,flexShrink:0 }}>{user?.firstName?.[0] ?? "S"}</div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:13,fontWeight:600,color:c.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{user?.fullName}</div>
              <div style={{ fontSize:11,color:c.textMute }}>Superadmin</div>
            </div>
          </div>
          <button onClick={()=>signOut()} style={{ display:"flex",alignItems:"center",gap:8,width:"100%",padding:"8px 10px",borderRadius:7,border:"1px solid "+c.border,background:"transparent",color:c.textSub,fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit" }}>
            <IcoLogout/>Sign out
          </button>
        </div>
      </aside>

      {/* ── MOBILE HEADER ── */}
      <div className="sa-mobile-header" style={{ display:"none",position:"fixed",top:0,left:0,right:0,height:56,background:c.surface,borderBottom:"1px solid "+c.border,alignItems:"center",justifyContent:"space-between",padding:"0 16px",zIndex:100 }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <button onClick={()=>setMobileOpen(true)} style={{ background:"none",border:"1px solid "+c.border,borderRadius:8,padding:"7px 8px",color:c.textSub,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            <img src="/Porta.png" alt="Porta" style={{ width:28,height:28,borderRadius:7,objectFit:"contain" }}/>
            <span style={{ fontWeight:800,fontSize:14,color:c.text }}>Porta <span style={{ fontSize:9,fontWeight:700,letterSpacing:"0.1em",color:c.accent,textTransform:"uppercase" as const }}>Superadmin</span></span>
          </div>
        </div>
        <button onClick={toggle} style={{ background:"none",border:"1px solid "+c.border,borderRadius:8,padding:"7px 8px",color:c.textSub,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
          {theme==="dark" ? <IcoSun/> : <IcoMoon/>}
        </button>
      </div>

      {/* ── MOBILE DRAWER ── */}
      {mobileOpen && (
        <div style={{ position:"fixed",inset:0,zIndex:200,display:"flex" }}>
          <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.55)" }} onClick={()=>setMobileOpen(false)}/>
          <div style={{ position:"relative",width:240,background:c.surface,borderRight:"1px solid "+c.border,display:"flex",flexDirection:"column",height:"100vh",overflowY:"auto",animation:"slideInSA .2s ease" }}>
            <style>{`@keyframes slideInSA{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>
            <div style={{ padding:"18px 16px 14px",borderBottom:"1px solid "+c.border,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
              <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                <img src="/Porta.png" alt="Porta" style={{ width:32,height:32,borderRadius:9,objectFit:"contain" }}/>
                <div>
                  <div style={{ fontWeight:800,fontSize:14,color:c.text }}>Porta</div>
                  <div style={{ fontSize:9,fontWeight:700,letterSpacing:"0.1em",color:c.accent,textTransform:"uppercase" as const }}>Superadmin</div>
                </div>
              </div>
              <button onClick={()=>setMobileOpen(false)} style={{ background:"none",border:"none",cursor:"pointer",color:c.textSub,fontSize:18,padding:"2px 6px" }}>✕</button>
            </div>
            <nav style={{ padding:10,flex:1 }}>
              {NAV.map(n=>(
                <button key={n.id} onClick={()=>{setTab(n.id);setMobileOpen(false);}} style={{ display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 12px",borderRadius:8,border:"none",background:tab===n.id?c.accentBg:"transparent",color:tab===n.id?c.accent:c.textSub,fontSize:13,fontWeight:tab===n.id?700:400,cursor:"pointer",textAlign:"left" as const,marginBottom:2,fontFamily:"inherit" }}>
                  <n.Icon/><span>{n.label}</span>
                </button>
              ))}
            </nav>
            <div style={{ padding:"12px 14px",borderTop:"1px solid "+c.border }}>
              <button onClick={()=>signOut()} style={{ display:"flex",alignItems:"center",gap:8,width:"100%",padding:"9px 12px",borderRadius:8,border:"1px solid "+c.border,background:"transparent",color:c.textSub,fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit" }}>
                <IcoLogout/>Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN ── */}
      <main style={{ flex:1,overflow:"auto",paddingTop:0,minWidth:0,background:c.bg,display:"flex",flexDirection:"column" }}>

        {/* ── TOP HEADER ── */}
        {/* ── TOP HEADER ── */}
        <header style={{ display:"flex",alignItems:"center",justifyContent:"flex-end",padding:"0 28px",borderBottom:"1px solid "+c.border,background:c.surface,height:56,flexShrink:0,gap:10 }}>
          <span style={{ fontSize:13,fontWeight:600,color:c.text }}>{user?.fullName ?? "Superadmin"}</span>
          <div style={{ width:1,height:22,background:c.border }}/>
          <button onClick={toggle} style={{ background:"none",border:"1px solid "+c.border,borderRadius:8,padding:7,color:c.textSub,cursor:"pointer",display:"flex",alignItems:"center" }}>
            {theme==="dark" ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
          </button>
          <div style={{ width:32,height:32,borderRadius:"50%",background:c.accentBg,color:c.accent,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13 }}>{user?.firstName?.[0]?.toUpperCase() ?? "S"}</div>
        </header>
        {tab==="overview" && (
          <div style={{ padding:"32px 36px" }}>
            <h1 style={{ fontSize:24,fontWeight:800,marginBottom:4,color:c.text }}>Platform overview</h1>
            <p style={{ fontSize:13,color:c.textSub,marginBottom:28 }}>Live metrics across all Porta organisations</p>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:14 }}>
              <StatCard label="Total orgs"     value={stats?.totalOrgs??    "--"} sub="all time"           accent="#6366f1" c={c}/>
              <StatCard label="Active"          value={stats?.activeOrgs??   "--"} sub="currently live"     accent={c.accent} c={c}/>
              <StatCard label="Trial accounts"  value={stats?.trialOrgs??    "--"} sub="14-day window"      accent={c.info}   c={c}/>
              <StatCard label="Blocked"         value={stats?.blockedOrgs??  "--"} sub="access suspended"   accent={c.danger} c={c}/>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:28 }}>
              <StatCard label="Pro accounts"   value={stats?.proOrgs??        "--"} sub="paid plan"          accent={c.accent}  c={c}/>
              <StatCard label="Enterprise"     value={stats?.enterpriseOrgs?? "--"} sub="enterprise plan"    accent={c.warn}    c={c}/>
              <StatCard label="Total visitors" value={stats?.totalVisitors??  "--"} sub="all-time check-ins" accent={c.purple}  c={c}/>
              <StatCard label="Visitors (7d)"  value={stats?.weekVisitors??   "--"} sub="this week"          accent="#fb7185"   c={c}/>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"280px 1fr",gap:18,marginBottom:20 }}>
              <div style={{ background:c.surface,border:"1px solid "+c.border,borderRadius:14,padding:"22px 24px" }}>
                <div style={{ fontSize:13,fontWeight:700,marginBottom:20,color:c.text }}>Accounts by plan</div>
                {stats && [
                  { label:"Free",       count:stats.byPlan?.free??0,        color:c.textSub },
                  { label:"Pro",        count:stats.byPlan?.pro??0,         color:c.accent },
                  { label:"Enterprise", count:stats.byPlan?.enterprise??0,  color:c.warn },
                  { label:"Custom",     count:stats.byPlan?.custom??0,      color:c.purple },
                ].map(({ label, count, color }) => {
                  const pct = (stats.totalOrgs||0)===0 ? 0 : Math.round((count/stats.totalOrgs)*100);
                  return (
                    <div key={label} style={{ marginBottom:16 }}>
                      <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:6 }}>
                        <span style={{ fontWeight:600,color }}>{label}</span>
                        <span style={{ color:c.textMute }}>{count} &middot; {pct}%</span>
                      </div>
                      <div style={{ height:6,background:c.border,borderRadius:3,overflow:"hidden" }}>
                        <div style={{ width:pct+"%",height:"100%",background:color,borderRadius:3 }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ background:c.surface,border:"1px solid "+c.border,borderRadius:14,padding:"22px 24px" }}>
                <div style={{ fontSize:13,fontWeight:700,marginBottom:4,color:c.text }}>Visitor check-ins &mdash; last 14 days</div>
                <div style={{ fontSize:12,color:c.textSub,marginBottom:18 }}>Across all organisations</div>
                {stats && (
                  <div style={{ display:"flex",alignItems:"flex-end",gap:5,height:130 }}>
                    {(stats.dailyVisitors||[]).map((d:any,i:number) => {
                      const max = Math.max(...(stats.dailyVisitors||[]).map((x:any)=>x.count),1);
                      const h = Math.max((d.count/max)*100, d.count>0?6:2);
                      return (
                        <div key={i} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",height:"100%",gap:4 }}>
                          <div title={d.count+" visitors"} style={{ width:"100%",height:h+"%",background:c.accent,borderRadius:"3px 3px 0 0",opacity:0.8 }}/>
                          {i%2===0 && <span style={{ fontSize:9,color:c.textMute,whiteSpace:"nowrap" }}>{d.label}</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            {audit && audit.length>0 && (
              <div style={{ background:c.surface,border:"1px solid "+c.border,borderRadius:14,overflow:"hidden" }}>
                <div style={{ padding:"15px 22px",borderBottom:"1px solid "+c.border,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <div style={{ fontSize:13,fontWeight:700,color:c.text }}>Recent activity</div>
                  <button onClick={()=>setTab("audit")} style={{ fontSize:12,color:c.accent,background:"none",border:"none",cursor:"pointer",fontWeight:600,display:"flex",alignItems:"center",gap:4,fontFamily:"inherit" }}>View all <IcoChevR/></button>
                </div>
                {audit.slice(0,6).map((a:any) => (
                  <div key={a._id} style={{ display:"flex",alignItems:"center",gap:14,padding:"11px 22px",borderBottom:"1px solid "+c.surfaceEl }}>
                    <span style={{ background:c.accentBg,color:c.accent,fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:6,fontFamily:"monospace",flexShrink:0 }}>{a.action}</span>
                    <span style={{ fontSize:13,color:c.text,flex:1 }}>{a.targetLabel||a.targetId||"—"}</span>
                    <span style={{ fontSize:12,color:c.textSub,flexShrink:0 }}>{a.actorName}</span>
                    <span style={{ fontSize:11,color:c.textMute,flexShrink:0,fontFamily:"monospace" }}>{new Date(a.createdAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ACCOUNTS */}
        {tab==="accounts" && (
          <div style={{ padding:"32px 36px" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24 }}>
              <div>
                <h1 style={{ fontSize:24,fontWeight:800,marginBottom:4,color:c.text }}>Accounts</h1>
                <p style={{ fontSize:13,color:c.textSub }}>{orgs?.length??0} organisations on Porta</p>
              </div>
              <button onClick={()=>setCreateOpen(true)} style={{ display:"flex",alignItems:"center",gap:7,padding:"9px 18px",background:c.accent,color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
                <IcoPlus/>New account
              </button>
            </div>
            <div style={{ display:"flex",gap:10,flexWrap:"wrap" as const,marginBottom:20 }}>
              <div style={{ display:"flex",alignItems:"center",gap:8,background:c.surface,border:"1px solid "+c.border,borderRadius:8,padding:"8px 12px",width:280 }}>
                <span style={{ color:c.textMute }}><IcoSearch/></span>
                <input placeholder="Search name, email, slug..." value={search} onChange={e=>setSearch(e.target.value)} style={{ border:"none",outline:"none",background:"none",fontSize:13,color:c.text,width:"100%",fontFamily:"inherit" }}/>
                {search && <button onClick={()=>setSearch("")} style={{ background:"none",border:"none",color:c.textMute,cursor:"pointer",display:"flex" }}><IcoClose/></button>}
              </div>
              <div style={{ display:"flex",gap:4,flexWrap:"wrap" as const }}>
                {(["ALL","free","pro","enterprise","custom"] as const).map(pp => (
                  <button key={pp} onClick={()=>setPlanFilter(pp)} style={{ padding:"7px 14px",borderRadius:20,border:"1px solid "+(planFilter===pp?c.accent:c.border),background:planFilter===pp?c.accentBg:"transparent",color:planFilter===pp?c.accent:c.textSub,fontSize:12,fontWeight:500,cursor:"pointer",textTransform:"capitalize" as const,fontFamily:"inherit" }}>
                    {pp==="ALL"?"All plans":pp}
                  </button>
                ))}
              </div>
              <div style={{ display:"flex",gap:4,flexWrap:"wrap" as const }}>
                {(["ALL","active","trial","blocked","suspended"] as const).map(ss => (
                  <button key={ss} onClick={()=>setStatusFilter(ss)} style={{ padding:"7px 14px",borderRadius:20,border:"1px solid "+(statusFilter===ss?c.purple:c.border),background:statusFilter===ss?c.purpleBg:"transparent",color:statusFilter===ss?c.purple:c.textSub,fontSize:12,fontWeight:500,cursor:"pointer",textTransform:"capitalize" as const,fontFamily:"inherit" }}>
                    {ss==="ALL"?"All status":ss}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ background:c.surface,border:"1px solid "+c.border,borderRadius:14,overflow:"hidden" }}>
              <table style={{ width:"100%",borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ borderBottom:"1px solid "+c.border }}>
                    {["Organisation","Plan","Status","Owner","User Limit","ID Required","Created","Actions"].map(h=>(
                      <th key={h} style={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orgs===undefined
                    ? <tr><td colSpan={8} style={{ padding:40,textAlign:"center",color:c.textMute }}>Loading...</td></tr>
                    : filtered?.length===0
                    ? <tr><td colSpan={8} style={{ padding:40,textAlign:"center",color:c.textMute }}>No accounts match your filters.</td></tr>
                    : filtered?.map((o:any) => (
                      <tr key={o._id} style={{ borderBottom:"1px solid "+c.border }}>
                        <td style={{ padding:"13px 14px" }}>
                          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                            {o.logoUrl
                              ? <img src={o.logoUrl} alt="" style={{ width:34,height:34,borderRadius:8,objectFit:"contain",background:c.surfaceEl,border:"1px solid "+c.border }}/>
                              : <div style={{ width:34,height:34,borderRadius:9,background:c.accentBg,color:c.accent,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,flexShrink:0 }}>{o.name?.[0]?.toUpperCase()}</div>
                            }
                            <div>
                              <div style={{ fontSize:13,fontWeight:600,color:c.text }}>{o.name}</div>
                              <div style={{ fontSize:10,color:c.textMute,fontFamily:"monospace" }}>/{o.slug}</div>
                              {o.website && <div style={{ fontSize:10,color:c.info }}>{o.website}</div>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:"13px 14px" }}>
                          <select value={o.plan} onChange={e=>updatePlan({orgId:o._id,plan:e.target.value as Plan,...actor})} style={{ padding:"4px 10px",borderRadius:20,border:"1px solid "+c.border,background:c.surfaceEl,color:planColor[o.plan]||c.textSub,fontSize:12,fontWeight:700,cursor:"pointer",outline:"none",fontFamily:"inherit" }}>
                            {planDefs.map(pp=><option key={pp.id} value={pp.id}>{pp.name}</option>)}
                          </select>
                        </td>
                        <td style={{ padding:"13px 14px" }}>
                          <span style={{ display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:20,background:c.surfaceEl,color:statusDot[o.status]||c.textSub,fontSize:11,fontWeight:700,textTransform:"capitalize" as const }}>
                            <span style={{ width:6,height:6,borderRadius:"50%",background:statusDot[o.status]||c.textMute }}/>
                            {o.status||"active"}
                          </span>
                        </td>
                        <td style={{ padding:"13px 14px" }}>
                          <div style={{ fontSize:13,fontWeight:500,color:c.text }}>{o.ownerName||"—"}</div>
                          <div style={{ fontSize:11,color:c.textMute }}>{o.ownerEmail}</div>
                          {o.ownerPhone && <div style={{ fontSize:11,color:c.textMute }}>{o.ownerPhone}</div>}
                        </td>
                        <td style={{ padding:"13px 14px",fontSize:13,color:c.textSub }}>{o.maxUsers||"—"}</td>
                        <td style={{ padding:"13px 14px",textAlign:"center" as const }}>
                          <span style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"3px 9px",borderRadius:20,fontSize:11,fontWeight:600,background:o.bookingRules?.idRequired?c.accentBg:c.surfaceEl,color:o.bookingRules?.idRequired?c.accent:c.textMute,border:"1px solid "+(o.bookingRules?.idRequired?c.accentDim:c.border) }}>
                            <IcoId/>{o.bookingRules?.idRequired?"Yes":"No"}
                          </span>
                        </td>
                        <td style={{ padding:"13px 14px",fontSize:11,color:c.textMute,fontFamily:"monospace" }}>
                          {new Date(o.createdAt).toLocaleDateString([],{month:"short",day:"numeric",year:"numeric"})}
                        </td>
                        <td style={{ padding:"13px 14px" }}>
                          <div style={{ display:"flex",gap:5 }}>
                            <button onClick={()=>{setEditOrg(o);setEditForm({name:o.name,slug:o.slug,ownerEmail:o.ownerEmail,ownerName:o.ownerName||"",ownerPhone:o.ownerPhone||"",adminNotes:o.adminNotes||"",logoUrl:o.logoUrl||"",address:o.address||"",website:o.website||"",taxId:o.taxId||"",maxUsers:o.maxUsers||"",maxLocations:o.maxLocations||"",bookingRules:{idRequired:o.bookingRules?.idRequired??false,photoRequired:o.bookingRules?.photoRequired??false,approvalRequired:o.bookingRules?.approvalRequired??true,walkInEnabled:o.bookingRules?.walkInEnabled??true}});}} style={{ padding:"5px 10px",borderRadius:6,border:"1px solid "+c.border,background:"transparent",color:c.textSub,fontSize:12,fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:"inherit" }}>
                              <IcoEdit/>Edit
                            </button>
                            <button onClick={()=>setBlockModal(o)} style={{ padding:"5px 10px",borderRadius:6,border:"1px solid "+(o.status==="blocked"?c.accentDim:c.border),background:o.status==="blocked"?c.accentBg:"transparent",color:o.status==="blocked"?c.accent:c.danger,fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit" }}>
                              {o.status==="blocked"?"Unblock":"Block"}
                            </button>
                            <button onClick={()=>setDeleteConfirm(o)} style={{ padding:"5px 8px",borderRadius:6,border:"1px solid "+c.border,background:"transparent",color:c.textMute,cursor:"pointer",display:"flex",alignItems:"center" }}>
                              <IcoTrash/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PLANS & PRICING */}
        {tab==="plans" && (
          <div style={{ padding:"32px 36px" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24 }}>
              <div>
                <h1 style={{ fontSize:24,fontWeight:800,marginBottom:4,color:c.text }}>Plans & Pricing</h1>
                <p style={{ fontSize:13,color:c.textSub }}>Define tiers, pricing, limits and which features each plan unlocks</p>
              </div>
              <button onClick={()=>{setPlanEditIdx(planDefs.length);setPlanEditVal({id:"plan-"+Date.now(),name:"",price:0,annualPrice:0,maxUsers:10,maxLocations:1,color:c.accent,desc:"",features:{...DEFAULT_FEATURES_BY_PLAN.free}});}} style={{ display:"flex",alignItems:"center",gap:7,padding:"9px 18px",background:c.accent,color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
                <IcoPlus/>New plan
              </button>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:16,marginBottom:32 }}>
              {planDefs.map((plan,idx) => (
                <div key={plan.id} style={{ background:c.surface,border:"1px solid "+c.border,borderRadius:14,overflow:"hidden" }}>
                  <div style={{ height:4,background:plan.color }}/>
                  <div style={{ padding:"20px 22px" }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10 }}>
                      <div style={{ fontSize:18,fontWeight:800,color:plan.color }}>{plan.name}</div>
                      <button onClick={()=>{setPlanEditIdx(idx);setPlanEditVal({...plan,features:{...plan.features}});}} style={{ background:c.surfaceEl,border:"1px solid "+c.border,borderRadius:6,padding:"4px 8px",color:c.textSub,cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontSize:12,fontFamily:"inherit" }}>
                        <IcoEdit/>Edit
                      </button>
                    </div>
                    <div style={{ fontSize:12,color:c.textSub,marginBottom:14 }}>{plan.desc}</div>
                    <div style={{ display:"flex",gap:16,marginBottom:14 }}>
                      <div>
                        <div style={{ fontSize:9,color:c.textMute,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:"0.08em" }}>Monthly</div>
                        <div style={{ fontSize:22,fontWeight:800,color:c.text }}>{plan.price===0?"Free":"$"+plan.price}</div>
                      </div>
                      {plan.annualPrice>0 && (
                        <div>
                          <div style={{ fontSize:9,color:c.textMute,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:"0.08em" }}>Annual</div>
                          <div style={{ fontSize:22,fontWeight:800,color:c.accent }}>{"$"+plan.annualPrice}<span style={{ fontSize:11,fontWeight:400,color:c.textMute }}>/mo</span></div>
                        </div>
                      )}
                    </div>
                    <div style={{ display:"flex",gap:8,marginBottom:14 }}>
                      <div style={{ flex:1,background:c.surfaceEl,borderRadius:8,padding:"8px 10px" }}>
                        <div style={{ fontSize:9,color:c.textMute,fontWeight:700 }}>MAX USERS</div>
                        <div style={{ fontSize:16,fontWeight:700,color:c.text }}>{plan.maxUsers>=999?"∞":plan.maxUsers}</div>
                      </div>
                      <div style={{ flex:1,background:c.surfaceEl,borderRadius:8,padding:"8px 10px" }}>
                        <div style={{ fontSize:9,color:c.textMute,fontWeight:700 }}>LOCATIONS</div>
                        <div style={{ fontSize:16,fontWeight:700,color:c.text }}>{plan.maxLocations>=99?"∞":plan.maxLocations}</div>
                      </div>
                    </div>
                    <div style={{ display:"flex",flexDirection:"column",gap:3 }}>
                      {FEATURES.filter(f => (plan.features as any)?.[f.key]).map(f => (
                        <div key={f.key} style={{ display:"flex",alignItems:"center",gap:6,fontSize:11,color:c.textSub }}>
                          <span style={{ color:c.accent,fontWeight:700 }}>✓</span>{f.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background:c.surface,border:"1px solid "+c.border,borderRadius:14,padding:"22px 24px" }}>
              <div style={{ fontSize:14,fontWeight:700,marginBottom:16,color:c.text,display:"flex",alignItems:"center",gap:8 }}>
                <IcoShield/>Feature permissions matrix
              </div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12 }}>
                  <thead>
                    <tr>
                      <th style={{ ...th,textAlign:"left" as const }}>Feature</th>
                      {planDefs.map(pp=><th key={pp.id} style={{ ...th,textAlign:"center" as const,color:pp.color }}>{pp.name}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {FEATURES.map(f => (
                      <tr key={f.key} style={{ borderBottom:"1px solid "+c.border }}>
                        <td style={{ padding:"10px 14px",color:c.textSub }}>
                          {f.label}
                          <div style={{ fontSize:10,color:c.textMute }}>{f.desc}</div>
                        </td>
                        {planDefs.map(pp => (
                          <td key={pp.id} style={{ padding:"10px 14px",textAlign:"center" as const }}>
                            {(pp.features as any)?.[f.key]
                              ? <span style={{ color:c.accent,fontWeight:700,fontSize:16 }}>✓</span>
                              : <span style={{ color:c.border,fontSize:16 }}>—</span>
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* FEATURE FLAGS */}
        {tab==="features" && (
          <div style={{ padding:"32px 36px" }}>
            <h1 style={{ fontSize:24,fontWeight:800,marginBottom:4,color:c.text }}>Feature flags</h1>
            <p style={{ fontSize:13,color:c.textSub,marginBottom:24 }}>Override features per organisation. Changes apply instantly.</p>
            <div style={{ background:c.surface,border:"1px solid "+c.border,borderRadius:14,overflow:"auto" }}>
              <table style={{ width:"100%",borderCollapse:"collapse",whiteSpace:"nowrap" }}>
                <thead>
                  <tr style={{ borderBottom:"1px solid "+c.border }}>
                    <th style={{ ...th,minWidth:200,textAlign:"left" as const }}>Organisation</th>
                    {FEATURES.map(f => <th key={f.key} title={f.desc} style={{ ...th,textAlign:"center" as const }}>{f.label}</th>)}
                    <th style={{ padding:"11px 14px",background:c.surfaceEl }}/>
                  </tr>
                </thead>
                <tbody>
                  {orgs===undefined
                    ? <tr><td colSpan={FEATURES.length+2} style={{ padding:32,textAlign:"center",color:c.textMute }}>Loading...</td></tr>
                    : orgs.map((o:any) => (
                      <FeatureRow key={o._id} org={o} c={c} onSave={async f => { await updateFeatures({orgId:o._id,features:f,...actor}); }}/>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AUDIT LOG */}
        {tab==="audit" && (
          <div style={{ padding:"32px 36px" }}>
            <h1 style={{ fontSize:24,fontWeight:800,marginBottom:4,color:c.text }}>Audit log</h1>
            <p style={{ fontSize:13,color:c.textSub,marginBottom:24 }}>Every superadmin action, newest first</p>
            <div style={{ background:c.surface,border:"1px solid "+c.border,borderRadius:14,overflow:"hidden" }}>
              <table style={{ width:"100%",borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ borderBottom:"1px solid "+c.border }}>
                    {["Action","Target","Detail","By","When"].map(h=><th key={h} style={th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {audit===undefined
                    ? <tr><td colSpan={5} style={{ padding:32,textAlign:"center",color:c.textMute }}>Loading...</td></tr>
                    : audit.length===0
                    ? <tr><td colSpan={5} style={{ padding:32,textAlign:"center",color:c.textMute }}>No actions yet.</td></tr>
                    : audit.map((a:any) => (
                      <tr key={a._id} style={{ borderBottom:"1px solid "+c.border }}>
                        <td style={{ padding:"12px 14px" }}>
                          <span style={{ background:c.accentBg,color:c.accent,fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:6,fontFamily:"monospace" }}>{a.action}</span>
                        </td>
                        <td style={{ padding:"12px 14px",fontSize:13,fontWeight:500,color:c.text }}>{a.targetLabel||a.targetId||"—"}</td>
                        <td style={{ padding:"12px 14px",fontSize:12,color:c.textSub,maxWidth:240 }}>{a.detail||"—"}</td>
                        <td style={{ padding:"12px 14px",fontSize:13,color:c.text }}>{a.actorName}</td>
                        <td style={{ padding:"12px 14px",fontSize:11,color:c.textMute,fontFamily:"monospace",whiteSpace:"nowrap" }}>
                          {new Date(a.createdAt).toLocaleString([],{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {tab==="settings" && <SettingsPanel user={user} c={c} />}

        <div style={{ textAlign:"center",padding:"12px 36px",fontSize:"12px",fontWeight:600,color:"#3fb950",letterSpacing:"0.04em",opacity:0.85 }}>© {new Date().getFullYear()} Porta · Powered by Lider Technologies LTD</div>
      </main>

      {/* ── CREATE MODAL ── */}
      {createOpen && (
        <Modal title="Create new account" onClose={()=>setCreateOpen(false)} c={c} wide>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 20px" }}>
            <div style={{ gridColumn:"1/-1" }}><Field label="Organisation logo" c={c}><LogoUploader current={form.logoUrl} onUpload={url=>setForm(f=>({...f,logoUrl:url}))} c={c}/></Field></div>
            <Field label="Organisation name" required c={c}><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Acme Corp" style={inp(c)}/></Field>
            <Field label="URL handle" required c={c}><input value={form.slug} onChange={e=>setForm(f=>({...f,slug:e.target.value.toLowerCase().replace(/\s+/g,"-")}))} placeholder="acme-corp" style={inp(c)}/></Field>
            <Field label="Contact email" required c={c}><input value={form.ownerEmail} onChange={e=>setForm(f=>({...f,ownerEmail:e.target.value}))} placeholder="owner@acme.com" style={inp(c)}/></Field>
            <Field label="Contact name" c={c}><input value={form.ownerName} onChange={e=>setForm(f=>({...f,ownerName:e.target.value}))} placeholder="Jane Smith" style={inp(c)}/></Field>
            <Field label="Contact phone" c={c}><input value={form.ownerPhone} onChange={e=>setForm(f=>({...f,ownerPhone:e.target.value}))} placeholder="+1 555 000 0000" style={inp(c)}/></Field>
            <Field label="Website" c={c}><input value={form.website} onChange={e=>setForm(f=>({...f,website:e.target.value}))} placeholder="https://acme.com" style={inp(c)}/></Field>
            <Field label="Address" c={c}><input value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} placeholder="123 Main St" style={inp(c)}/></Field>
            <Field label="Plan" c={c}><select value={form.plan} onChange={e=>setForm(f=>({...f,plan:e.target.value as Plan}))} style={{ ...inp(c),cursor:"pointer" }}>{planDefs.map(pp=><option key={pp.id} value={pp.id}>{pp.name}</option>)}</select></Field>
            <Field label="Max users" c={c}><input value={form.maxUsers} onChange={e=>setForm(f=>({...f,maxUsers:e.target.value}))} placeholder="50" style={inp(c)}/></Field>
            <Field label="Max locations" c={c}><input value={form.maxLocations} onChange={e=>setForm(f=>({...f,maxLocations:e.target.value}))} placeholder="5" style={inp(c)}/></Field>
            <div style={{ gridColumn:"1/-1" }}>
              <Field label="Admin notes" c={c}><textarea value={form.adminNotes} onChange={e=>setForm(f=>({...f,adminNotes:e.target.value}))} placeholder="Internal notes..." style={{ ...inp(c),minHeight:70,resize:"vertical" }}/></Field>
            </div>
            <div style={{ gridColumn:"1/-1",marginTop:4 }}>
              <div style={{ fontSize:11,fontWeight:700,color:c.textMute,textTransform:"uppercase" as const,letterSpacing:"0.1em",marginBottom:10 }}>Appointment rules</div>
              <BookingRuleRow label="Require visitor ID" desc="Visitors must present a valid ID at check-in" on={form.bookingRules.idRequired} onChange={()=>setForm(f=>({...f,bookingRules:{...f.bookingRules,idRequired:!f.bookingRules.idRequired}}))} c={c}/>
              <BookingRuleRow label="Require photo" desc="Capture a photo of the visitor at check-in" on={form.bookingRules.photoRequired} onChange={()=>setForm(f=>({...f,bookingRules:{...f.bookingRules,photoRequired:!f.bookingRules.photoRequired}}))} c={c}/>
              <BookingRuleRow label="Approval required" desc="Visits must be approved before the visitor can check in" on={form.bookingRules.approvalRequired} onChange={()=>setForm(f=>({...f,bookingRules:{...f.bookingRules,approvalRequired:!f.bookingRules.approvalRequired}}))} c={c}/>
              <BookingRuleRow label="Allow walk-ins" desc="Visitors can arrive without a prior booking" on={form.bookingRules.walkInEnabled} onChange={()=>setForm(f=>({...f,bookingRules:{...f.bookingRules,walkInEnabled:!f.bookingRules.walkInEnabled}}))} c={c}/>
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <div style={{ background:c.surfaceEl,border:"1px solid "+c.border,borderRadius:8,padding:"10px 14px",fontSize:12,color:c.textSub }}>
                Account starts on a 14-day trial automatically.
              </div>
            </div>
          </div>
          <ModalFooter>
            <SecBtn onClick={()=>setCreateOpen(false)} c={c}>Cancel</SecBtn>
            <PriBtn disabled={submitting||!form.name||!form.slug||!form.ownerEmail} onClick={handleCreate} c={c}>
              {submitting?"Creating...":"Create account"}
            </PriBtn>
          </ModalFooter>
        </Modal>
      )}

      {/* ── EDIT MODAL ── */}
      {editOrg && (
        <Modal title={"Edit — "+editOrg.name} onClose={()=>setEditOrg(null)} c={c} wide>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 20px" }}>
            <div style={{ gridColumn:"1/-1" }}><Field label="Logo" c={c}><LogoUploader current={editForm.logoUrl} onUpload={url=>setEditForm((f:any)=>({...f,logoUrl:url}))} c={c}/></Field></div>
            <Field label="Organisation name" required c={c}><input value={editForm.name} onChange={e=>setEditForm((f:any)=>({...f,name:e.target.value}))} style={inp(c)}/></Field>
            <Field label="URL Handle" c={c}><input value={editForm.slug} onChange={e=>setEditForm((f:any)=>({...f,slug:e.target.value}))} style={inp(c)}/></Field>
            <Field label="Contact email" c={c}><input value={editForm.ownerEmail} onChange={e=>setEditForm((f:any)=>({...f,ownerEmail:e.target.value}))} style={inp(c)}/></Field>
            <Field label="Contact name" c={c}><input value={editForm.ownerName} onChange={e=>setEditForm((f:any)=>({...f,ownerName:e.target.value}))} style={inp(c)}/></Field>
            <Field label="Contact phone" c={c}><input value={editForm.ownerPhone} onChange={e=>setEditForm((f:any)=>({...f,ownerPhone:e.target.value}))} style={inp(c)}/></Field>
            <Field label="Website" c={c}><input value={editForm.website} onChange={e=>setEditForm((f:any)=>({...f,website:e.target.value}))} style={inp(c)}/></Field>
            <Field label="Address" c={c}><input value={editForm.address} onChange={e=>setEditForm((f:any)=>({...f,address:e.target.value}))} style={inp(c)}/></Field>
            <Field label="Max users" c={c}><input value={editForm.maxUsers} onChange={e=>setEditForm((f:any)=>({...f,maxUsers:e.target.value}))} style={inp(c)}/></Field>
            <Field label="Max locations" c={c}><input value={editForm.maxLocations} onChange={e=>setEditForm((f:any)=>({...f,maxLocations:e.target.value}))} style={inp(c)}/></Field>
            <div style={{ gridColumn:"1/-1" }}>
              <Field label="Admin notes" c={c}><textarea value={editForm.adminNotes} onChange={e=>setEditForm((f:any)=>({...f,adminNotes:e.target.value}))} style={{ ...inp(c),minHeight:70,resize:"vertical" }}/></Field>
            </div>
            <div style={{ gridColumn:"1/-1",marginTop:4 }}>
              <div style={{ fontSize:11,fontWeight:700,color:c.textMute,textTransform:"uppercase" as const,letterSpacing:"0.1em",marginBottom:10 }}>Appointment rules</div>
              <BookingRuleRow label="Require visitor ID" desc="Visitors must present a valid ID at check-in" on={editForm.bookingRules?.idRequired??false} onChange={()=>setEditForm((f:any)=>({...f,bookingRules:{...f.bookingRules,idRequired:!f.bookingRules?.idRequired}}))} c={c}/>
              <BookingRuleRow label="Require photo" desc="Capture a photo of the visitor at check-in" on={editForm.bookingRules?.photoRequired??false} onChange={()=>setEditForm((f:any)=>({...f,bookingRules:{...f.bookingRules,photoRequired:!f.bookingRules?.photoRequired}}))} c={c}/>
              <BookingRuleRow label="Approval required" desc="Visits must be approved before the visitor can check in" on={editForm.bookingRules?.approvalRequired??true} onChange={()=>setEditForm((f:any)=>({...f,bookingRules:{...f.bookingRules,approvalRequired:!f.bookingRules?.approvalRequired}}))} c={c}/>
              <BookingRuleRow label="Allow walk-ins" desc="Visitors can arrive without a prior booking" on={editForm.bookingRules?.walkInEnabled??true} onChange={()=>setEditForm((f:any)=>({...f,bookingRules:{...f.bookingRules,walkInEnabled:!f.bookingRules?.walkInEnabled}}))} c={c}/>
            </div>
          </div>
          <ModalFooter>
            <SecBtn onClick={()=>setEditOrg(null)} c={c}>Cancel</SecBtn>
            <PriBtn disabled={submitting} onClick={handleEdit} c={c}>{submitting?"Saving...":"Save changes"}</PriBtn>
          </ModalFooter>
        </Modal>
      )}

      {/* ── PLAN EDIT MODAL ── */}
      {planEditIdx!==null && planEditVal && (
        <Modal title={planEditIdx<planDefs.length ? "Edit plan — "+(planDefs[planEditIdx]?.name??"") : "New plan"} onClose={()=>{setPlanEditIdx(null);setPlanEditVal(null);}} c={c} wide>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 20px" }}>
            <div style={{ gridColumn:"1/-1" }}><Field label="Plan name" required c={c}><input value={planEditVal.name} onChange={e=>setPlanEditVal((p:any)=>({...p,name:e.target.value}))} style={inp(c)}/></Field></div>
            <div style={{ gridColumn:"1/-1" }}><Field label="Description" c={c}><input value={planEditVal.desc} onChange={e=>setPlanEditVal((p:any)=>({...p,desc:e.target.value}))} style={inp(c)}/></Field></div>
            <Field label="Monthly price ($)" c={c}><input type="number" value={planEditVal.price} onChange={e=>setPlanEditVal((p:any)=>({...p,price:+e.target.value}))} style={inp(c)}/></Field>
            <Field label="Annual price ($/mo)" c={c}><input type="number" value={planEditVal.annualPrice} onChange={e=>setPlanEditVal((p:any)=>({...p,annualPrice:+e.target.value}))} style={inp(c)}/></Field>
            <Field label="Max users" c={c}><input type="number" value={planEditVal.maxUsers} onChange={e=>setPlanEditVal((p:any)=>({...p,maxUsers:+e.target.value}))} style={inp(c)}/></Field>
            <Field label="Max locations" c={c}><input type="number" value={planEditVal.maxLocations} onChange={e=>setPlanEditVal((p:any)=>({...p,maxLocations:+e.target.value}))} style={inp(c)}/></Field>
            <div style={{ gridColumn:"1/-1" }}>
              <Field label="Accent colour" c={c}>
                <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                  <input type="color" value={planEditVal.color} onChange={e=>setPlanEditVal((p:any)=>({...p,color:e.target.value}))} style={{ width:40,height:36,borderRadius:6,border:"1px solid "+c.border,cursor:"pointer" }}/>
                  <input value={planEditVal.color} onChange={e=>setPlanEditVal((p:any)=>({...p,color:e.target.value}))} style={{ ...inp(c),flex:1 }}/>
                </div>
              </Field>
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <div style={{ fontSize:12,fontWeight:600,color:c.textSub,marginBottom:10,textTransform:"uppercase" as const,letterSpacing:"0.06em" }}>Features included in this plan</div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                {FEATURES.map(f => (
                  <div key={f.key} onClick={()=>setPlanEditVal((p:any)=>({...p,features:{...p.features,[f.key]:!p.features?.[f.key]}}))} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderRadius:8,border:"1px solid "+(planEditVal.features?.[f.key]?planEditVal.color:c.border),background:planEditVal.features?.[f.key]?"rgba(34,197,94,0.06)":c.surfaceEl,cursor:"pointer",transition:"all .15s" }}>
                    <div>
                      <div style={{ fontSize:13,fontWeight:600,color:planEditVal.features?.[f.key]?c.text:c.textSub }}>{f.label}</div>
                      <div style={{ fontSize:10,color:c.textMute }}>{f.desc}</div>
                    </div>
                    <Toggle on={!!planEditVal.features?.[f.key]} onChange={()=>setPlanEditVal((p:any)=>({...p,features:{...p.features,[f.key]:!p.features?.[f.key]}}))} c={c}/>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <ModalFooter>
            {planEditIdx<planDefs.length && (
              <button onClick={()=>{setPlanDefs(d=>d.filter((_,i)=>i!==planEditIdx));setPlanEditIdx(null);setPlanEditVal(null);}} style={{ marginRight:"auto",padding:"9px 14px",borderRadius:8,border:"none",background:c.dangerBg,color:c.danger,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
                Delete plan
              </button>
            )}
            <SecBtn onClick={()=>{setPlanEditIdx(null);setPlanEditVal(null);}} c={c}>Cancel</SecBtn>
            <PriBtn onClick={savePlanEdit} c={c} disabled={!planEditVal.name}>{planEditIdx<planDefs.length?"Save plan":"Create plan"}</PriBtn>
          </ModalFooter>
        </Modal>
      )}

      {/* ── BLOCK MODAL ── */}
      {blockModal && (
        <Modal title={blockModal.status==="blocked"?"Unblock organisation":"Block organisation"} onClose={()=>{setBlockModal(null);setBlockReason("");}} c={c}>
          <div style={{ fontSize:15,fontWeight:700,marginBottom:14,color:c.text }}>{blockModal.name}</div>
          {blockModal.status!=="blocked"
            ? <Field label="Reason (optional)" c={c}><textarea value={blockReason} onChange={e=>setBlockReason(e.target.value)} placeholder="e.g. Payment failed..." style={{ ...inp(c),minHeight:80,resize:"vertical" }}/></Field>
            : <p style={{ fontSize:13,color:c.textSub }}>This will restore full access for all users in this organisation.</p>
          }
          <ModalFooter>
            <SecBtn onClick={()=>{setBlockModal(null);setBlockReason("");}} c={c}>Cancel</SecBtn>
            <PriBtn onClick={handleBlockToggle} disabled={submitting} c={c} danger={blockModal.status!=="blocked"}>
              {submitting?"...":(blockModal.status==="blocked"?"Unblock":"Block organisation")}
            </PriBtn>
          </ModalFooter>
        </Modal>
      )}

      {/* ── DELETE MODAL ── */}
      {deleteConfirm && (
        <Modal title="Delete organisation" onClose={()=>setDeleteConfirm(null)} c={c}>
          <div style={{ fontSize:15,fontWeight:700,marginBottom:12,color:c.text }}>{deleteConfirm.name}</div>
          <div style={{ background:c.dangerBg,border:"1px solid rgba(239,68,68,0.25)",borderRadius:8,padding:"12px 14px",fontSize:13,color:c.danger }}>
            Permanent and cannot be undone. All data for this organisation will be deleted forever.
          </div>
          <ModalFooter>
            <SecBtn onClick={()=>setDeleteConfirm(null)} c={c}>Cancel</SecBtn>
            <PriBtn onClick={handleDelete} disabled={submitting} c={c} danger>{submitting?"Deleting...":"Delete permanently"}</PriBtn>
          </ModalFooter>
        </Modal>
      )}

    </div>
  );
}


