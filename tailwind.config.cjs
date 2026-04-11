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
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        royal: {
          gold: "#d4af37",
          "deep-emerald": "#064e3b",
          "light-emerald": "#f0fdf4",
          cream: "#fffbeb",
          obsidian: "#022c22",
          bronze: "#92400e",
          "gold-light": "#fbbf24",
          "border-gold": "rgba(212, 175, 55, 0.2)",
        }
      },
      fontFamily: {
        serif: ["Marcellus", "Playfair Display", "serif"],
        sans: ["Montserrat", "Inter", "system-ui", "sans-serif"],
        calligraphy: ["Alex Brush", "cursive"],
      },
      borderRadius: {
        "royal-sm": "2px",
        "royal-md": "4px",
        "royal-lg": "8px",
        "royal-xl": "12px",
        "royal-2xl": "16px",
        "royal-3xl": "24px",
      },
      boxShadow: {
        "royal-glow": "0 0 20px rgba(212, 175, 55, 0.15)",
        "royal-inner": "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
        "royal-ring": "0 0 0 2px #d4af37",
      }
    },
  },
  plugins: [],
}
