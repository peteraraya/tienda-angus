import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    domains: ["javer.cl", "el13uniformes.cl", "via.placeholder.com"],
  },
};

export default nextConfig;
