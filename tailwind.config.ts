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
        status: {
          notStarted: "#FEE2E2",
          notStartedText: "#B91C1C",
          inProgress: "#FEF9C3",
          inProgressText: "#A16207",
          done: "#DCFCE7",
          doneText: "#15803D",
          revised: "#FCE7F3",
          revisedText: "#BE185D",
        },
      },
    },
  },
  plugins: [],
};

export default config;
