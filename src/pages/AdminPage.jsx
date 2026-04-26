import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchSettings } from "../services/api";
import DashboardSection from "../components/admin/DashboardSection";
import WaitersSection from "../components/admin/WaitersSection";
import TablesSection from "../components/admin/TablesSection";
import MenuSection from "../components/admin/MenuSection";
import CashierSection from "../components/admin/CashierSection";
import SettingsSection from "../components/admin/SettingsSection";
import StaffSection from "../components/admin/StaffSection";
import AnalyticsSection from "../components/admin/AnalyticsSection";

const getRoleFromToken = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return "User";
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role?.toUpperCase() || "ADMIN";
  } catch {
    return "ADMIN";
  }
};

export default function AdminPage() {
  const location = useLocation();
  const activeSection = location.pathname.split("/")[2] || "dashboard";
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const roleLabel = getRoleFromToken();

  const getAdminLabel = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return "Admin User";

      const payload = JSON.parse(atob(token.split(".")[1]));

      if (payload.isMainAdmin === true || payload.isMainAdmin === "true" || payload.role === "mainadmin") {
        return "Main Administrator";
      }

      if (payload.role === "admin") {
        return "Secondary Administrator";
      }

      return "Admin User";
    } catch {
      return "Admin User";
    }
  };

  const adminLabel = getAdminLabel();
  const [settings, setSettings] = useState(null);

  const loadSettings = () => {
    fetchSettings().then(data => {
      if (data) {
        setSettings(data);
        const root = document.documentElement;
        root.style.setProperty("--color-primary", data.themeColor || "#4f46e5");
        root.style.setProperty("--font-main", data.font || "Inter");
        root.style.setProperty("--font-heading", data.font || "Inter");
      }
    }).catch(console.error);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);


  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: "📊" },
    { key: "analytics", label: "Analytics", icon: "📈" },
    { key: "cashier", label: "Cashier", icon: "💰" },
    { key: "staff", label: "Staff", icon: "👥" },
    { key: "waiters", label: "Waiters", icon: "🧑‍🍳" },
    { key: "tables", label: "Floor Plan", icon: "🪑" },
    { key: "menu", label: "Menu", icon: "📋" },
    { key: "settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      {/* Professional Sidebar */}
      <aside className="w-72 lg:w-80 bg-slate-900 text-white p-6 lg:p-8 hidden sm:flex flex-col justify-between shadow-xl fixed top-0 left-0 h-screen z-30 shrink-0">
        <div className="relative z-10 mb-6 overflow-y-auto pr-1">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 rounded-lg bg-brand-primary flex items-center justify-center shadow-lg overflow-hidden shrink-0">
              {settings?.logo ? (
                <img
                  src={settings.logo}
                  alt="Logo"
                  className="w-full h-full object-contain p-1.5"
                />
              ) : (
                <span className="text-xl">🏪</span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight leading-tight">{settings?.name || "Restaurant OS"}</h2>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-0.5">Admin Portal</p>
            </div>
          </div>

          <div className="p-4 bg-white/5 rounded-xl border border-white/10 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-primary flex items-center justify-center font-bold text-sm shadow-sm text-white">
                {roleLabel[0]}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase truncate">{roleLabel}</p>
                <p className="text-sm font-medium text-white truncate">{adminLabel.split(' ')[0]}</p>
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <div
                key={item.key}
                onClick={() => navigate(`/admin/${item.key}`)}
                className={`flex items-center gap-3.5 p-3.5 rounded-lg cursor-pointer transition-all ${activeSection === item.key
                  ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
              >
                <span className="text-lg opacity-80">{item.icon}</span>
                <span className="font-bold text-xs tracking-wider uppercase">{item.label}</span>
                {activeSection === item.key && (
                  <div className="ml-auto w-1 h-1 bg-white rounded-full"></div>
                )}
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-4 sm:mt-6 relative z-10 mb-4">
          <button
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/login");
            }}
            className="w-full bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-slate-400 p-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white/5"
          >
            <span>Sign Out</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4-4v14" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main Content Hub */}
      <div className="flex-1 flex flex-col sm:ml-72 lg:ml-80 min-h-screen">
        {/* Top Header */}
        <div className="bg-white px-6 sm:px-8 lg:px-12 py-5 flex justify-between items-center border-b border-gray-200 sticky top-0 z-20">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 capitalize tracking-tight">
              {activeSection}
            </h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-0.5">Management System • Live Status</p>
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-gray-100">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">System Online</span>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Local Time</p>
              <p className="text-sm font-bold text-slate-700">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 lg:p-12 bg-slate-50 flex-1">
          <div className="max-w-7xl mx-auto">
            <div className="animate-in fade-in duration-500">
              {activeSection === "dashboard" && <DashboardSection settings={settings} />}
              {activeSection === "analytics" && <AnalyticsSection />}
              {activeSection === "staff" && <StaffSection />}
              {activeSection === "waiters" && <WaitersSection settings={settings} />}
              {activeSection === "tables" && <TablesSection settings={settings} />}
              {activeSection === "cashier" && <CashierSection settings={settings} />}
              {activeSection === "menu" && <MenuSection settings={settings} />}
              {activeSection === "settings" && <SettingsSection onSettingsSaved={loadSettings} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}