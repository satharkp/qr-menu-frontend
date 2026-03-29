import { useState, useEffect } from "react";
import { fetchSettings, updateSettings } from "../../services/api";

export default function SettingsSection({ onSettingsSaved }) {
  const [settings, setSettings] = useState({
    name: "Greenleaf Dining",
    themeColor: "#10b981",
    font: "Playfair Display",
    logo: "",
    currency: "INR",
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
          name: data.name || "Greenleaf Dining",
          themeColor: data.themeColor || "#10b981",
          font: data.font || "Playfair Display",
          logo: data.logo || "",
          currency: data.currency || "INR",
          features: {
            onlinePayment: data.features?.onlinePayment ?? true,
            cashPayment: data.features?.cashPayment ?? true,
            waiterCall: data.features?.waiterCall ?? true,
            ratings: data.features?.ratings ?? false,
          },
        });
      }
    } catch (error) {
      alert("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings(settings);
      if (onSettingsSaved) onSettingsSaved();
      alert("Settings updated successfully!");
    } catch (error) {
      alert("Failed to update settings");
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
        <div className="w-12 h-12 border-4 border-greenleaf-secondary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const dynamicStyles = {
    "--color-primary": settings.themeColor,
    "--font-heading": `"${settings.font}", serif`,
    "--font-main": `"${settings.font}", sans-serif`
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto pb-16 sm:pb-20 px-2 sm:px-0" style={dynamicStyles}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif font-black text-greenleaf-primary">Restaurant Configuration</h2>
          <p className="text-sm font-medium text-greenleaf-muted mt-1">
            Manage your brand identity, currency, and core application features.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full sm:w-auto bg-greenleaf-primary hover:bg-greenleaf-secondary text-white font-bold py-2 sm:py-3 px-4 sm:px-8 rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSaving ? "Saving..." : "Save Configuration"}
          {!isSaving && <span>✓</span>}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Brand Identity Card */}
        <div className="bg-white p-4 sm:p-6 rounded-[1.5rem] sm:rounded-3xl shadow-soft border border-greenleaf-accent">
          <h3 className="text-lg font-bold text-greenleaf-primary mb-4 flex items-center gap-2">
            <span>🎨</span> Brand Identity
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-greenleaf-muted mb-2">Restaurant Name</label>
              <input
                type="text"
                name="name"
                value={settings.name}
                onChange={handleChange}
                placeholder="Greenleaf Dining"
                className="w-full p-2 sm:p-3 bg-greenleaf-bg border border-greenleaf-accent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-greenleaf-primary transition-all font-serif font-bold text-lg"
              />
            </div>
          
            <div>
              <label className="block text-sm font-bold text-greenleaf-muted mb-2">Theme Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="themeColor"
                  value={settings.themeColor}
                  onChange={handleChange}
                  className="w-12 h-12 rounded-xl cursor-pointer border-0 bg-transparent p-0"
                />
                <input
                  type="text"
                  name="themeColor"
                  value={settings.themeColor}
                  onChange={handleChange}
                  className="flex-1 p-2 sm:p-3 bg-greenleaf-bg border border-greenleaf-accent rounded-xl font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-greenleaf-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-greenleaf-muted mb-2">Typography</label>
              <select
                name="font"
                value={settings.font}
                onChange={handleChange}
                className="w-full p-2 sm:p-3 bg-greenleaf-bg border border-greenleaf-accent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-greenleaf-primary transition-all font-sans"
              >
                <option value="Playfair Display">Classic Serif (Playfair Display)</option>
                <option value="Inter">Modern Sans (Inter)</option>
                <option value="Roboto">Clean Minimal (Roboto)</option>
                <option value="Lato">Friendly Humanist (Lato)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-greenleaf-muted mb-2">Logo URL</label>
              <input
                type="text"
                name="logo"
                value={settings.logo}
                onChange={handleChange}
                placeholder="https://example.com/logo.png"
                className="w-full p-2 sm:p-3 bg-greenleaf-bg border border-greenleaf-accent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-greenleaf-primary transition-all"
              />
              {settings.logo && (
                <div className="mt-4 p-4 bg-greenleaf-bg rounded-xl border border-greenleaf-accent flex justify-center">
                  <img src={settings.logo} alt="Restaurant Logo preview" className="h-12 sm:h-16 object-contain" onError={(e) => e.target.style.display='none'} />
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-bold text-greenleaf-muted mb-2">Currency Symbol or Code</label>
              <input
                type="text"
                name="currency"
                value={settings.currency}
                onChange={handleChange}
                placeholder="INR, $, €, etc."
                className="w-full p-2 sm:p-3 bg-greenleaf-bg border border-greenleaf-accent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-greenleaf-primary transition-all uppercase"
              />
            </div>
          </div>
        </div>

        {/* Features Card */}
        <div className="bg-white p-4 sm:p-6 rounded-[1.5rem] sm:rounded-3xl shadow-soft border border-greenleaf-accent">
          <h3 className="text-lg font-bold text-greenleaf-primary mb-4 flex items-center gap-2">
            <span>⚙️</span> Operational Features
          </h3>
          
          <div className="space-y-4">
            <FeatureToggle 
              title="Online Payments" 
              description="Allow customers to pay via Razorpay."
              isActive={settings.features.onlinePayment} 
              onToggle={() => handleFeatureToggle("onlinePayment")} 
            />
            
            <FeatureToggle 
              title="Cash Payments" 
              description="Allow customers to place orders without immediate digital payment."
              isActive={settings.features.cashPayment} 
              onToggle={() => handleFeatureToggle("cashPayment")} 
            />
            
            <FeatureToggle 
              title="Waiter Call System" 
              description="Enable the 'Call Waiter' button on the menu page."
              isActive={settings.features.waiterCall} 
              onToggle={() => handleFeatureToggle("waiterCall")} 
            />
            
            <FeatureToggle 
              title="Customer Ratings" 
              description="Allow customers to leave a rating/review after their dinner."
              isActive={settings.features.ratings} 
              onToggle={() => handleFeatureToggle("ratings")} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureToggle({ title, description, isActive, onToggle }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-greenleaf-bg rounded-2xl border border-greenleaf-accent transition-all hover:border-greenleaf-secondary">
      <div className="pr-0 sm:pr-4">
        <p className="font-bold text-greenleaf-primary text-sm">{title}</p>
        <p className="text-[10px] text-greenleaf-muted mt-1 leading-relaxed">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`w-14 sm:w-12 h-7 sm:h-6 flex shrink-0 items-center rounded-full p-1 transition-colors duration-300 ease-in-out ${
          isActive ? "bg-greenleaf-secondary" : "bg-gray-300"
        }`}
      >
        <div
          className={`bg-white w-5 sm:w-4 h-5 sm:h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
            isActive ? "translate-x-6" : "translate-x-0"
          }`}
        ></div>
      </button>
    </div>
  );
}
