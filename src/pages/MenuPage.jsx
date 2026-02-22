import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { fetchMenuByTable, SOCKET_URL } from "../services/api";
import RestaurantHeader from "../components/RestaurantHeader";
import MenuCategory from "../components/MenuCategory";
import MenuItem from "../components/MenuItem";
import CartFloating from "../components/CartFloating";
import CallWaiterButton from "../components/customer/CallWaiterButton";


export default function MenuPage() {
  const { tableId, id } = useParams();
  const defaultTableId = "69948b911864d9b24462f4e4";
  const resolvedTableId = tableId || id || defaultTableId;
  const navigate = useNavigate();
  const [menu, setMenu] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    if (!resolvedTableId) {
      setLoading(false);
      return;
    }

    const loadMenu = async () => {
      try {
        const data = await fetchMenuByTable(resolvedTableId);

        // Normalize API response safely
        const menuItems =
          data?.menu ||
          data?.menuItems ||
          data?.items ||
          [];

        setMenu(Array.isArray(menuItems) ? menuItems : []);
        setRestaurant(data); // data itself contains restaurantName and tableNumber

        // Save tableId for later redirection
        localStorage.setItem("lastTableId", resolvedTableId);
      } catch (error) {
        console.error("Failed to load menu", error);
      } finally {
        setLoading(false);
      }
    };
    loadMenu();
  }, [resolvedTableId]);

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
          return prev.filter(i => i._id !== updatedItem._id);
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
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-greenleaf-bg">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-greenleaf-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-greenleaf-primary font-serif">Loading menu...</p>
        </div>
      </div>
    );
  }

  const categories = Array.isArray(menu)
    ? ["All", ...new Set(menu.map((m) => m.category))]
    : ["All"];

  return (
    <div className="min-h-screen bg-greenleaf-bg pb-32 font-sans selection:bg-greenleaf-secondary/30">

      {/* Fixed Call Waiter Button */}
      <div className="fixed top-6 right-6 z-[100] w-auto">
        <CallWaiterButton tableId={resolvedTableId} />
      </div>

      <RestaurantHeader restaurant={restaurant} />

      <div className="max-w-5xl mx-auto px-6 md:px-10 -mt-10 relative z-20">
        {/* Category Quick Links (Sticky) */}
        <div className="sticky top-4 z-40 mb-8 flex gap-3 overflow-x-auto pb-4 hide-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-2xl shadow-sm border text-xs uppercase tracking-widest transition-all active:scale-95 shadow-floating font-black ${activeCategory === cat
                ? "bg-greenleaf-primary text-white border-greenleaf-primary ring-4 ring-greenleaf-primary/10"
                : "bg-white/80 backdrop-blur-md border-greenleaf-accent text-greenleaf-text hover:bg-greenleaf-primary hover:text-white"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-12 min-h-[50vh]">
          {activeCategory === "All" ? (
            // Show grouped by category when "All" is selected
            [...new Set(menu.map(m => m.category))].map((cat) => (
              <div key={cat} id={`cat-${cat}`} className="animate-in fade-in slide-in-from-bottom-10 duration-700">
                <MenuCategory title={cat}>
                  <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
                    {menu
                      .filter((item) => item.category === cat)
                      .map((item) => (
                        <MenuItem
                          key={item._id}
                          item={item}
                          getQty={getQty}
                          onAdd={increaseQty}
                          onRemove={decreaseQty}
                        />
                      ))}
                  </div>
                </MenuCategory>
              </div>
            ))
          ) : (
            // Show only the selected category
            <div className="animate-in fade-in slide-in-from-bottom-10 duration-700">
              <MenuCategory title={activeCategory}>
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
                  {menu
                    .filter((item) => item.category === activeCategory)
                    .map((item) => (
                      <MenuItem
                        key={item._id}
                        item={item}
                        getQty={getQty}
                        onAdd={increaseQty}
                        onRemove={decreaseQty}
                      />
                    ))}
                </div>
              </MenuCategory>
            </div>
          )}

          {menu.length === 0 && (
            <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-greenleaf-accent">
              <p className="font-serif text-2xl text-greenleaf-muted italic">The chef is preparing our daily specials. Please check back shortly.</p>
              <div className="mt-4 text-4xl">🧑‍🍳</div>
            </div>
          )}
        </div>
      </div>


      <CartFloating
        cart={cart}
        total={total}
        onPlaceOrder={placeOrder}
      />

      <style dangerouslySetInnerHTML={{
        __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}