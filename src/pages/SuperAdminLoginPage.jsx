import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, ShieldCheck, ArrowRight } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "https://qr-res.onrender.com/api";

const SuperAdminLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

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
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#fafbfc] font-['DM_Sans',sans-serif]">
      {/* Radiant Mesh Background */}
      <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] rounded-full bg-indigo-100/50 blur-[90px] animate-[pulse_10s_infinite] mix-blend-multiply"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] rounded-full bg-rose-100/50 blur-[90px] animate-[pulse_12s_infinite_1s] mix-blend-multiply"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] rounded-full bg-emerald-50/40 blur-[120px] animate-[pulse_15s_infinite_2s]"></div>
      
      {/* Subtle Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] scale-[2]"></div>

      <div className="w-full max-w-sm relative z-10">
        {/* Branding & Welcome */}
        <div className="text-center mb-10 space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2.5rem] bg-white border border-slate-200/50 shadow-[0_20px_50px_rgba(0,0,0,0.05)] backdrop-blur-xl mb-3 group cursor-default">
            <div className="p-3 bg-slate-900 rounded-2xl text-white group-hover:scale-110 transition-transform duration-500 ease-out shadow-lg shadow-slate-900/20">
              <ShieldCheck size={32} strokeWidth={1.5} />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Super Admin</h1>
            <p className="text-[9px] text-slate-500 uppercase tracking-[0.25em] font-semibold">Authorized Personnel Access</p>
          </div>
        </div>

        {/* Frosted Glass Authentication Card */}
        <div className="relative group">
          {/* Decorative Halo */}
          <div className="absolute -inset-px rounded-[3rem] bg-gradient-to-b from-slate-200/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
          
          <form
            onSubmit={handleLogin}
            className="relative bg-white/60 backdrop-blur-xl border border-white p-10 lg:p-12 space-y-8 rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)]"
          >
            <div className="space-y-6">
              {/* Email Identity */}
              <div className="space-y-2 group/input">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 transition-colors group-focus-within/input:text-indigo-600">Identity</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-slate-900 transition-colors" size={18} />
                  <input
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:bg-white transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Password Access Key */}
              <div className="space-y-2 group/input">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 transition-colors group-focus-within/input:text-indigo-600">Access Key</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-slate-900 transition-colors" size={18} />
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:bg-white transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Submit Established Action */}
            <button
              type="submit"
              disabled={loading}
              className="w-full group/btn relative overflow-hidden rounded-2xl px-6 py-4 font-bold text-sm text-white shadow-xl shadow-slate-900/10 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-slate-900 group-hover:bg-slate-800 transition-colors duration-500"></div>
              <div className="relative flex items-center justify-center gap-3">
                <span>{loading ? "Signing in..." : "Sign In"}</span>
                {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />}
              </div>
            </button>

            {/* Footer Separator & Status */}
            <div className="pt-4 flex flex-col items-center gap-5 text-center opacity-60">
              <div className="flex items-center gap-4 w-full">
                <div className="h-px flex-1 bg-slate-200"></div>
                <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                <div className="h-px flex-1 bg-slate-200"></div>
              </div>
              <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-black">
                Authorized Session • AES-512 Terminal
              </p>
            </div>
          </form>
        </div>

        {/* Global Registry Copyright */}
        <footer className="mt-16 text-center">
          <p className="text-[10px] text-slate-300 uppercase tracking-widest font-bold">
            QR Restaurant Management &copy; 2026 • Secure Admin Panel
          </p>
        </footer>
      </div>
    </div>
  );
};

export default SuperAdminLoginPage;