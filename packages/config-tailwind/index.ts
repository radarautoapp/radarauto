/**
 * @radar/tailwind-config
 *
 * Propósito: design tokens e preset compartilhado entre todos os apps web.
 * Define cores, fontes, espaçamentos e radius do design system RadarAuto.
 *
 * Tokens vêm direto das CSS vars definidas no protótipo validado.
 */
import type { Config } from "tailwindcss";

const config: Omit<Config, "content"> = {
  theme: {
    extend: {
      colors: {
        // Backgrounds
        bg: "rgb(var(--bg) / <alpha-value>)",
        "bg-2": "rgb(var(--bg-2) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",

        // Text
        text: "rgb(var(--text) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",

        // Brand (themeable via CSS vars)
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          hover: "rgb(var(--primary-hover) / <alpha-value>)",
        },

        // Semantic
        success: "rgb(var(--success) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        trending: "rgb(var(--trending) / <alpha-value>)",
      },
      fontFamily: {
        display: ["Sora", "system-ui", "sans-serif"],
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "12px",
        lg: "18px",
        xl: "24px",
        "2xl": "28px",
      },
      boxShadow: {
        sm: "0 1px 3px rgba(15, 23, 42, 0.04)",
        DEFAULT: "0 4px 12px rgba(15, 23, 42, 0.06)",
        lg: "0 12px 32px rgba(15, 23, 42, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
