import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../../services/api";
import { formatPrice } from "../../utils/formatCurrency";

export default function DashboardSection({ settings }) {
  const [restaurant, setRestaurant] = useState(null);
  const [stats, setStats] = useState(null);
  const [popularItems, setPopularItems] = useState([]);
  const [operational, setOperational] = useState(null);
  const [ratings, setRatings] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const payload = token ? JSON.parse(atob(token.split(".")[1])) : null;
  const restaurantId = payload?.restaurantId;

  useEffect(() => {
    if (restaurantId) {
      fetchAllData();
    }
  }, [restaurantId]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [restRes, statsRes, popularRes, operationalRes, ratingRes] = await Promise.all([
        axios.get(`${API_BASE}/restaurants`, { headers }),
        axios.get(`${API_BASE}/analytics/overview`, { headers }),
        axios.get(`${API_BASE}/analytics/popular-items`, { headers }),
        axios.get(`${API_BASE}/analytics/operational`, { headers }),
        axios.get(`${API_BASE}/ratings/${restaurantId}`)
      ]);

      const restaurantData = restRes.data?.data?.find((r) => r._id === restaurantId);
      setRestaurant(restaurantData || null);
      setStats(statsRes.data);
      setPopularItems(popularRes.data);
      setOperational(operationalRes.data);
      setRatings(ratingRes.data);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  const clearAllOrders = async () => {
    if (!window.confirm("ARE YOU SURE? This will permanently DELETE all orders for this restaurant! This cannot be undone.")) return;
    try {
      await axios.post(`${API_BASE}/orders/clear-all`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("All orders have been cleared successfully.");
      fetchAllData();
    } catch (err) {
      alert("Failed to clear orders: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading || !restaurant) {
    return (
      <div className="bg-white rounded-xl p-12 shadow-sm flex flex-col items-center justify-center border border-gray-100">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium text-sm">Syncing Dashboard Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-slate-50">
      {/* Restaurant Header Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 lg:p-10 shadow-sm border border-gray-200 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Business Profile</p>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                {restaurant.name}
              </h2>
            </div>
            <span className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${restaurant.subscriptionStatus === 'active' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
              }`}>
              {restaurant.subscriptionStatus} Subscription
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-slate-50 rounded-xl border border-gray-100">
            <div>
              <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-1.5">Restaurant ID</p>
              <p className="font-mono text-xs font-medium text-slate-600 truncate">{restaurant._id}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-1.5">Public Access</p>
              <p className="text-sm font-semibold text-brand-primary truncate">{restaurant.domain}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-1.5">Operating Currency</p>
              <p className="text-sm font-semibold text-slate-700">{restaurant.currency || 'INR'}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={() => navigate("/admin/menu")}
              className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-all shadow-sm active:scale-[0.98]"
            >
              Manage Menu
            </button>
            <button
              onClick={() => window.open(`${window.location.origin}/menu/${restaurant._id}`, '_blank')}
              className="bg-white border border-gray-200 text-slate-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-all shadow-sm active:scale-[0.98]"
            >
              Public Preview
            </button>
            <button
              onClick={clearAllOrders}
              className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-all active:scale-[0.98] sm:ml-auto"
            >
              Purge All Orders
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Revenue", val: formatPrice(stats?.totalRevenue || 0, settings?.currency || restaurant.currency), sub: "Lifetime" },
          { label: "Total Orders", val: stats?.orderCount || 0, sub: "Processed" },
          { label: "Today's Sales", val: formatPrice(stats?.todayRevenue || 0, settings?.currency || restaurant.currency), sub: `${stats?.todayOrderCount || 0} orders` },
          { label: "Avg Ticket", val: formatPrice(stats?.avgOrderValue || 0, settings?.currency || restaurant.currency), sub: "Per Order" },
          { label: "Avg Rating", val: `${ratings?.avgRating ? ratings.avgRating.toFixed(1) : "0.0"} ⭐`, sub: `${ratings?.total || 0} reviews` }
        ].map((m, i) => (
          <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">{m.label}</p>
            <p className="text-xl font-bold text-slate-900">{m.val}</p>
            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{m.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Items */}
        <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Top Performing Items</h3>
            <span className="text-[9px] font-bold bg-slate-50 text-slate-500 border border-slate-100 px-2 py-1 rounded uppercase">Performance Data</span>
          </div>
          <div className="space-y-3">
            {popularItems.length > 0 ? (
              popularItems.map((item, idx) => (
                <div key={item._id} className="flex items-center justify-between p-4 bg-slate-50 border border-gray-100 rounded-xl hover:border-brand-primary/20 transition-all">
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-xs font-bold border border-gray-200 text-slate-600 shadow-sm">{idx + 1}</span>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{item.name || item._id || "Item"}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {(item.quantitySold ?? item.count ?? 0)} Sold
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    {formatPrice(item.revenue ?? 0, settings?.currency || restaurant.currency)}
                  </p>
                </div>
              ))
            ) : (
              <div className="py-12 text-center">
                <p className="text-slate-400 text-sm font-medium italic">No sales data recorded yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Operational Flow */}
        <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">System Status</h3>
            <span className="text-[9px] font-bold bg-slate-50 text-slate-500 border border-slate-100 px-2 py-1 rounded uppercase">Live Feed</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-slate-50 border border-gray-100 rounded-xl">
              <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mb-4">Traffic Origins</p>
              <div className="space-y-3">
                {operational?.sources.map((s) => (
                  <div key={s._id} className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-600">{s._id} Access</span>
                    <span className="text-[11px] font-bold text-brand-primary">{s.count}</span>
                  </div>
                ))}
                {(!operational || operational.sources.length === 0) && <p className="text-[10px] text-slate-400 italic">No access data</p>}
              </div>
            </div>
            <div className="p-5 bg-slate-50 border border-gray-100 rounded-xl">
              <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mb-4">Order Pipeline</p>
              <div className="space-y-3">
                {operational?.statuses.map((s) => (
                  <div key={s._id} className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-600 capitalize">{s._id.replace('_', ' ').toLowerCase()}</span>
                    <span className="text-[11px] font-bold text-brand-primary">{s.count}</span>
                  </div>
                ))}
                {(!operational || operational.statuses.length === 0) && <p className="text-[10px] text-slate-400 italic">No active orders</p>}
              </div>
            </div>
          </div>
          <div className="mt-8 p-4 bg-slate-900 rounded-xl">
            <p className="text-[10px] font-medium text-slate-400 italic">System Integrity: Nominal. Metrics are updated in real-time based on active transaction clusters.</p>
          </div>
        </div>
      </div>
    </div>
  );
}