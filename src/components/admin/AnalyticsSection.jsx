/* eslint-disable react/prop-types */
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
      <div className="flex h-screen items-center justify-center bg-greenleaf-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-greenleaf-primary border-t-transparent shadow-sm"></div>
          <p className="text-greenleaf-primary font-serif font-black tracking-widest text-sm uppercase">Loading Insights</p>
        </div>
      </div>
    );
  }

  // Define icon SVGs
  const revenueIcon = (
    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
  
  const ordersIcon = (
    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );

  const todayIcon = (
    <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );

  const avgOrderIcon = (
    <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );

  return (
    <div className="p-4 md:p-8 lg:p-10 space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-greenleaf-bg min-h-full font-sans max-w-7xl mx-auto">
      
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-black text-greenleaf-text tracking-tight mb-2">
            Intelligence Center
          </h1>
          <p className="text-[10px] md:text-xs uppercase tracking-[0.15em] font-bold text-greenleaf-primary/70">
            Real-time performance metrics
          </p>
        </div>

        <div className="flex overflow-x-auto hide-scrollbar items-center gap-2 bg-white p-1.5 rounded-[1.25rem] shadow-sm border border-greenleaf-accent shrink-0">
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
              className={`px-4 md:px-5 py-2 md:py-2.5 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 whitespace-nowrap active:scale-95 ${
                range === r.id
                  ? "bg-greenleaf-primary text-white shadow-md shadow-greenleaf-primary/20"
                  : "bg-transparent text-greenleaf-muted hover:bg-greenleaf-accent/50 hover:text-greenleaf-text"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {range === "custom" && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-greenleaf-accent shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col w-full sm:w-auto">
            <label className="text-[10px] uppercase font-bold text-greenleaf-muted tracking-widest mb-2">Start Date</label>
            <input
              type="date"
              value={customDates.from}
              onChange={(e) => setCustomDates({ ...customDates, from: e.target.value })}
              className="border border-greenleaf-accent bg-greenleaf-bg rounded-xl px-4 py-2.5 text-sm font-medium text-greenleaf-text focus:outline-none focus:border-greenleaf-primary/50 focus:ring-2 focus:ring-greenleaf-primary/20 transition-all w-full"
            />
          </div>
          <div className="hidden sm:block text-greenleaf-muted mt-6">→</div>
          <div className="flex flex-col w-full sm:w-auto">
            <label className="text-[10px] uppercase font-bold text-greenleaf-muted tracking-widest mb-2">End Date</label>
            <input
              type="date"
              value={customDates.to}
              onChange={(e) => setCustomDates({ ...customDates, to: e.target.value })}
              className="border border-greenleaf-accent bg-greenleaf-bg rounded-xl px-4 py-2.5 text-sm font-medium text-greenleaf-text focus:outline-none focus:border-greenleaf-primary/50 focus:ring-2 focus:ring-greenleaf-primary/20 transition-all w-full"
            />
          </div>
        </div>
      )}
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card title="Total Revenue" value={`₹${(overview.totalRevenue || 0).toLocaleString()}`} icon={revenueIcon} bg="bg-emerald-50" border="border-emerald-100" />
        <Card title="Gross Orders" value={overview.orderCount || 0} icon={ordersIcon} bg="bg-blue-50" border="border-blue-100" />
        <Card title="Today's Revenue" value={`₹${(overview.todayRevenue || 0).toLocaleString()}`} icon={todayIcon} bg="bg-purple-50" border="border-purple-100" />
        <Card title="Average Order" value={`₹${Math.round(overview.avgOrderValue || 0)}`} icon={avgOrderIcon} bg="bg-orange-50" border="border-orange-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          
          {/* Revenue Chart */}
          <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-floating border border-greenleaf-accent relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:opacity-70 transition-opacity duration-700"></div>
            
            <div className="flex justify-between items-center mb-8 relative z-10">
              <div>
                <h2 className="text-xl md:text-2xl font-serif font-black text-greenleaf-text tracking-tight">Revenue Trajectory</h2>
                <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-greenleaf-muted mt-1">Earnings over time</p>
              </div>
            </div>

            <div className="relative z-10 w-full h-[300px] md:h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#105c38" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#105c38" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8F5E9" />
                  <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666' }} dy={10} minTickGap={20} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: '1px solid #E8F5E9', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', padding: '12px 16px' }}
                    itemStyle={{ color: '#105c38', fontWeight: 900 }}
                    cursor={{ stroke: '#105c38', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#105c38" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Orders Chart */}
          <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-floating border border-greenleaf-accent relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:opacity-70 transition-opacity duration-700"></div>
            
            <div className="flex justify-between items-center mb-8 relative z-10">
              <div>
                <h2 className="text-xl md:text-2xl font-serif font-black text-greenleaf-text tracking-tight">Order Volume</h2>
                <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-greenleaf-muted mt-1">Transactions over time</p>
              </div>
            </div>

            <div className="relative z-10 w-full h-[300px] md:h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8F5E9" />
                  <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666' }} dy={10} minTickGap={20} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: '1px solid #E8F5E9', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', padding: '12px 16px' }}
                    itemStyle={{ color: '#3b82f6', fontWeight: 900 }}
                    cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorOrders)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Top Items */}
        <div className="space-y-6 h-full flex flex-col">
          <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-floating border border-greenleaf-accent flex-1">
            <div className="mb-8">
              <h2 className="text-xl md:text-2xl font-serif font-black text-greenleaf-text tracking-tight">Bestsellers</h2>
              <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-greenleaf-muted mt-1">Most popular menu items</p>
            </div>

            <div className="space-y-5">
              {topItems.map((item, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[13px] shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${
                    i === 0 ? 'bg-gradient-to-br from-yellow-200 to-yellow-400 text-yellow-900 shadow-sm border border-yellow-300' : 
                    i === 1 ? 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 shadow-sm border border-slate-300' :
                    i === 2 ? 'bg-gradient-to-br from-orange-100 to-orange-200 text-orange-800 shadow-sm border border-orange-300' :
                    'bg-greenleaf-bg text-greenleaf-muted border border-greenleaf-accent'
                  }`}>
                    #{i + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="text-sm font-bold text-greenleaf-text truncate group-hover:text-greenleaf-primary transition-colors duration-300">
                      {item._id?.name || item._id}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-black text-greenleaf-primary bg-greenleaf-accent/50 px-3.5 py-1.5 rounded-lg border border-greenleaf-accent/70 shadow-sm group-hover:shadow group-hover:bg-greenleaf-primary group-hover:text-white transition-all duration-300">
                      {item.count} <span className="text-[8px] uppercase tracking-widest font-black opacity-60 ml-0.5">sold</span>
                    </p>
                  </div>
                </div>
              ))}
              
              {topItems.length === 0 && (
                <div className="text-center py-16 bg-greenleaf-bg/50 rounded-2xl border border-dashed border-greenleaf-accent">
                  <p className="text-xs uppercase font-bold tracking-widest text-greenleaf-muted">No data available</p>
                  <p className="text-[10px] text-greenleaf-muted mt-2 opacity-60">Try extending the date range</p>
                </div>
              )}
            </div>
            
            {/* Added a decorative bottom element since it's a flex-1 column */}
            <div className="mt-8 pt-6 border-t border-greenleaf-accent/50 text-center">
               <p className="text-[9px] font-black uppercase tracking-[0.2em] text-greenleaf-primary/30">Analytics Engine • Live Data</p>
            </div>
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
    <div className="relative bg-white border border-greenleaf-accent rounded-[2rem] p-6 lg:p-7 shadow-floating hover:shadow-premium hover:-translate-y-1 transition-all duration-500 overflow-hidden group">
      {/* Subtle background glow */}
      <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full blur-3xl opacity-40 transition-opacity duration-700 group-hover:opacity-100 ${bg}`}></div>
      
      <div className="relative z-10 flex flex-col h-full justify-between gap-4">
        <div className="flex justify-between items-start w-full">
          <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center ${bg} ${border} border shadow-sm group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500`}>
            {icon}
          </div>
          <div className="bg-greenleaf-bg px-2 py-1 rounded-md border border-greenleaf-accent flex items-center gap-1">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
             <span className="text-[8px] font-black text-greenleaf-muted uppercase tracking-widest">Live</span>
          </div>
        </div>

        <div>
           <p className="text-[10px] font-black text-greenleaf-muted mb-1.5 uppercase tracking-[0.2em]">
            {title}
          </p>
          <h3 className="text-3xl md:text-4xl font-serif font-black text-greenleaf-text tracking-tight group-hover:text-greenleaf-primary transition-colors duration-500">
            {value}
          </h3>
        </div>
      </div>
    </div>
  );
}