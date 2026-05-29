/**
 * Next.js config — @radar/web
 *
 * transpilePackages necessário pra consumir packages do monorepo
 * (TypeScript não-compilado).
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@radar/ui", "@radar/types"],
  experimental: {
    typedRoutes: true,
  },
  images: {
    remotePatterns: [
      // adicionar domínios de imagens reais quando integrar storage
    ],
  },
};

export default nextConfig;
