import type { Config } from "tailwindcss";

const config: Config = {
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
          blue: "#007AFF",
          green: "#34C759",
          red: "#FF3B30",
          orange: "#FF9500",
          purple: "#AF52DE",
          label: "#1C1C1E",
          "label-secondary": "#8E8E93",
          "label-tertiary": "#C7C7CC",
          separator: "#C6C6C8",
          fill: "#F2F2F7",
          "fill-secondary": "#E5E5EA",
          "fill-tertiary": "#D1D1D6",
          surface: "#FFFFFF",
          bg: "#F2F2F7",
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
