
import { useEffect, useState } from "react";
import axios from "axios";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { API_BASE } from "../../services/api";

export default function AdminAnalytics() {
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [range, setRange] = useState("all");
  const [customDates, setCustomDates] = useState({ from: "", to: "" });

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      const headers = { Authorization: `Bearer ${token}` };

      try {
        const [ov, tr, top] = await Promise.all([
          axios.get(`${API_BASE}/analytics/overview?range=${range}&from=${customDates.from}&to=${customDates.to}`, { headers }),
          axios.get(`${API_BASE}/analytics/trends?range=${range}&from=${customDates.from}&to=${customDates.to}`, { headers }),
          axios.get(`${API_BASE}/analytics/popular-items?range=${range}&from=${customDates.from}&to=${customDates.to}`, { headers }),
        ]);

        setOverview(ov.data);
        setTrends(tr.data);
        setTopItems(top.data);
      } catch (err) {
        console.error("Analytics error:", err);
      }
    };

    if (token) fetchData();
  }, [token, range, customDates]);

  if (!overview) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
          <p className="text-slate-400 font-bold tracking-widest text-[10px] uppercase">Processing Data...</p>
        </div>
      </div>
    );
  }

  // Define icon SVGs
  const revenueIcon = (
    <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
  
  const ordersIcon = (
    <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );

  const todayIcon = (
    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );

  const avgOrderIcon = (
    <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );

  return (
    <div className="space-y-8 bg-slate-50 min-h-full font-sans max-w-7xl">
      
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">
            Performance Analytics
          </h1>
          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
            Real-time business intelligence and sales forecasting
          </p>
        </div>

        <div className="flex overflow-x-auto hide-scrollbar items-center gap-1.5 bg-white p-1 rounded-xl shadow-sm border border-gray-200 shrink-0">
          {[
            { id: "all", label: "Overview" },
            { id: "today", label: "Today" },
            { id: "7d", label: "7 Days" },
            { id: "30d", label: "30 Days" },
            { id: "custom", label: "Custom" }
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => {
                setRange(r.id);
                if (r.id !== "custom") setCustomDates({ from: "", to: "" });
              }}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all whitespace-nowrap active:scale-95 ${
                range === r.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {range === "custom" && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex flex-col w-full sm:w-auto">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2 ml-1">Start Date</label>
            <input
              type="date"
              value={customDates.from}
              onChange={(e) => setCustomDates({ ...customDates, from: e.target.value })}
              className="border border-gray-200 bg-slate-50 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all w-full"
            />
          </div>
          <div className="hidden sm:block text-slate-300 mt-6 font-bold">→</div>
          <div className="flex flex-col w-full sm:w-auto">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2 ml-1">End Date</label>
            <input
              type="date"
              value={customDates.to}
              onChange={(e) => setCustomDates({ ...customDates, to: e.target.value })}
              className="border border-gray-200 bg-slate-50 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all w-full"
            />
          </div>
        </div>
      )}
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card title="Gross Revenue" value={`₹${(overview.totalRevenue || 0).toLocaleString()}`} icon={revenueIcon} bg="bg-indigo-50" border="border-indigo-100" />
        <Card title="Total Orders" value={overview.orderCount || 0} icon={ordersIcon} bg="bg-slate-50" border="border-slate-100" />
        <Card title="Today's Sales" value={`₹${(overview.todayRevenue || 0).toLocaleString()}`} icon={todayIcon} bg="bg-emerald-50" border="border-emerald-100" />
        <Card title="Average Ticket" value={`₹${Math.round(overview.avgOrderValue || 0)}`} icon={avgOrderIcon} bg="bg-amber-50" border="border-amber-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          
          {/* Revenue Chart */}
          <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Revenue Trends</h2>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-1">Daily gross performance</p>
              </div>
            </div>

            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} dy={10} minTickGap={20} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    itemStyle={{ color: '#4f46e5', fontWeight: 700, fontSize: '12px' }}
                    cursor={{ stroke: '#4f46e5', strokeWidth: 1 }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Orders Chart */}
          <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Transaction Volume</h2>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-1">Daily order frequency</p>
              </div>
            </div>

            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#64748b" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} dy={10} minTickGap={20} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    itemStyle={{ color: '#64748b', fontWeight: 700, fontSize: '12px' }}
                    cursor={{ stroke: '#64748b', strokeWidth: 1 }}
                  />
                  <Area type="monotone" dataKey="orders" stroke="#64748b" strokeWidth={3} fillOpacity={1} fill="url(#colorOrders)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Top Items */}
        <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-200">
          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Product Ranking</h2>
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-1">High-demand menu assets</p>
          </div>

          <div className="space-y-4">
            {topItems.map((item, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-all border ${
                  i === 0 ? 'bg-amber-50 text-amber-700 border-amber-100 shadow-sm' : 
                  i === 1 ? 'bg-slate-50 text-slate-500 border-slate-100' :
                  i === 2 ? 'bg-orange-50 text-orange-700 border-orange-100' :
                  'bg-slate-50 text-slate-400 border-gray-100'
                }`}>
                  {i + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-700 truncate group-hover:text-brand-primary transition-colors">
                    {item._id?.name || item._id}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/5 px-2.5 py-1 rounded-md border border-brand-primary/10 group-hover:bg-brand-primary group-hover:text-white transition-all">
                    {item.count} <span className="text-[8px] uppercase font-bold opacity-60 ml-0.5">Sold</span>
                  </span>
                </div>
              </div>
            ))}
            
            {topItems.length === 0 && (
              <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-gray-100">
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Insufficent Data</p>
              </div>
            )}
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
             <p className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Live Analytics Feed</p>
          </div>
        </div>

      </div>
      
      <style dangerouslySetInnerHTML={{
        __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}

function Card({ title, value, icon, bg, border }) {
  return (
    <div className={`relative bg-white border ${border} rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group overflow-hidden`}>
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-40 transition-opacity group-hover:opacity-60 ${bg}`}></div>
      
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bg} border border-white/50 shadow-sm transition-transform group-hover:scale-110`}>
            {icon}
          </div>
          <div className="flex items-center gap-1">
             <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
             <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Active</span>
          </div>
        </div>

        <div>
           <p className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
            {value}
          </h3>
        </div>
      </div>
    </div>
  );
}