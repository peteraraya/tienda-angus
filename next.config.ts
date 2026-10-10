import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  outputFileTracingRoot: __dirname,
  deploymentId:
    process.env.NEXT_DEPLOYMENT_ID ??
    process.env.VERCEL_DEPLOYMENT_ID ??
    process.env.GITHUB_SHA,
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
};

export default nextConfig;
