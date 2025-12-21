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
        // Premium night sky palette
        "star-gold": "#F5D17E",
        "star-gold-dark": "#D4AF37",
        "midnight": "#050A18",
        "indigo-deep": "#1E293B",
        // Legacy (kept for compatibility)
        "sacred-blue": "#1E3A8A",
        "candlelight": "#D97706",
        "sacred-gold": "#CA8A04",
        "soft-ivory": "#FFFBEB",
      },
      fontFamily: {
        serif: ["var(--font-crimson)", "serif"],
        scripture: ["var(--font-lora)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        crimson: ["var(--font-crimson)", "serif"],
        lora: ["var(--font-lora)", "serif"],
      },
      boxShadow: {
        "gold": "0 0 20px rgba(245, 209, 126, 0.3)",
        "gold-intense": "0 0 40px rgba(245, 209, 126, 0.5)",
        "glass": "0 8px 32px rgba(0, 0, 0, 0.3)",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out",
        "slide-up": "slideUp 0.6s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
