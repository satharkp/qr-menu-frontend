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

  useEffect(() => {
    // Force default theme for login pages
    const root = document.documentElement;
    root.style.setProperty("--color-primary", "#2563eb");
    root.style.setProperty("--font-main", "Inter");
    root.style.setProperty("--font-heading", "Inter");
  }, []);

  const restaurantName = "Restaurant Portal";

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
    <div className="min-h-screen flex font-sans bg-slate-50">
      {/* Left panel — brand showcase */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 bg-brand-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        
        <div className="relative z-10">
          <p className="text-white font-bold text-2xl tracking-tight">{restaurantName}</p>
          <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest mt-1">Management Suite</p>
        </div>

        <div className="relative z-10 space-y-12">
          <div className="max-w-md">
            <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest mb-4">The Platform</p>
            <h2 className="text-5xl font-bold text-white leading-tight tracking-tight">
              Efficient operations for your business.
            </h2>
          </div>

          <div className="space-y-4">
            {[
              { icon: "📊", label: "Real-time Analytics", desc: "Live revenue, orders & performance" },
              { icon: "🧑‍🍳", label: "Staff Management", desc: "Waiters, kitchen & role-based access" },
              { icon: "⚙️", label: "Brand Settings", desc: "Themes, fonts, logo & features" },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-white/10 rounded-xl border border-white/10 backdrop-blur-sm">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <p className="text-white font-bold text-sm">{f.label}</p>
                  <p className="text-white/60 text-xs">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold relative z-10">
          Secure Enterprise Platform • v2.4.0
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 md:p-12 shadow-sm">
            {/* Mobile logo */}
            <div className="lg:hidden mb-12">
              <p className="text-slate-900 font-bold text-2xl tracking-tight">{restaurantName}</p>
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Management Suite</p>
            </div>

            {/* Header */}
            <div className="mb-10">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                Sign in
              </h1>
              <p className="text-slate-500 text-sm mt-2">Enter your credentials to access the portal</p>
            </div>

            {/* Fields */}
            <div className="space-y-4 mb-8">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Email</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-white border border-gray-200 text-slate-900 placeholder-slate-400 pl-12 pr-5 py-3 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-sm"
                    placeholder="name@restaurant.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Password</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-white border border-gray-200 text-slate-900 placeholder-slate-400 pl-12 pr-5 py-3 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full py-3.5 rounded-lg font-bold text-sm bg-brand-primary hover:bg-brand-primary/90 text-white shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </>
              )}
            </button>

            <p className="mt-8 text-center text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              Secure Enterprise Portal • {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}