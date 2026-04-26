import { SOCKET_URL as API_BASE_ROOT } from "../services/api";
import { formatPrice } from "../utils/formatCurrency";

const MenuItem = ({ item, getQty, onAdd, onRemove, onOpenPortions, currency = '₹' }) => {

  const imageUrl = item.image
    ? item.image.startsWith("http")
      ? item.image
      : `${API_BASE_ROOT}${item.image.startsWith("/") ? item.image : `/uploads/${item.image}`}`
    : "https://placehold.co/400x300?text=No+Image";

  const isPortion = item.measurementType === "PORTION";
  const unitQty = !isPortion ? getQty(item._id) : 0;

  const totalPortionQty = isPortion
    ? item.portions?.reduce((acc, p) => acc + getQty(item._id, p.label), 0)
    : 0;

  return (
    <div className={`group bg-white rounded-xl overflow-hidden shadow-sm transition-all border border-gray-200 flex flex-row mb-4 animate-in fade-in slide-in-from-bottom-2 ${!item.available ? 'opacity-75 grayscale' : 'hover:border-brand-primary/30'}`}>
      {/* Image Section */}
      <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 shrink-0 overflow-hidden bg-gray-100">
        <img
          src={imageUrl}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {item.isPopular && (
          <div className="absolute top-2 left-2 bg-brand-secondary text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
            Popular
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex justify-between items-start mb-1 gap-4">
            <h3 className="font-bold text-sm md:text-lg text-slate-900 leading-tight truncate md:whitespace-normal">
              {item.name}
            </h3>
            {!isPortion && (
              <span className="font-bold text-sm md:text-lg text-brand-primary whitespace-nowrap">
                {formatPrice(item.price, currency)}
              </span>
            )}
            {isPortion && totalPortionQty > 0 && (
              <span className="bg-brand-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-md">
                {totalPortionQty} In Cart
              </span>
            )}
          </div>
          {item.description && (
            <p className="text-slate-500 text-xs leading-snug line-clamp-2">
              {item.description}
            </p>
          )}
        </div>

        <div className="mt-3 flex items-center justify-end">
          {!item.available ? (
            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 border border-gray-200 rounded bg-gray-50">
              Unavailable
            </span>
          ) : isPortion ? (
            <button
              onClick={() => onOpenPortions(item)}
              className="bg-brand-primary hover:bg-brand-primary/90 text-white px-4 py-2 rounded-lg shadow-sm transition-all active:scale-95 font-bold text-xs flex items-center gap-2"
            >
              <span>{totalPortionQty > 0 ? "Edit Order" : "Add to Cart"}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          ) : (
            <>
              {unitQty === 0 ? (
                <button
                  onClick={() => onAdd(item)}
                  className="bg-brand-primary hover:bg-brand-primary/90 text-white px-4 py-2 rounded-lg shadow-sm transition-all active:scale-95 font-bold text-xs flex items-center gap-2"
                >
                  <span>Add</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              ) : (
                <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-gray-200 shadow-inner">
                  <button
                    onClick={() => onRemove(item)}
                    className="w-8 h-8 flex items-center justify-center bg-white text-brand-primary rounded-md shadow-sm border border-gray-100 font-bold text-lg active:scale-90"
                  >
                    −
                  </button>
                  <span className="mx-4 font-bold text-slate-900 text-sm min-w-[1rem] text-center">
                    {unitQty}
                  </span>
                  <button
                    onClick={() => onAdd(item)}
                    className="w-8 h-8 flex items-center justify-center bg-brand-primary text-white rounded-md shadow-sm font-bold text-lg active:scale-90"
                  >
                    +
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuItem;
