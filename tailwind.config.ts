import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          bg:     "#f2e1bd",
          card:   "#FDFAF7",
          option: "#7e9e3d32",
          border: "#E2DAD2",
          ink:    "#5B2000",
          mid:    "#7D7168",
          muted:  "#B8B0A8",
          gold:   "#C4A46A",
          sage:   "#689214",
          rose:   "#b04c4c",
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