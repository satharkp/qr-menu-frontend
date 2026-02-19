import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardSection from "../components/admin/DashboardSection";
import WaitersSection from "../components/admin/WaitersSection";
import TablesSection from "../components/admin/TablesSection";
import MenuSection from "../components/admin/MenuSection";

const getRoleFromToken = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return "Admin";
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role?.toUpperCase() || "ADMIN";
  } catch {
    return "ADMIN";
  }
};

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const navigate = useNavigate();
  const location = useLocation();
  const roleLabel = getRoleFromToken();

  useEffect(() => {
    const pathSection = location.pathname.split("/")[2] || "dashboard";
    setActiveSection(pathSection);
  }, [location.pathname]);

  const navItems = [
    { key: "dashboard", label: "Intelligence", icon: "📊" },
    { key: "waiters", label: "Staff", icon: "🧑‍🍳" },
    { key: "tables", label: "Floor Plan", icon: "🪑" },
    { key: "menu", label: "Curations", icon: "📋" },
  ];
  return (
    <div className="min-h-screen flex bg-greenleaf-bg font-sans">
      {/* Premium Sidebar - Fixed approach */}
      <aside className="w-80 bg-greenleaf-primary text-white p-8 hidden md:flex flex-col shadow-2xl fixed top-0 left-0 h-screen z-30 overflow-hidden shrink-0">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl"></div>

        <div className="relative z-10 mb-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-[1rem] bg-greenleaf-secondary/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg">
              <span className="text-2xl">🌿</span>
            </div>
            <div>
              <h2 className="text-xl font-serif font-black tracking-tight">Greenleaf</h2>
              <p className="text-[10px] uppercase tracking-widest font-bold opacity-60 text-greenleaf-secondary">Command Center</p>
            </div>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-greenleaf-secondary flex items-center justify-center font-black text-sm">
                {roleLabel[0]}
              </div>
              <div>
                <p className="text-xs font-black tracking-widest opacity-60 uppercase">{roleLabel}</p>
                <p className="text-sm font-bold">Administrator</p>
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <div
                key={item.key}
                onClick={() => navigate(`/admin/${item.key}`)}
                className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all ${activeSection === item.key
                  ? "bg-white text-greenleaf-primary shadow-floating scale-[1.02]"
                  : "hover:bg-white/10 opacity-70 hover:opacity-100"
                  }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-bold text-sm tracking-wide uppercase">{item.label}</span>
                {activeSection === item.key && (
                  <div className="ml-auto w-1.5 h-1.5 bg-greenleaf-primary rounded-full"></div>
                )}
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-auto relative z-10">
          <button
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/login");
            }}
            className="w-full bg-white/5 hover:bg-red-500/20 border border-white/10 p-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3"
          >
            <span>Termiante Session</span>
            <span>🚪</span>
          </button>
        </div>
      </aside>

      {/* Main Content Hub - Responsive Margin for Fixed Sidebar */}
      <div className="flex-1 flex flex-col md:ml-80 min-h-screen">
        {/* Top Intelligence Bar */}
        <div className="bg-white/80 backdrop-blur-md px-10 py-6 flex justify-between items-center border-b border-greenleaf-accent sticky top-0 z-20">
          <div>
            <h1 className="text-3xl font-serif font-black text-greenleaf-primary capitalize">
              {activeSection}
            </h1>
            <p className="text-[10px] uppercase font-black tracking-widest text-greenleaf-muted mt-1">Operational Overview System • Active</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-greenleaf-bg rounded-xl border border-greenleaf-accent">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-bold text-green-700 tracking-tighter uppercase">System Nominal</span>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-greenleaf-muted tracking-widest">LOCAL TIME</p>
              <p className="text-sm font-bold">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        </div>

        <div className="p-10 bg-greenleaf-bg flex-1">
          <div className="max-w-7xl mx-auto">
            <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
              {activeSection === "dashboard" && <DashboardSection />}
              {activeSection === "waiters" && <WaitersSection />}
              {activeSection === "tables" && <TablesSection />}
              {activeSection === "menu" && <MenuSection />}
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Lato:wght@400;700;900&display=swap');
      `}} />
    </div>
  );
}