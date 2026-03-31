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
    if (!token) return "Admin";
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role?.toUpperCase() || "ADMIN";
  } catch {
    return "ADMIN";
  }
};

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const location = useLocation();
  const roleLabel = getRoleFromToken();

  const getAdminLabel = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return "Administrator";

      const payload = JSON.parse(atob(token.split(".")[1]));

      if (payload.isMainAdmin === true || payload.isMainAdmin === "true" || payload.role === "mainadmin") {
        return "Main Administrator";
      }

      if (payload.role === "admin") {
        return "Secondary Administrator";
      }

      return "Administrator";
    } catch {
      return "Administrator";
    }
  };

  const adminLabel = getAdminLabel();
  const [settings, setSettings] = useState(null);

  const loadSettings = () => {
    fetchSettings().then(data => {
      if (data) setSettings(data);
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

  useEffect(() => {
    const pathSection = location.pathname.split("/")[2] || "dashboard";
    setActiveSection(pathSection);
  }, [location.pathname]);

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

  const dynamicStyles = settings ? {
    "--color-primary": settings.themeColor || "#105c38",
    "--font-heading": `"${settings.font || "Playfair Display"}", serif`,
    "--font-main": `"${settings.font || "Lato"}", sans-serif`
  } : {};

  return (
    <div className="min-h-screen flex bg-greenleaf-bg font-sans" style={dynamicStyles}>
      {/* Premium Sidebar - Fixed approach */}
      <aside className="w-72 lg:w-80 bg-greenleaf-primary text-white p-6 lg:p-8 hidden sm:flex flex-col justify-between shadow-2xl fixed top-0 left-0 h-screen z-30 shrink-0">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl"></div>

        <div className="relative z-10 mb-6 overflow-y-auto pr-1">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-[1rem] bg-greenleaf-secondary/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg overflow-hidden">
              {settings?.logo ? (
                <img
                  src={settings.logo}
                  alt="Logo"
                  className="w-full h-full object-contain p-2 max-w-[80%] max-h-[80%] mx-auto"
                />
              ) : (
                <span className="text-2xl">🌿</span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-serif font-black tracking-tight">{settings?.name || "Greenleaf"}</h2>
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
                <p className="text-sm font-bold">{adminLabel}</p>
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

        <div className="mt-4 sm:mt-6 relative z-10 mb-6">
          <button
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/login");
            }}
            className="w-full bg-white/5 hover:bg-red-500/20 border border-white/10 p-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3"
          >
            <span>Logout</span>
            <span>🚪</span>
          </button>
        </div>
      </aside>

      {/* Main Content Hub - Responsive Margin for Fixed Sidebar */}
      <div className="flex-1 flex flex-col sm:ml-72 lg:ml-80 min-h-screen">
        {/* Top Intelligence Bar */}
        <div className="bg-white/80 backdrop-blur-md px-4 sm:px-6 lg:px-10 py-4 lg:py-6 flex justify-between items-center border-b border-greenleaf-accent sticky top-0 z-20">
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
              <p className="text-sm font-bold">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-10 bg-greenleaf-bg flex-1">
          <div className="max-w-7xl mx-auto">
            <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
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

      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Lato:wght@400;700;900&display=swap');
      `}} />
    </div>
  );
}