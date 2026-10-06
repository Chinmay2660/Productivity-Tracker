import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-jakarta)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          DEFAULT: "#C45C26",
          hover: "#A84D1F",
          light: "#F0E4DA",
          muted: "#8B6F5C",
          sage: "#3D6B59",
        },
        surface: {
          DEFAULT: "var(--surface)",
          muted: "var(--surface-muted)",
        },
        foreground: "var(--foreground)",
        muted: "var(--muted)",
        accent: "var(--accent)",
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
      },
      spacing: {
        page: "1.5rem",
        section: "1.5rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(28, 25, 23, 0.03), 0 4px 20px -4px rgba(28, 25, 23, 0.07)",
        softHover: "0 2px 4px rgba(28, 25, 23, 0.05), 0 8px 24px -6px rgba(28, 25, 23, 0.1)",
        focus: "0 0 0 3px var(--ring)",
        panel: "0 1px 3px rgba(0, 0, 0, 0.12), 0 8px 24px -8px rgba(0, 0, 0, 0.2)",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.625rem",
        xl: "0.75rem",
        "2xl": "1rem",
      },
    },
  },
  plugins: [],
};

export default config;
