import Navbar from "./Navbar";
import { useEffect } from "react";
import { fetchSettings } from "../../services/api";

export default function DashboardLayout({ title, children, hideNavbar = false }) {
  useEffect(() => {
    fetchSettings().then(data => {
      if (data) {
        const root = document.documentElement;
        root.style.setProperty("--color-primary", data.themeColor || "#4f46e5");
        root.style.setProperty("--font-main", data.font || "Inter");
        root.style.setProperty("--font-heading", data.font || "Inter");
      }
    }).catch(console.error);
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen selection:bg-brand-primary/10">
      {!hideNavbar && <Navbar title={title} />}
      <main className={`${hideNavbar ? "p-0" : "p-4 md:p-8 lg:p-12"} animate-in fade-in duration-700`}>
        {children}
      </main>
    </div>
  );
}