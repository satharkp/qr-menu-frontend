import { useNavigate } from "react-router-dom";

const CartFloating = ({ cart, total, onPlaceOrder }) => {
  const navigate = useNavigate();

  if (cart.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up">
      <div className="max-w-md mx-auto bg-greenleaf-primary/95 backdrop-blur-xl text-white p-2.5 md:p-4 rounded-xl md:rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.3)] border border-white/10 flex items-center justify-between">
        <div className="flex flex-col pl-2">
          <span className="text-[8px] md:text-xs text-greenleaf-secondary uppercase tracking-widest font-black opacity-80">Total Order</span>
          <span className="text-lg md:text-xl font-serif font-black text-white leading-tight">₹{total.toFixed(2)}</span>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <span className="bg-white/10 px-2 py-1 rounded-lg text-[10px] md:text-xs font-bold whitespace-nowrap">
            {cart.reduce((acc, item) => acc + item.quantity, 0)} items
          </span>
          <button
            onClick={onPlaceOrder}
            className="bg-greenleaf-secondary hover:bg-[#b08d48] text-greenleaf-primary font-black px-4 py-2 md:px-6 md:py-2.5 rounded-lg md:rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-1.5 md:gap-2 text-xs md:text-sm"
          >
            <span>Place Order</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartFloating;
