import { useState, useEffect } from "react";
import { fetchSettings } from "../../services/api";
import { 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Crown, 
  Zap, 
  ShieldCheck,
  ChevronRight,
  Receipt,
  HelpCircle
} from "lucide-react";

export default function SubscriptionSection() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const settings = await fetchSettings();
      setData(settings);
    } catch (err) {
      console.error("Failed to load subscription data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const status = data?.subscriptionStatus || "ACTIVE";
  const isTrial = data?.trialEndsAt && new Date(data.trialEndsAt) > new Date();
  
  const getStatusColor = (status) => {
    switch (status) {
      case "ACTIVE": return "text-emerald-500 bg-emerald-50 border-emerald-100";
      case "PAST_DUE": return "text-amber-500 bg-amber-50 border-amber-100";
      case "CANCELLED": return "text-rose-500 bg-rose-50 border-rose-100";
      default: return "text-slate-500 bg-slate-50 border-slate-100";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "ACTIVE": return <CheckCircle2 size={16} />;
      case "PAST_DUE": return <AlertCircle size={16} />;
      case "CANCELLED": return <AlertCircle size={16} />;
      default: return <ShieldCheck size={16} />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Subscription Management</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
            <ShieldCheck size={12} className="text-brand-primary" />
            Manage your service plan, billing cycles and platform features
          </p>
        </div>
        <div className={`flex items-center gap-2.5 px-4 py-2 rounded-full border shadow-sm font-bold text-[10px] uppercase tracking-widest ${getStatusColor(status)}`}>
          {getStatusIcon(status)}
          {status.replace('_', ' ')}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current Plan Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group">
            <div className="bg-slate-900 p-8 text-white relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/20 blur-[60px] -translate-x-4 -translate-y-4 rounded-full"></div>
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Current Tier</p>
                  <h3 className="text-4xl font-black tracking-tighter flex items-center gap-3">
                    {isTrial ? "Professional Trial" : "Enterprise Pro"}
                    <Crown className="text-amber-400" size={28} />
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black tracking-tight">₹4,999<span className="text-sm font-normal text-slate-400">/mo</span></p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Next Billing: May 12, 2026</p>
                </div>
              </div>

              <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-emerald-400">
                    <Zap size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-500">Unlimited</p>
                    <p className="text-xs font-bold">Orders / Month</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-indigo-400">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-500">Active Since</p>
                    <p className="text-xs font-bold">
                      {data?.createdAt ? new Date(data.createdAt).toLocaleDateString() : "Feb 2026"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 col-span-2 md:col-span-1">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-amber-400">
                    <CreditCard size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-500">Payment Method</p>
                    <p className="text-xs font-bold">•••• 4242 (VISA)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-4 px-6 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-slate-900/10 active:scale-[0.98] flex items-center justify-center gap-2">
                  Renew Subscription
                  <ChevronRight size={14} />
                </button>
                <button className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 py-4 px-6 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-sm active:scale-[0.98]">
                  Download Last Invoice
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 group hover:border-brand-primary/30 transition-all cursor-default">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Receipt size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Billing History</h4>
                <p className="text-[11px] text-slate-500 font-medium">Review and download all past transactions</p>
              </div>
              <ChevronRight className="ml-auto text-slate-300" size={18} />
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 group hover:border-brand-primary/30 transition-all cursor-default">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Active Licenses</h4>
                <p className="text-[11px] text-slate-500 font-medium">Manage waiter terminals and kitchen units</p>
              </div>
              <ChevronRight className="ml-auto text-slate-300" size={18} />
            </div>
          </div>
        </div>

        {/* Sidebar Help / Info */}
        <div className="space-y-6">
          <div className="bg-brand-primary/5 rounded-2xl p-8 border border-brand-primary/10 relative overflow-hidden">
            <div className="absolute -bottom-4 -right-4 text-brand-primary/5">
              <HelpCircle size={120} strokeWidth={1} />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <HelpCircle size={16} className="text-brand-primary" />
              Need Assistance?
            </h4>
            <p className="text-xs leading-relaxed text-slate-600 font-medium mb-6">
              Our support engineers are available 24/7 to help you with billing issues or custom feature requests.
            </p>
            <button className="w-full bg-white text-brand-primary border border-brand-primary/20 py-3 rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-sm hover:bg-brand-primary hover:text-white transition-all">
              Contact Support
            </button>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Subscription Benefits</h4>
            <ul className="space-y-4">
              {[
                "Advanced Sales Analytics",
                "Unlimited Staff Accounts",
                "Digital Menu QR Generator",
                "Kitchen Order System",
                "Table Reservation Portal",
                "Customer Feedback Engine"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-xs font-bold text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-primary/50"></div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
