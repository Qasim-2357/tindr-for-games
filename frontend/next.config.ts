import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.rawg.io",
      },
    ],
  },
};

export default nextConfig;
