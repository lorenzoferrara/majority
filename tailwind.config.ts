import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        graphite: {
          950: "#0d0c09",
          900: "#141210",
          800: "#1c1a14",
          700: "#26231a",
          600: "#322e22",
          500: "#46402f",
          400: "#6b6250",
          300: "#8f8472",
          200: "#b5a992",
          100: "#d9cdb5",
        },
        parchment: {
          100: "#f5f0e4",
          200: "#e8dfc8",
          300: "#d4c9aa",
          400: "#b8a98a",
        },
        gold: {
          50:  "#fdf6e0",
          300: "#f0d47a",
          400: "#dbb947",
          500: "#c49a1f",
          600: "#9c7a18",
          700: "#7a5c0f",
        },
        pastel: {
          bg:     "#c9c4c1",
          card:   "#FDFAF7",
          option: "#e3f0e9",
          border: "#E2DAD2",
          ink:    "#1C1712",
          mid:    "#7D7168",
          muted:  "#B8B0A8",
          gold:   "#C4A46A",
          sage:   "#49b178",
          rose:   "#C49090",
        },
        warm: {
          bg:      "#FFECD6",
          surface: "#FAE2CC",
          white:   "#F2F4F3",
        },
        // legacy — kept for backward compat
        cream: {
          50:  "#fefdfb",
          100: "#faf8f3",
          200: "#f2ebdd",
          300: "#e5d9c3",
        },
        ink: {
          900: "#1a140a",
          800: "#2c2212",
          700: "#3e3120",
          500: "#6b5535",
          300: "#9e8660",
          200: "#c4aa82",
          100: "#ddd0b5",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}

export default config