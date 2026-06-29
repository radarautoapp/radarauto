import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  typedRoutes: true,
  outputFileTracingRoot: join(__dirname, "../../"),
  outputFileTracingIncludes: {
    "/**": [
      "node_modules/.pnpm/next@*/node_modules/next/dist/**",
    ],
  },
  transpilePackages: ["@radar/ui", "@radar/types"],
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
