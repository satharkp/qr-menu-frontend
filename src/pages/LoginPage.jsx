import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../services/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));

      if (payload.role === "kitchen") navigate("/kitchen");
      else if (payload.role === "waiter") navigate("/waiter");
      else if (payload.role === "admin") navigate("/admin/dashboard");
    } catch (err) {
      localStorage.removeItem("token");
    }
  }, [navigate]);

  const handleLogin = async () => {
    try {
      const res = await axios.post(
        `${API_BASE}/auth/login`,
        { email, password }
      );

      const token = res.data.token;
      localStorage.setItem("token", token);

      const payload = JSON.parse(atob(token.split(".")[1]));

      if (payload.role === "kitchen") {
        navigate("/kitchen");
      } else if (payload.role === "waiter") {
        navigate("/waiter");
      } else if (payload.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }

    } catch (err) {
      alert("Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b2420] relative overflow-hidden">
      {/* Decorative Botanical elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-greenleaf-secondary/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-greenleaf-primary/10 rounded-full translate-x-1/3 translate-y-1/3 blur-[120px]"></div>

      <div className="bg-white/10 backdrop-blur-xl p-12 rounded-[3.5rem] w-[450px] shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-1000">
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-6 bg-white/10 rounded-[2rem] flex items-center justify-center border border-white/20 shadow-lg">
            <span className="text-4xl">🌿</span>
          </div>
          <h1 className="text-3xl font-serif font-black text-white tracking-tight">Greenleaf</h1>
          <p className="text-[10px] uppercase font-bold tracking-widest text-greenleaf-secondary mt-2">Enterprise Access Portal</p>
        </div>

        <div className="space-y-6">
          <div className="relative group">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl opacity-40 group-focus-within:opacity-100 transition-opacity">📧</span>
            <input
              className="bg-white/5 border border-white/10 text-white p-5 pl-14 w-full rounded-2xl outline-none focus:border-greenleaf-secondary/50 focus:bg-white/10 transition-all placeholder:text-white/20 font-bold"
              placeholder="Operational Email"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative group">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl opacity-40 group-focus-within:opacity-100 transition-opacity">🔑</span>
            <input
              type="password"
              className="bg-white/5 border border-white/10 text-white p-5 pl-14 w-full rounded-2xl outline-none focus:border-greenleaf-secondary/50 focus:bg-white/10 transition-all placeholder:text-white/20 font-bold"
              placeholder="Access Password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            onClick={handleLogin}
            className="bg-greenleaf-secondary hover:bg-greenleaf-secondary/90 text-white w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.25em] shadow-xl shadow-greenleaf-secondary/20 transition-all active:scale-95 group flex items-center justify-center gap-3 overflow-hidden"
          >
            <span>Initialize Session</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>

        <div className="mt-12 text-center text-[10px] text-white/30 font-black uppercase tracking-widest">
          Secure Data Node • V2.4.0
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@900&display=swap');
      `}} />
    </div>
  );
}