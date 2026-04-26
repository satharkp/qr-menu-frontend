import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { fetchMenuByTable, fetchMenuByRestaurant, SOCKET_URL } from "../services/api";
import RestaurantHeader from "../components/RestaurantHeader";
import MenuCategory from "../components/MenuCategory";
import MenuItem from "../components/MenuItem";
import CartFloating from "../components/CartFloating";
import CallWaiterButton from "../components/customer/CallWaiterButton";
import OrderTracker from "../components/OrderTracker";
import RatingsWidget from "../components/RatingsWidget";


export default function MenuPage() {
  const { tableId, id } = useParams();
  const defaultTableId = "69948b911864d9b24462f4e4";
  const resolvedTableId = id ? null : (tableId || defaultTableId);
  const navigate = useNavigate();
  const [menu, setMenu] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedItemForPortions, setSelectedItemForPortions] = useState(null);

  useEffect(() => {
    const loadMenu = async () => {
      try {
        let data;
        if (id) {
          // If we have 'id' from /menu/:id, it's a restaurant ID
          data = await fetchMenuByRestaurant(id);
        } else {
          // Otherwise it's a table ID from /table/:tableId or default
          const resolvedTableId = tableId || defaultTableId;
          data = await fetchMenuByTable(resolvedTableId);
          localStorage.setItem("lastTableId", resolvedTableId);
        }

        // Normalize API response safely
        const menuItems =
          data?.menu ||
          data?.menuItems ||
          data?.items ||
          [];

        setMenu(Array.isArray(menuItems) ? menuItems : []);
        setRestaurant(data);
      } catch (error) {
        console.error("Failed to load menu", error);
      } finally {
        setLoading(false);
      }
    };
    loadMenu();
  }, [tableId, id]);

  // Socket.io for real-time menu updates
  useEffect(() => {
    if (!restaurant?.restaurantId) return;

    const socket = io(SOCKET_URL);
    socket.emit("joinRestaurant", restaurant.restaurantId);

    socket.on("menu-item-created", (newItem) => {
      if (newItem.available) {
        setMenu((prev) => [...prev, newItem]);
      }
    });

    socket.on("menu-item-updated", (updatedItem) => {
      setMenu((prev) => {
        const exists = prev.find(i => i._id === updatedItem._id);

        if (!updatedItem.available) {
          // keep item but mark unavailable
          return prev.map(i => i._id === updatedItem._id ? updatedItem : i);
        }

        if (exists) {
          return prev.map(i => i._id === updatedItem._id ? updatedItem : i);
        } else {
          return [...prev, updatedItem];
        }
      });
    });

    socket.on("menu-item-deleted", (deletedId) => {
      setMenu((prev) => prev.filter(i => i._id !== deletedId));
    });

    return () => socket.disconnect();
  }, [restaurant?.restaurantId]);

  const increaseQty = (item) => {
    const isPortion = item.measurementType === "PORTION";
    const cartItemId = isPortion ? `${item._id}-${item.selectedPortion?.label}` : item._id;
    const itemPrice = isPortion ? item.selectedPortion?.price : item.price;

    const existing = cart.find((c) =>
      isPortion
        ? (c._id === item._id && c.selectedPortion?.label === item.selectedPortion?.label)
        : c._id === item._id
    );

    if (existing) {
      setCart(
        cart.map((c) =>
          (isPortion
            ? (c._id === item._id && c.selectedPortion?.label === item.selectedPortion?.label)
            : c._id === item._id)
            ? { ...c, quantity: c.quantity + 1 }
            : c
        )
      );
    } else {
      setCart([...cart, { ...item, price: itemPrice, quantity: 1, cartItemId }]);
    }
  };

  const decreaseQty = (item) => {
    const isPortion = item.measurementType === "PORTION";
    const existing = cart.find((c) =>
      isPortion
        ? (c._id === item._id && c.selectedPortion?.label === item.selectedPortion?.label)
        : c._id === item._id
    );

    if (!existing) return;

    if (existing.quantity === 1) {
      setCart(cart.filter((c) =>
        isPortion
          ? !(c._id === item._id && c.selectedPortion?.label === item.selectedPortion?.label)
          : c._id !== item._id
      ));
    } else {
      setCart(
        cart.map((c) =>
          (isPortion
            ? (c._id === item._id && c.selectedPortion?.label === item.selectedPortion?.label)
            : c._id === item._id)
            ? { ...c, quantity: c.quantity - 1 }
            : c
        )
      );
    }
  };

  const getQty = (id, portionLabel = null) => {
    const item = cart.find((c) =>
      portionLabel
        ? (c._id === id && c.selectedPortion?.label === portionLabel)
        : c._id === id
    );
    return item ? item.quantity : 0;
  };

  const total = cart.reduce(
    (sum, item) => sum + (item.price || 0) * item.quantity,
    0
  );

  const placeOrder = () => {
    if (!cart.length) return;

    navigate("/checkout", {
      state: {
        cart,
        total,
        tableId: resolvedTableId,
        settings: restaurant?.settings
      },
    });
  };

  useEffect(() => {
    if (restaurant?.settings) {
      const { settings } = restaurant;
      const root = document.documentElement;
      root.style.setProperty("--color-primary", settings.themeColor || "#4f46e5");
      root.style.setProperty("--font-main", settings.font || "Inter");
      root.style.setProperty("--font-heading", settings.font || "Inter");
    }
  }, [restaurant?.settings]);

  const settings = restaurant?.settings || {};
  const categories = ["All", ...new Set(menu.map((item) => item.category))];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium text-sm">Loading Menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans">
      <RestaurantHeader restaurant={restaurant} tableId={resolvedTableId} />

      <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-20">
        {/* Category Selection */}
        <div className="sticky top-4 z-40 mb-8">
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-lg shadow-sm border text-[11px] uppercase tracking-wider font-bold transition-all active:scale-95 shrink-0 ${activeCategory === cat
                  ? "bg-slate-900 text-white border-slate-900 shadow-md"
                  : "bg-white/90 backdrop-blur-md border-gray-200 text-slate-600 hover:bg-gray-50"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-12 min-h-[50vh]">
          {activeCategory === "All" ? (
            [...new Set(menu.map(m => m.category))].map((cat) => (
              <MenuCategory key={cat} title={cat}>
                {menu
                  .filter((item) => item.category === cat)
                  .sort((a, b) => (b.available === false) - (a.available === false))
                  .map((item) => (
                    <MenuItem
                      key={item._id}
                      item={item}
                      getQty={getQty}
                      onAdd={increaseQty}
                      onRemove={decreaseQty}
                      onOpenPortions={setSelectedItemForPortions}
                      currency={settings.currency || '₹'}
                    />
                  ))}
              </MenuCategory>
            ))
          ) : (
            <MenuCategory title={activeCategory}>
              {menu
                .filter((item) => item.category === activeCategory)
                .sort((a, b) => (b.available === false) - (a.available === false))
                .map((item) => (
                  <MenuItem
                    key={item._id}
                    item={item}
                    getQty={getQty}
                    onAdd={increaseQty}
                    onRemove={decreaseQty}
                    onOpenPortions={setSelectedItemForPortions}
                    currency={settings.currency || '₹'}
                  />
                ))}
            </MenuCategory>
          )}

          {menu.length === 0 && (
            <div className="text-center py-24 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <p className="text-xl text-slate-400 font-medium italic">Our menu is currently being updated.</p>
            </div>
          )}
        </div>
      </div>

      <CartFloating
        cart={cart}
        total={total}
        onPlaceOrder={placeOrder}
        currency={settings.currency || '₹'}
      />

      <OrderTracker
        restaurantId={restaurant?.restaurantId}
        tableNumber={restaurant?.tableNumber}
        currency={settings.currency || '₹'}
        restaurantName={restaurant?.restaurantName}
      />

      {settings?.features?.ratings && <RatingsWidget restaurantId={restaurant?.restaurantId} />}

      {/* Portion Selection Modal */}
      {selectedItemForPortions && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setSelectedItemForPortions(null)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-t-2xl md:rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-20 duration-400">
            <div className="p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Customization</p>
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{selectedItemForPortions.name}</h3>
                </div>
                <button
                  onClick={() => setSelectedItemForPortions(null)}
                  className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors border border-gray-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {selectedItemForPortions.portions?.map((portion, index) => {
                  const portionQty = getQty(selectedItemForPortions._id, portion.label);
                  return (
                    <div key={index} className="flex items-center justify-between bg-slate-50 rounded-xl p-4 border border-gray-100 transition-all hover:border-brand-primary/20">
                      <div>
                        <p className="text-base font-bold text-slate-900">{portion.label}</p>
                        <p className="text-sm text-brand-primary font-bold">{settings.currency || '₹'}{portion.price}</p>
                      </div>

                      {portionQty === 0 ? (
                        <button
                          onClick={() => increaseQty({ ...selectedItemForPortions, selectedPortion: portion })}
                          className="bg-white border border-gray-200 hover:border-brand-primary text-slate-900 px-6 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-sm"
                        >
                          Add +
                        </button>
                      ) : (
                        <div className="flex items-center bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
                          <button
                            onClick={() => decreaseQty({ ...selectedItemForPortions, selectedPortion: portion })}
                            className="w-8 h-8 flex items-center justify-center text-brand-primary font-bold text-lg hover:bg-gray-50 rounded-md transition-colors"
                          >
                            −
                          </button>
                          <span className="mx-4 font-bold text-slate-900 text-sm min-w-[1rem] text-center">
                            {portionQty}
                          </span>
                          <button
                            onClick={() => increaseQty({ ...selectedItemForPortions, selectedPortion: portion })}
                            className="w-8 h-8 flex items-center justify-center bg-brand-primary text-white rounded-md shadow-sm font-bold text-lg"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setSelectedItemForPortions(null)}
                className="w-full mt-8 bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest shadow-sm active:scale-[0.98] transition-all"
              >
                Continue Ordering
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}