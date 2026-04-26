export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "var(--color-primary, #2563eb)", 
          secondary: "#4b5563",
          bg: "#f8fafc",
          accent: "#dbeafe",
          text: "#0f172a",
          muted: "#64748b",
        },
        greenleaf: {
          primary: "var(--color-primary, #2563eb)", 
          secondary: "#4b5563",
          bg: "#f8fafc",
          accent: "#dbeafe",
          text: "#0f172a",
          muted: "#64748b",
        }
      },
      fontFamily: {
        sans: ["var(--font-main, 'Inter')", "system-ui", "sans-serif"],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'floating': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      }
    },
  },
  plugins: [],
};