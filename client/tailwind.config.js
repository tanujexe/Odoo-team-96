/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        canvas: "#FAF7F2",
        "canvas-subtle": "#F4EFEA",
        "canvas-warm": "#EFEAE0",
        "surface-card": "#FFFFFF",
        "surface-pearl": "#FDFCFA",
        "border-subtle": "#EFE8DC",
        "border-warm": "#E8DFD1",
        "border-taupe": "#DCCFBF",
        "text-primary": "#1E1714",
        "text-secondary": "#5C524B",
        "text-muted": "#8C8075",
        "accent-cognac": "#B86B30",
        "accent-cognac-hover": "#9A5420",
        "accent-amber": "#C2783B",
        "accent-amber-soft": "#FEF3E2",
        "accent-espresso": "#1C1613",
        "accent-forest": "#2D5A46",
        "accent-forest-soft": "#EBF3EF",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "sans-serif"],
        serif: ["EB Garamond", "serif"],
        mono: ["JetBrains Mono", "monospace"],
        headline: ["Sora"],
        display: ["Sora"],
        body: ["Inter"],
        label: ["Space Grotesk"]
      },
      boxShadow: {
        pill: "0 10px 30px -10px rgba(60,40,25,0.07), 0 1px 3px rgba(60,40,25,0.04)",
        wispr: "0 20px 45px -15px rgba(45,30,20,0.07), 0 0 0 1px rgba(220,207,191,0.75)",
        card: "0 4px 24px -4px rgba(45,30,20,0.05)"
      }
    },
  },
  plugins: [],
}
