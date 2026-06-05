import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import React, { useState } from "react";
import { useUser, useClerk, useSignIn, SignOutButton } from "@clerk/clerk-react";
import { SuperAdminPage } from "./features/superadmin/pages/SuperAdminPage";

function CustomLogin() {
  const { signIn, isLoaded, setActive } = useSignIn()!;
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode]         = useState("");
  const [step, setStep]         = useState<"creds"|"mfa">("creds");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);

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
        await signIn.prepareSecondFactor({ strategy: "email_code" });
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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #0d1117; color: #e6edf3; }
        .sa-page { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: #0d1117; padding: 24px; }
        .sa-card { background: #161b22; border: 1px solid #30363d; border-radius: 16px; padding: 40px 36px; width: 100%; max-width: 400px; animation: fadeUp .3s cubic-bezier(.16,1,.3,1) both; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .sa-brand { text-align: center; margin-bottom: 28px; }
        .sa-logo { height: 52px; width: auto; margin: 0 auto 10px; display: block; }
        .sa-badge { display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; color: #3fb950; background: rgba(63,185,80,0.1); border: 1px solid rgba(63,185,80,0.25); border-radius: 999px; padding: 3px 10px; }
        .sa-title { font-size: 1.35rem; font-weight: 700; color: #e6edf3; margin-bottom: 6px; }
        .sa-sub { font-size: 0.85rem; color: #8b949e; }
        .sa-form { display: flex; flex-direction: column; gap: 18px; }
        .sa-field { display: flex; flex-direction: column; gap: 6px; }
        .sa-label { font-size: 0.78rem; font-weight: 600; color: #8b949e; text-transform: uppercase; letter-spacing: .05em; }
        .pw-wrap { position: relative; }
        .pw-wrap .sa-input { width: 100%; padding-right: 42px; }
        .pw-eye { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #8b949e; display: flex; align-items: center; padding: 0; }
        .pw-eye:hover { color: #e6edf3; }
        .sa-input { background: #0d1117; border: 1px solid #30363d; border-radius: 8px; padding: 11px 14px; font-size: 0.9rem; color: #e6edf3; font-family: inherit; outline: none; transition: border-color .15s; width: 100%; }
        .sa-input:focus { border-color: #3fb950; }
        .sa-input::placeholder { color: #484f58; }
        .sa-input--code { letter-spacing: 0.3em; font-size: 1.1rem; text-align: center; }
        .sa-error { font-size: 0.8rem; color: #f85149; background: rgba(248,81,73,0.1); border: 1px solid rgba(248,81,73,0.3); border-radius: 8px; padding: 10px 14px; }
        .sa-btn { background: #3fb950; color: #fff; border: none; border-radius: 8px; padding: 12px; font-size: 0.9rem; font-weight: 700; cursor: pointer; font-family: inherit; transition: opacity .15s; width: 100%; }
        .sa-btn:hover:not(:disabled) { opacity: 0.88; }
        .sa-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .sa-back { background: none; border: none; color: #8b949e; font-size: 0.82rem; cursor: pointer; font-family: inherit; display: flex; align-items: center; gap: 4px; padding: 0; }
        .sa-back:hover { color: #e6edf3; }
        @media (max-width: 480px) { .sa-card { padding: 32px 24px; } }
      `}</style>
      <div className="sa-page">
        <div className="sa-card">
          <div className="sa-brand">
            <img src="/Porta.png" alt="Porta" className="sa-logo" />
            <span className="sa-badge">SUPERADMIN</span>
          </div>
          {step === "creds" ? (
            <>
              <div style={{marginBottom:"28px"}}>
                <p className="sa-title">Welcome back</p>
                <p className="sa-sub">Sign in to the Porta control panel.</p>
              </div>
              <form className="sa-form" onSubmit={handleLogin}>
                <div className="sa-field">
                  <label className="sa-label">Email address</label>
                  <input className="sa-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@porta.com" required autoComplete="email" />
                </div>
                <div className="sa-field">
                  <label className="sa-label">Password</label>
                  <div className="pw-wrap"><input className="sa-input" type={showPw ? "text" : "password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" /><button type="button" className="pw-eye" onClick={()=>setShowPw(p=>!p)} tabIndex={-1}>{showPw ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}</button></div>
                </div>
                {error && <div className="sa-error">{error}</div>}
                <button type="submit" className="sa-btn" disabled={loading || !isLoaded}>{loading ? "Signing in..." : "Sign in"}</button>
              </form>
            </>
          ) : (
            <>
              <div style={{marginBottom:"28px"}}>
                <p className="sa-title">Two-step verification</p>
                <p className="sa-sub">Enter the 6-digit code sent to your email.</p>
              </div>
              <form className="sa-form" onSubmit={handleVerify}>
                <div className="sa-field">
                  <label className="sa-label">Verification code</label>
                  <input className="sa-input sa-input--code" type="text" inputMode="numeric" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,""))} placeholder="000000" required autoFocus />
                </div>
                {error && <div className="sa-error">{error}</div>}
                <button type="submit" className="sa-btn" disabled={loading || code.length !== 6}>{loading ? "Verifying..." : "Verify & continue"}</button>
                <button type="button" className="sa-back" onClick={()=>{setStep("creds");setError("");setCode("");}}>Back to sign in</button>
              </form>
            </>
          )}
        </div>
      <div style={{textAlign:"center",padding:"12px 24px",fontSize:"12px",fontWeight:600,color:"#3fb950",letterSpacing:"0.04em",opacity:0.85,position:"fixed",bottom:0,left:0,right:0,background:"#0d1117"}}>© {new Date().getFullYear()} Porta · Powered by Lider Technologies LTD</div>
      </div>
    </>
  );
}
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
      <div style={{ fontSize:"48px" }}>ðŸš«</div>
      <div style={{ fontSize:"20px",fontWeight:700,color:"#e6edf3" }}>Access Denied</div>
      <div style={{ fontSize:"14px",color:"#8b949e" }}>This area is restricted to Porta superadmins only.</div>
      <div style={{ fontSize:"12px",color:"#30363d",marginTop:"8px" }}>Signed in as: {user.primaryEmailAddress?.emailAddress}</div>
      <SignOutButton>
        <button style={{ marginTop:"8px",padding:"9px 20px",background:"transparent",border:"1px solid #30363d",borderRadius:"8px",color:"#8b949e",fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:"DM Sans,sans-serif" }}
          onMouseOver={e=>(e.currentTarget.style.borderColor="#f85149",e.currentTarget.style.color="#f85149")}
          onMouseOut={e=>(e.currentTarget.style.borderColor="#30363d",e.currentTarget.style.color="#8b949e")}>
          Sign out &amp; try another account
        </button>
      </SignOutButton>
    </div>
  );

  return <>{children}</>;
}

// â”€â”€â”€ Router â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const router = createBrowserRouter([
  { path: "/",  element: <Guard><SuperAdminPage /></Guard> },
  { path: "*",  element: <Navigate to="/" /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}









