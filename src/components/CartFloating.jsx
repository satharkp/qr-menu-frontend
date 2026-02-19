import { useNavigate } from "react-router-dom";

const CartFloating = ({ cart, total, onPlaceOrder }) => {
  const navigate = useNavigate();

  if (cart.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 animate-slide-up">
      <div className="max-w-md mx-auto bg-greenleaf-primary/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-floating border border-white/10 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs text-greenleaf-secondary uppercase tracking-wider font-semibold">Total Order</span>
          <span className="text-xl font-serif font-bold text-white">£{total.toFixed(2)}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">
            {cart.reduce((acc, item) => acc + item.quantity, 0)} items
          </span>
          <button
            onClick={onPlaceOrder}
            className="bg-greenleaf-secondary hover:bg-[#b08d48] text-greenleaf-primary font-bold px-6 py-2.5 rounded-xl shadow-lg transition-colors flex items-center gap-2"
          >
            <span>Place Order</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>

        </div>
      </div>
    </div>
  );
};

export default CartFloating;
