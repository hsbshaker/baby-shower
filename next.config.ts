import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "www.nestig.com" },
      { protocol: "https", hostname: "nunababy.com" },
      { protocol: "https", hostname: "images.crateandbarrel.com" },
    ],
  },
};

export default nextConfig;
