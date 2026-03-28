import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE, fetchSettings } from "../services/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.role === "kitchen") navigate("/kitchen");
        else if (payload.role === "waiter") navigate("/waiter");
        else if (payload.role === "admin") navigate("/admin/dashboard");
      } catch {
        localStorage.removeItem("token");
      }
    }
  }, [navigate]);

  // Try to fetch restaurant settings for branding — fails silently if unauthenticated
  useEffect(() => {
    fetchSettings().then(s => { if (s) setSettings(s); }).catch(() => {});
  }, []);

  const accentColor = settings?.themeColor || "#a78843";
  const primaryColor = settings?.themeColor || "#1a1a2e";
  const restaurantName = settings?.name || "Restaurant";
  const fontFamily = settings?.font || "Inter";

  const dynamicStyles = {
    "--color-primary": primaryColor,
    "--font-heading": `"${fontFamily}", serif`,
    "--font-main": `"${fontFamily}", sans-serif`,
  };

  const handleLogin = async () => {
    if (!email || !password) return;
    setIsLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
      const token = res.data.token;
      localStorage.setItem("token", token);
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role === "kitchen") navigate("/kitchen");
      else if (payload.role === "waiter") navigate("/waiter");
      else if (payload.role === "admin") navigate("/admin/dashboard");
      else navigate("/");
    } catch {
      alert("Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div
      className="min-h-screen flex font-sans relative overflow-hidden"
      style={{ ...dynamicStyles, background: `linear-gradient(135deg, #0d0d0d 0%, #141414 40%, #1a1a1a 100%)` }}
    >
      {/* Ambient glow orbs — driven by theme color only */}
      <div
        className="absolute -top-40 left-1/3 w-[500px] h-[500px] rounded-full blur-[160px] opacity-15 pointer-events-none"
        style={{ background: accentColor }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px] opacity-10 pointer-events-none"
        style={{ background: accentColor }}
      />
      <div className="absolute top-1/2 left-0 w-[300px] h-[300px] rounded-full blur-[100px] opacity-5 pointer-events-none bg-white" />

      {/* Fine grid texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Left panel — brand showcase */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <div>
            <p className="text-white font-serif font-black text-lg leading-none">{restaurantName}</p>
            <p className="text-white/40 text-[9px] uppercase tracking-widest font-bold mt-0.5">Command Center</p>
          </div>
        </div>

        {/* Center showcase */}
        <div className="space-y-8">
          <div>
            <p className="text-white/40 text-[10px] uppercase font-black tracking-[0.3em] mb-4">Operations Suite</p>
            <h2 className="text-5xl xl:text-6xl font-serif font-black text-white leading-tight">
              Manage your<br />
              <span style={{ color: accentColor }}>restaurant</span><br />
              with ease.
            </h2>
          </div>

          <div className="space-y-4">
            {[
              { icon: "📊", label: "Real-time Analytics", desc: "Live revenue, orders & performance" },
              { icon: "🧑‍🍳", label: "Staff Management", desc: "Waiters, kitchen & role-based access" },
              { icon: "⚙️", label: "Brand Settings", desc: "Themes, fonts, logo & features" },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <p className="text-white font-bold text-sm">{f.label}</p>
                  <p className="text-white/40 text-xs">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/20 text-[10px] uppercase tracking-widest font-bold">
          Secure Enterprise Platform • SSL Encrypted
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-700">

          {/* Card */}
          <div className="bg-white/[0.07] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-[0_40px_120px_rgba(0,0,0,0.5)]">

            {/* Mobile logo */}
            <div className="lg:hidden flex items-center justify-center mb-8">
              <p className="text-white font-serif font-black text-xl">{restaurantName}</p>
            </div>

            {/* Header */}
            <div className="mb-10">
              <h1 className="text-3xl md:text-4xl font-serif font-black text-white tracking-tight leading-tight">
                Welcome back
              </h1>
              <p className="text-white/40 text-sm mt-2 font-sans">Sign in to your management portal</p>
            </div>

            {/* Fields */}
            <div className="space-y-4 mb-8">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-white/70 transition-colors">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 pl-12 pr-5 py-4 rounded-2xl outline-none focus:border-white/30 focus:bg-white/10 transition-all font-sans text-sm"
                  placeholder="Email address"
                />
              </div>

              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-white/70 transition-colors">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 pl-12 pr-5 py-4 rounded-2xl outline-none focus:border-white/30 focus:bg-white/10 transition-all font-sans text-sm"
                  placeholder="Password"
                />
              </div>
            </div>

            {/* Sign In Button */}
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-2xl disabled:opacity-70"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                color: "white",
                boxShadow: `0 10px 40px ${primaryColor}40`
              }}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </>
              )}
            </button>

            <p className="mt-8 text-center text-[10px] text-white/20 uppercase tracking-widest font-bold">
              {restaurantName} • Secure Access Portal
            </p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `body { margin: 0; }` }} />
    </div>
  );
}