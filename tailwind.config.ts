import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        ios: {
          blue: "var(--color-blue)",
          green: "var(--color-green)",
          red: "var(--color-red)",
          orange: "var(--color-orange)",
          purple: "var(--color-purple)",
          label: "var(--color-label)",
          "label-secondary": "var(--color-label-secondary)",
          "label-tertiary": "var(--color-label-tertiary)",
          separator: "var(--color-separator)",
          fill: "var(--color-fill)",
          "fill-secondary": "var(--color-fill-secondary)",
          "fill-tertiary": "var(--color-fill-tertiary)",
          surface: "var(--color-surface)",
          bg: "var(--color-bg)",
        },
      },
      borderRadius: {
        "ios-sm": "10px",
        "ios-md": "12px",
        "ios-lg": "16px",
        "ios-xl": "20px",
      },
      fontFamily: {
        ios: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Helvetica Neue"',
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)",
        "card-hover": "0 2px 8px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.08)",
        nav: "0 -1px 0 rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
