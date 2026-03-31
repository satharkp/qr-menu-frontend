import { useState, useEffect } from "react";
import { API_BASE } from "../services/api";

export default function RatingsWidget({ restaurantId }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if we just completed a payment (set in CheckoutPage)
    // Always prioritize this over whether they already rated, as they might want to rate specific orders
    const showImmediately = localStorage.getItem("showRating") === "true";

    if (showImmediately) {
      setVisible(true);
      setSubmitted(false);
      setRating(0);
      localStorage.removeItem("showRating");
      return;
    }

    // Only show after a short delay, and not if already rated this session
    const alreadyRated = sessionStorage.getItem(`rated-${restaurantId}`);
    if (!alreadyRated) {
      const timer = setTimeout(() => setVisible(true), 12000); // 12s delay for normal browsing
      return () => clearTimeout(timer);
    }
  }, [restaurantId]);

  const handleSubmit = async () => {
    if (rating === 0) return;

    try {
      await fetch(`${API_BASE}/ratings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restaurantId,
          rating,
        }),
      });

      sessionStorage.setItem(`rated-${restaurantId}`, "true");
      setSubmitted(true);
      setTimeout(() => setVisible(false), 2500);
    } catch (err) {
      console.error("Rating submit error:", err);
    }
  };

  const getMessage = () => {
    if (rating === 1) return "We’re sorry to hear that";
    if (rating === 2) return "We can do better";
    if (rating === 3) return "Thanks! We're improving";
    if (rating === 4) return "Glad you liked it!";
    if (rating === 5) return "Awesome! Thank you ❤️";
    return "Tap a star to rate";
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-64 left-4 right-4 z-[100] flex justify-center animate-in slide-in-from-bottom-5 duration-500 backdrop-blur-[2px]">
      <div className="bg-white rounded-[2rem] shadow-[0_25px_80px_rgba(0,0,0,0.18)] border border-greenleaf-accent/60 p-6 max-w-sm w-full relative">
        <button
          onClick={() => setVisible(false)}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-greenleaf-bg flex items-center justify-center text-greenleaf-muted hover:text-greenleaf-primary transition-colors text-sm"
        >
          ✕
        </button>

        {submitted ? (
          <div className="text-center py-2 animate-in fade-in zoom-in-95 duration-300">
            <div className="text-3xl mb-2">🙏</div>
            <p className="font-serif font-bold text-greenleaf-text text-lg">Thank you!</p>
            <p className="text-xs text-greenleaf-muted mt-1 font-sans">Your feedback means the world to us.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-greenleaf-bg rounded-xl flex items-center justify-center border border-greenleaf-accent">
                <span className="text-xl">⭐</span>
              </div>
              <div>
                <p className="font-serif font-black text-greenleaf-text text-sm leading-tight">Enjoying your meal?</p>
                <p className="text-[10px] text-greenleaf-muted font-bold uppercase tracking-widest">Rate your experience</p>
              </div>
            </div>

            <div className="flex justify-center gap-3 mb-5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(star)}
                  className={`text-3xl transition-all duration-200 hover:scale-125 active:scale-95 ${
                    star <= (hovered || rating) ? "text-yellow-400" : "text-gray-300"
                  }`}
                >
                  {star <= (hovered || rating) ? "⭐" : "☆"}
                </button>
              ))}
            </div>

            <p className="text-xs text-center text-greenleaf-muted mb-3 font-medium">
              {getMessage()}
            </p>

            <button
              onClick={handleSubmit}
              disabled={rating === 0}
              className="w-full bg-greenleaf-primary disabled:bg-gray-200 disabled:text-gray-400 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-[0_10px_25px_rgba(0,0,0,0.15)] active:scale-95 transition-all hover:shadow-[0_15px_35px_rgba(0,0,0,0.2)]"
            >
              {rating === 0 ? "Tap a star to rate" : "Submit Rating"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
