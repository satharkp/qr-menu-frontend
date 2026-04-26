import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, ShieldCheck, ArrowRight } from "lucide-react";
import { API_BASE } from "../services/api";


const SuperAdminLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  
  useEffect(() => {
    // Force default theme for login pages
    const root = document.documentElement;
    root.style.setProperty("--color-primary", "#2563eb");
    root.style.setProperty("--font-main", "Inter");
    root.style.setProperty("--font-heading", "Inter");
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await axios.post(`${API_BASE}/super/login`, {
        email,
        password,
      });

      // save token
      localStorage.setItem("superAdminToken", res.data.token);

      // redirect to dashboard
      navigate("/super-admin/dashboard");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 font-sans">
      <div className="w-full max-w-sm">
        {/* Branding & Welcome */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-slate-900 shadow-sm mb-4">
            <ShieldCheck size={32} className="text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Super Admin</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Personnel Access Only</p>
        </div>

        {/* Authentication Card */}
        <div className="bg-white border border-gray-200 p-8 rounded-2xl shadow-sm">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Identity</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    placeholder="admin@system.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white border border-gray-200 rounded-lg pl-12 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Access Key</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-white border border-gray-200 rounded-lg pl-12 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-lg text-sm shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? "Verifying..." : "Authenticate"}</span>
              {!loading && <ArrowRight size={18} strokeWidth={2.5} />}
            </button>

            <div className="pt-6 border-t border-gray-100 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                Authorized Session • Encrypted Portal
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
            QR Restaurant Management &copy; {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </div>
  );
};

export default SuperAdminLoginPage;