import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchMenuByTable } from "../services/api";
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

  const increaseQty = (item) => {
    const existing = cart.find((c) => c._id === item._id);

    if (existing) {
      setCart(
        cart.map((c) =>
          c._id === item._id ? { ...c, quantity: c.quantity + 1 } : c
        )
      );
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const decreaseQty = (item) => {
    const existing = cart.find((c) => c._id === item._id);

    if (!existing) return;

    if (existing.quantity === 1) {
      setCart(cart.filter((c) => c._id !== item._id));
    } else {
      setCart(
        cart.map((c) =>
          c._id === item._id ? { ...c, quantity: c.quantity - 1 } : c
        )
      );
    }
  };

  const getQty = (id) => {
    const item = cart.find((c) => c._id === id);
    return item ? item.quantity : 0;
  };

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
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
    ? [...new Set(menu.map((m) => m.category))]
    : [];

  return (
    <div className="min-h-screen bg-greenleaf-bg pb-32 font-sans selection:bg-greenleaf-secondary/30">

      {/* Fixed Call Waiter Button */}
      <div className="fixed top-6 right-6 z-[100] w-[200px]]">
        <CallWaiterButton tableId={resolvedTableId} />
      </div>

      <RestaurantHeader restaurant={restaurant} />

      <div className="max-w-5xl mx-auto px-6 md:px-10 -mt-10 relative z-20">
        {/* Category Quick Links (Sticky) */}
        <div className="sticky top-4 z-[30] mb-8 flex gap-3 overflow-x-auto pb-4 hide-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => document.getElementById(`cat-${cat}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="whitespace-nowrap bg-white/80 backdrop-blur-md px-6 py-2.5 rounded-2xl shadow-sm border border-greenleaf-accent text-greenleaf-text font-bold text-xs uppercase tracking-widest hover:bg-greenleaf-primary hover:text-white transition-all active:scale-95 shadow-floating"
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-12">
          {categories.map((cat) => (
            <div key={cat} id={`cat-${cat}`} className="animate-in fade-in slide-in-from-bottom-10 duration-700">
              <MenuCategory title={cat}>
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
                  {menu
                    .filter((item) => item.category === cat)
                    .map((item) => (
                      <MenuItem
                        key={item._id}
                        item={item}
                        qty={getQty(item._id)}
                        onAdd={increaseQty}
                        onRemove={decreaseQty}
                      />
                    ))}
                </div>
              </MenuCategory>
            </div>
          ))}

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