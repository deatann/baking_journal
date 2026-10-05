/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark brown used for text and every outline - the "ink" of the hand-drawn look.
        ink: "#3b2a22",
        // Outline colour for cards, buttons and chips. One variable so it can be flipped to dark (#3b2a22) in one place.
        line: "var(--line)",
        // Warm wood/cream scale. 50 is the page background, 200-300 the soft borders,
        // 500 the muted text, 600-700 the accent brown, 900 = ink.
        crust: {
          50: "#fdf8f3",
          100: "#f6e7d1",
          200: "#ecd2ac",
          300: "#dfb888",
          400: "#c4a07a",
          500: "#a58468",
          600: "#8a5a34",
          700: "#6f4a2c",
          800: "#4a3328",
          900: "#3b2a22",
        },
        peach: { 100: "#fde6de", 200: "#f9d2c4", 300: "#f4b9a6", 500: "#d9826a", 700: "#c9684d" },
        butter: { 100: "#fbf0cc", 200: "#f9e4aa", 300: "#f6d98c", 600: "#a07c14" },
        // Category accent palette (used for card strips and tags)
        berry: { 100: "#fbe0e8", 400: "#e8759c", 600: "#c94577", 700: "#a5335f" },
        sage: { 100: "#e6efe0", 200: "#d0e1c8", 300: "#b9d1b0", 400: "#8fae86", 600: "#5f7f58", 700: "#4f6d49" },
        mustard: { 100: "#faedc7", 300: "#f0d27f", 400: "#dba934", 500: "#e0a92b", 600: "#b3821b", 700: "#8f6716" },
        sky: { 100: "#dcedf7", 200: "#bfdcee", 400: "#5fa8d3", 600: "#3480ab", 700: "#296488" },
        plum: { 100: "#ece0f2", 200: "#dcc8e8", 400: "#a678bd", 600: "#7d4b9b", 700: "#623b7a" },
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
        hand: ["var(--font-hand)", "cursive"],
      },
      boxShadow: {
        pop: "3px 4px 0 #ecd2ac",
        popbig: "5px 6px 0 #ecd2ac",
        inkpop: "2px 3px 0 #ecd2ac",
      },
      keyframes: {
        bob: { "50%": { transform: "translateY(-8px) rotate(-2deg)" } },
        up: { from: { transform: "translateY(40px)", opacity: "0" } },
        pop: { from: { transform: "translateY(10px)", opacity: "0" } },
        drop: { from: { transform: "translateY(-8px)", opacity: "0" } },
      },
      animation: {
        bob: "bob 1.6s ease-in-out infinite",
        up: "up .22s ease-out",
        pop: "pop .18s ease-out",
        drop: "drop .18s ease-out",
      },
    },
  },
  plugins: [],
};
