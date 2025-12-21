import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sacred color palette
        "sacred-blue": "#1E3A8A", // Reverence
        "candlelight": "#D97706", // Warmth
        "sacred-gold": "#CA8A04", // Divine
        "soft-ivory": "#FFFBEB", // Purity
        "midnight": "#0F172A", // Starry night
      },
      fontFamily: {
        crimson: ["var(--font-crimson)", "serif"],
        lora: ["var(--font-lora)", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
