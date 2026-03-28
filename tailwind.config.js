export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        greenleaf: {
          primary: "var(--color-primary, #105c38)", // Deep emerald green
          secondary: "var(--color-secondary, #C5A059)", // Gold
          bg: "var(--color-bg, #FDFBF7)", // Soft cream
          accent: "var(--color-accent, #E8F5E9)", // Light green accent
          text: "var(--color-text, #1A1A1A)", // Dark text
          muted: "var(--color-muted, #666666)", // Muted text
        },
      },
      fontFamily: {
        serif: ["var(--font-heading, 'Playfair Display')", "serif"],
        sans: ["var(--font-main, 'Lato')", "sans-serif"],
      },
      boxShadow: {
        'premium': '0 10px 30px -10px rgba(16, 92, 56, 0.15)',
        'floating': '0 20px 40px -10px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
};