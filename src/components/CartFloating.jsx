import { formatPrice } from "../utils/formatCurrency";

const CartFloating = ({ cart, total, onPlaceOrder, currency = '₹' }) => {
  if (cart.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 animate-slide-up">
      <div className="bg-brand-primary text-white p-4 rounded-xl shadow-floating flex items-center justify-between border border-white/10">
        <div className="flex flex-col">
          <span className="text-[10px] text-white/70 uppercase tracking-wider font-semibold">Total Order</span>
          <span className="text-xl font-bold text-white leading-tight">{formatPrice(total.toFixed(2), currency)}</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="bg-white/20 px-2.5 py-1 rounded-md text-xs font-medium">
            {cart.reduce((acc, item) => acc + item.quantity, 0)} items
          </span>
          <button
            onClick={onPlaceOrder}
            className="bg-white text-brand-primary hover:bg-gray-100 font-bold px-6 py-2.5 rounded-lg shadow-sm transition-colors flex items-center gap-2 text-sm"
          >
            <span>Place Order</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartFloating;
