export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        greenleaf: {
          primary: "#105c38", // Deep emerald green
          secondary: "#C5A059", // Gold
          bg: "#FDFBF7", // Soft cream
          accent: "#E8F5E9", // Light green accent
          text: "#1A1A1A", // Dark text
          muted: "#666666", // Muted text
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', "serif"],
        sans: ['"Lato"', "sans-serif"],
      },
      boxShadow: {
        'premium': '0 10px 30px -10px rgba(16, 92, 56, 0.15)',
        'floating': '0 20px 40px -10px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
};