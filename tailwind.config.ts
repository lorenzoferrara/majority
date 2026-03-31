import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50:  "#fefdfb",
          100: "#faf8f3",
          200: "#f2ebdd",
          300: "#e5d9c3",
        },
        gold: {
          300: "#f0d47a",
          400: "#dbb947",
          500: "#c49a1f",
          600: "#9c7a18",
          700: "#7a5c0f",
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