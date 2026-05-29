/**
 * Tailwind config — @radar/web
 *
 * Estende preset compartilhado de @radar/tailwind-config.
 * Aponta content pra incluir o ui package também (Rule 13).
 */
import preset from "@radar/tailwind-config";
import type { Config } from "tailwindcss";

const config: Config = {
  presets: [preset],
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
};

export default config;
