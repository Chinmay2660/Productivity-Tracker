import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          blue: "#25A6EE",
          moderateBlue: "#4883CF",
          violet: "#A361CF",
          pink: "#CB41A2",
          cyan: "#13C8A5",
          softBlue: "#66C1F3",
        },
        status: {
          notStarted: "#FEF0EF",
          notStartedBorder: "#F8C9C6",
          notStartedText: "#C5312B",
          notStartedDot: "#EB5953",
          inProgress: "#FEF8E7",
          inProgressBorder: "#F6E2A6",
          inProgressText: "#92710B",
          inProgressDot: "#F3BF39",
          done: "#EBF7EF",
          doneBorder: "#BEE4CC",
          doneText: "#1F7A42",
          doneDot: "#46AF6A",
          revised: "#FBEBF6",
          revisedBorder: "#F2C3E6",
          revisedText: "#9E2E82",
          revisedDot: "#CB41A2",
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -12px rgba(15, 23, 42, 0.12)",
        softHover: "0 2px 4px rgba(15, 23, 42, 0.06), 0 16px 32px -14px rgba(15, 23, 42, 0.18)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #25A6EE 0%, #A361CF 100%)",
        "brand-gradient-soft": "linear-gradient(135deg, #EAF7FF 0%, #F6EEFB 100%)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
