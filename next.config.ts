import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  outputFileTracingRoot: __dirname,
  experimental: {},
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "javer.cl" },
      { protocol: "https", hostname: "el13uniformes.cl" },
      { protocol: "https", hostname: "via.placeholder.com" },
      { protocol: "https", hostname: "sazikwqmgqkmnuhudknz.supabase.co" },
      { protocol: "https", hostname: "res.cloudinary.com" }
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
