import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  typedRoutes: true,
  outputFileTracingRoot: join(__dirname, "../../"),
  transpilePackages: ["@radar/ui", "@radar/types"],
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
