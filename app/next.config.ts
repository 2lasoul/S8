import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.NODE_ENV === "production" ? "standalone" : undefined,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  async rewrites() {
    return [
      { source: "/videos/:path*", destination: "http://videos/videos/:path*" },
      { source: "/thumbnails/:path*", destination: "http://videos/thumbnails/:path*" },
    ];
  },
};

export default nextConfig;
