/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        crust: {
          50: "#fdf8f3",
          100: "#f9ede1",
          200: "#f1d9bd",
          300: "#e6bd8e",
          400: "#d99c5e",
          500: "#cd8140",
          600: "#b76733",
          700: "#98502c",
          800: "#7b422a",
          900: "#653824",
        },
        // Playful accent palette - used to color-code categories, tags,
        // and small decorative touches so the app isn't monochrome brown.
        berry: { 100: "#fbe0e8", 400: "#e8759c", 600: "#c94577", 700: "#a5335f" },
        sage: { 100: "#e1ede1", 400: "#7fa87f", 600: "#557a55", 700: "#436143" },
        mustard: { 100: "#faedc7", 400: "#dba934", 600: "#b3821b", 700: "#8f6716" },
        sky: { 100: "#dcedf7", 400: "#5fa8d3", 600: "#3480ab", 700: "#296488" },
        plum: { 100: "#ece0f2", 400: "#a678bd", 600: "#7d4b9b", 700: "#623b7a" },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
        hand: ["var(--font-hand)", "cursive"],
      },
    },
  },
  plugins: [],
};
