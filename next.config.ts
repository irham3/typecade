import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use standalone output for OpenNext / Cloudflare Workers
  output: 'standalone',
  // The desktop preview resolves localhost through 127.0.0.1 in development.
  allowedDevOrigins: ['127.0.0.1'],
  // Next.js runtime Image Optimization isn't supported in standard static export,
  // so we tell the framework to offload images locally/statically if applicable.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
