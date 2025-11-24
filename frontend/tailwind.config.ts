import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "ink-900": "#0B1221",
        "ink-700": "#1C2A40",
        "ink-500": "#30415D",
        "ink-200": "#E8EDF5",
        "accent-500": "#3B82F6",
        "accent-400": "#60A5FA",
        "accent-200": "#BFDBFE",
      },
      boxShadow: {
        soft: "0 15px 50px -25px rgba(15, 23, 42, 0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
