/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        claude: {
          parchment: "#f5f4ed",
          ivory: "#faf9f5",
          terracotta: "#c96442",
          "near-black": "#141413",
          "olive-gray": "#5e5d59",
          "stone-gray": "#87867f",
          "warm-sand": "#e8e6dc",
          "border-cream": "#f0eee6",
          coral: "#d97757",
          crimson: "#b53333",
          "focus-blue": "#3898ec",
        }
      },
      fontFamily: {
        serif: ["Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "claude-sm": "4px",
        "claude-md": "8px",
        "claude-lg": "12px",
        "claude-xl": "16px",
        "claude-2xl": "24px",
        "claude-3xl": "32px",
      },
      boxShadow: {
        "claude-whisper": "0 4px 24px rgba(0,0,0,0.05)",
        "claude-ring": "0 0 0 1px #d1cfc5",
      }
    },
  },
  plugins: [],
}
