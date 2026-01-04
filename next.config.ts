import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["aig-academics.s3.ap-southeast-1.amazonaws.com"],
  },
};

export default nextConfig;
