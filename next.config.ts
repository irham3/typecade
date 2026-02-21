import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // Next.js runtime Image Optimization isn't supported in standard static export,
  // so we tell the framework to offload images locally/statically if applicable.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
