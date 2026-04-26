import { useState, useEffect } from "react";
import { fetchSettings, updateSettings } from "../../services/api";

export default function SettingsSection({ onSettingsSaved }) {
  const [settings, setSettings] = useState({
    name: "Enterprise Restaurant",
    themeColor: "#4f46e5",
    font: "Inter",
    logo: "",
    currency: "INR",
    customCurrency: "",
    features: {
      onlinePayment: true,
      cashPayment: true,
      waiterCall: true,
      ratings: false,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await fetchSettings();
      if (data) {
        setSettings({
          name: data.name || "Enterprise Restaurant",
          themeColor: data.themeColor || "#4f46e5",
          font: data.font || "Inter",
          logo: data.logo || "",
          currency: ["INR","USD","EUR","GBP","AED","SAR"].includes(data.currency) ? data.currency : "CUSTOM",
          customCurrency: ["INR","USD","EUR","GBP","AED","SAR"].includes(data.currency) ? "" : (data.currency || ""),
          features: {
            onlinePayment: data.features?.onlinePayment ?? true,
            cashPayment: data.features?.cashPayment ?? true,
            waiterCall: data.features?.waiterCall ?? true,
            ratings: data.features?.ratings ?? false,
          },
        });
      }
    } catch (err) {
      console.error("Settings load error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        name: settings.name,
        themeColor: settings.themeColor,
        font: settings.font,
        logo: settings.logo,
        currency: settings.currency === "CUSTOM" ? settings.customCurrency : settings.currency,
        features: settings.features
      };

      await updateSettings(payload);
      if (onSettingsSaved) onSettingsSaved();
      alert("System configuration updated successfully.");
    } catch (err) {
      console.error("Settings update error:", err);
      alert("Failed to save configuration. Please check your connection.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleFeatureToggle = (feature) => {
    setSettings((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: !prev.features[feature],
      },
    }));
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const dynamicStyles = {
    "--color-primary": settings.themeColor,
    "--font-heading": `"${settings.font}", sans-serif`,
    "--font-main": `"${settings.font}", sans-serif`
  };

  return (
    <div className="space-y-6 bg-slate-50 max-w-4xl mx-auto pb-16 px-2 sm:px-4 rounded-2xl" style={dynamicStyles}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Configuration</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Core business settings and application feature controls
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-lg shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
        >
          {isSaving ? "Synchronizing..." : "Update Settings"}
          {!isSaving && <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brand Identity Card */}
        <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-widest">
            <span className="p-1.5 bg-slate-100 rounded-md">🎨</span> Brand Identity
          </h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Restaurant Name</label>
              <input
                type="text"
                name="name"
                value={settings.name}
                onChange={handleChange}
                placeholder="Enterprise Dining"
                className="w-full p-3 bg-slate-50 border border-gray-200 rounded-lg text-lg font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
              />
            </div>
          
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Brand Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    name="themeColor"
                    value={settings.themeColor}
                    onChange={handleChange}
                    className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-100 bg-white p-1"
                  />
                  <input
                    type="text"
                    name="themeColor"
                    value={settings.themeColor}
                    onChange={handleChange}
                    className="flex-1 p-2.5 bg-slate-50 border border-gray-200 rounded-lg font-mono text-xs uppercase focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Currency System</label>
                <select
                  name="currency"
                  value={settings.currency}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border border-gray-200 rounded-lg text-sm font-bold text-slate-700 focus:bg-white outline-none"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="AED">AED (د.إ)</option>
                  <option value="SAR">SAR (﷼)</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>
            </div>

            {settings.currency === "CUSTOM" && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Custom Symbol</label>
                <input
                  type="text"
                  name="customCurrency"
                  value={settings.customCurrency}
                  placeholder="Enter symbol (e.g. ₹)"
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, customCurrency: e.target.value }))
                  }
                  className="w-full p-3 bg-slate-50 border border-gray-200 rounded-lg text-sm focus:bg-white outline-none uppercase"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Interface Typography</label>
              <select
                name="font"
                value={settings.font}
                onChange={handleChange}
                className="w-full p-3 bg-slate-50 border border-gray-200 rounded-lg text-sm font-bold text-slate-700 focus:bg-white outline-none"
              >
                <option value="Inter">Modern Sans (Inter)</option>
                <option value="Roboto">Clean Minimal (Roboto)</option>
                <option value="Lato">Professional (Lato)</option>
                <option value="Poppins">Geometric (Poppins)</option>
                <option value="Montserrat">Bold Modern (Montserrat)</option>
                <option value="Open Sans">High Readability (Open Sans)</option>
                <option value="Raleway">Elegant (Raleway)</option>
                <option value="Nunito">Soft Modern (Nunito)</option>
                <option value="Oswald">Condensed (Oswald)</option>
                <option value="DM Sans">Minimalist (DM Sans)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Brand Asset (Logo URL)</label>
              <input
                type="text"
                name="logo"
                value={settings.logo}
                onChange={handleChange}
                placeholder="https://example.com/logo.png"
                className="w-full p-3 bg-slate-50 border border-gray-200 rounded-lg text-xs focus:bg-white outline-none"
              />
              {settings.logo && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-gray-100 flex justify-center">
                  <img src={settings.logo} alt="Logo preview" className="h-10 object-contain grayscale opacity-70" onError={(e) => e.target.style.display='none'} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Features Card */}
        <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-widest">
            <span className="p-1.5 bg-slate-100 rounded-md">⚙️</span> System Capabilities
          </h3>

          <div className="space-y-4">
            {[
              { id: "onlinePayment", label: "Online Transactions", desc: "Enable Razorpay / UPI payments", icon: "💳" },
              { id: "cashPayment", label: "Cash on Delivery", desc: "Allow settling bills with cash", icon: "💵" },
              { id: "waiterCall", label: "Service Request", desc: "Digital 'Call Waiter' button for guests", icon: "🛎️" },
              { id: "ratings", label: "Customer Feedback", desc: "Post-order rating and review widget", icon: "⭐" },
            ].map((feat) => (
              <div
                key={feat.id}
                onClick={() => handleFeatureToggle(feat.id)}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-brand-primary/20 hover:bg-slate-50 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-lg shadow-sm border border-gray-100 group-hover:bg-white transition-colors">
                    {feat.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{feat.label}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{feat.desc}</p>
                  </div>
                </div>
                <div className={`w-11 h-6 rounded-full transition-all flex items-center px-1 shrink-0 ${settings.features[feat.id] ? "bg-slate-900" : "bg-slate-200"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings.features[feat.id] ? "translate-x-5" : "translate-x-0"}`}></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-dashed border-gray-100">
            <div className="bg-slate-900 rounded-xl p-5 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Technical Insight</p>
              <p className="text-[11px] leading-relaxed text-slate-300 font-medium italic">
                Updating these settings will synchronize the interface across all customer devices and operational terminals in real-time.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .animate-in { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}
