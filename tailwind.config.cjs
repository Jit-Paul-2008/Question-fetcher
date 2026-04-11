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
      },
      fontFamily: {
        serif: ["Literata", "serif"],
        sans: ["Nunito Sans", "system-ui", "sans-serif"],
        calligraphy: ["Alex Brush", "cursive"],
      },
      borderRadius: {
        "royal-sm": "0.125rem",
        "royal-md": "0.25rem",
        "royal-lg": "0.5rem",
        "royal-xl": "0.75rem",
        "royal-2xl": "1rem",
        "royal-3xl": "1.5rem",
      },
      boxShadow: {
        "terra-soft": "0 8px 30px rgba(46, 50, 48, 0.04)",
        "terra-inner": "inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
      }
    },
  },
  plugins: [],
}
