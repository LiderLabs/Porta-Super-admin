import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import React, { useState } from "react";
import { useUser, useClerk, useSignIn } from "@clerk/clerk-react";
import { SuperAdminPage } from "./features/superadmin/pages/SuperAdminPage";

// ─── Login ────────────────────────────────────────────────────────────────────
function CustomLogin() {
  const { signIn, isLoaded, setActive } = useSignIn()!;
  const [email, setEmail]   = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode]     = useState("");
  const [step, setStep]     = useState<"creds"|"mfa">("creds");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setError(""); setLoading(true);
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        window.location.reload();
      } else if (result.status === "needs_second_factor") {
        setStep("mfa");
      } else {
        setError("Unexpected status: " + result.status);
      }
    } catch (err: unknown) {
      setError((err as any)?.errors?.[0]?.message ?? "Invalid email or password.");
    } finally { setLoading(false); }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setError(""); setLoading(true);
    try {
      const result = await signIn.attemptSecondFactor({ strategy: "email_code", code });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        window.location.reload();
      } else {
        setError("Unexpected status: " + result.status);
      }
    } catch (err: unknown) {
      setError((err as any)?.errors?.[0]?.message ?? "Invalid code.");
    } finally { setLoading(false); }
  };

  const S: React.CSSProperties     = { display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#080a0f" };
  const card: React.CSSProperties  = { width:"360px",background:"#0d1117",border:"1px solid #21262d",borderRadius:"16px",padding:"36px",display:"flex",flexDirection:"column",gap:"20px" };
  const inpS: React.CSSProperties  = { padding:"10px 12px",background:"#161b22",border:"1px solid #21262d",borderRadius:"8px",color:"#e6edf3",fontSize:"13px",outline:"none",fontFamily:"DM Sans,sans-serif",width:"100%",boxSizing:"border-box" };
  const btn: React.CSSProperties   = { padding:"11px",background:"#45ba50",color:"#020203",border:"none",borderRadius:"8px",fontSize:"13px",fontWeight:700,cursor:"pointer",fontFamily:"DM Sans,sans-serif",width:"100%" };
  const lbl: React.CSSProperties   = { fontSize:"12px",fontWeight:600,color:"#8b949e",display:"block",marginBottom:"5px" };
  const errBox: React.CSSProperties = { fontSize:"12px",color:"#f85149",background:"rgba(248,81,73,0.08)",border:"1px solid rgba(248,81,73,0.2)",borderRadius:"6px",padding:"8px 12px" };

  return (
    <div style={S}>
      <div style={card}>
        {/* Logo */}
        <div style={{ display:"flex",alignItems:"center",gap:"10px" }}>
          <div style={{ width:"36px",height:"36px",borderRadius:"8px",background:"#45ba50",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",fontWeight:800,color:"#020203" }}>P</div>
          <div>
            <div style={{ fontSize:"16px",fontWeight:800,color:"#e6edf3",fontFamily:"DM Sans,sans-serif" }}>Porta</div>
            <div style={{ fontSize:"9px",fontWeight:700,letterSpacing:"0.1em",color:"#45ba50",fontFamily:"DM Mono,monospace" }}>SUPERADMIN</div>
          </div>
        </div>

        {/* Heading */}
        <div>
          <div style={{ fontSize:"20px",fontWeight:800,color:"#e6edf3",fontFamily:"DM Sans,sans-serif",marginBottom:"4px" }}>
            {step==="mfa" ? "Check your email" : "Welcome back"}
          </div>
          <div style={{ fontSize:"13px",color:"#8b949e",fontFamily:"DM Sans,sans-serif" }}>
            {step==="mfa" ? "Enter the 6-digit code sent to your email." : "Sign in to your superadmin account"}
          </div>
        </div>

        {/* Credentials form */}
        {step==="creds" ? (
          <form onSubmit={handleLogin} style={{ display:"flex",flexDirection:"column",gap:"14px" }}>
            <div>
              <label style={lbl}>Email</label>
              <input style={inpS} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@porta.com" required autoComplete="email"/>
            </div>
            <div>
              <label style={lbl}>Password</label>
              <input style={inpS} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password"/>
            </div>
            {error && <div style={errBox}>{error}</div>}
            <button type="submit" style={{ ...btn,opacity:loading||!isLoaded?0.5:1 }} disabled={loading||!isLoaded}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        ) : (
          /* MFA form */
          <form onSubmit={handleVerify} style={{ display:"flex",flexDirection:"column",gap:"14px" }}>
            <div>
              <label style={lbl}>Verification code</label>
              <input
                style={{ ...inpS,letterSpacing:"0.2em",textAlign:"center" }}
                type="text" inputMode="numeric" maxLength={6}
                value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,""))}
                placeholder="000000" required autoFocus
              />
            </div>
            {error && <div style={errBox}>{error}</div>}
            <button type="submit" style={{ ...btn,opacity:loading||code.length!==6?0.5:1 }} disabled={loading||code.length!==6}>
              {loading ? "Verifying..." : "Verify"}
            </button>
            <button type="button" onClick={()=>{setStep("creds");setError("");setCode("");}}
              style={{ background:"none",border:"none",color:"#8b949e",fontSize:"12px",cursor:"pointer",fontFamily:"DM Sans,sans-serif",display:"flex",alignItems:"center",gap:6 }}>
              &larr; Back to sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Auth guard ───────────────────────────────────────────────────────────────
function Guard({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#080a0f" }}>
      <div style={{ width:32,height:32,border:"3px solid #21262d",borderTopColor:"#45ba50",borderRadius:"50%",animation:"spin 0.7s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!isSignedIn) return <CustomLogin />;

  const role = (user.publicMetadata as any)?.role;
  if (role !== "superadmin") return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",background:"#080a0f",gap:"16px",fontFamily:"DM Sans,sans-serif" }}>
      <div style={{ fontSize:"48px" }}>🚫</div>
      <div style={{ fontSize:"20px",fontWeight:700,color:"#e6edf3" }}>Access Denied</div>
      <div style={{ fontSize:"14px",color:"#8b949e" }}>This area is restricted to Porta superadmins only.</div>
      <div style={{ fontSize:"12px",color:"#30363d",marginTop:"8px" }}>Signed in as: {user.primaryEmailAddress?.emailAddress}</div>
    </div>
  );

  return <>{children}</>;
}

// ─── Router ───────────────────────────────────────────────────────────────────
const router = createBrowserRouter([
  { path: "/",  element: <Guard><SuperAdminPage /></Guard> },
  { path: "*",  element: <Navigate to="/" /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}