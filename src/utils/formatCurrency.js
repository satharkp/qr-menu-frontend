export const getCurrencySymbol = (currency) => {
  const map = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£",
    AED: "د.إ",
    SAR: "﷼",
  };

  return map[currency] || currency; // fallback for custom
};

export const formatPrice = (price, currency) => {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${price}`;
};