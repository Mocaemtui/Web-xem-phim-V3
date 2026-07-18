import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: typeof process !== "undefined" ? process.cwd() : undefined,
  },

  images: {
    unoptimized: true, // Disable Next.js optimization to allow webp from phimimg
    // Remove custom loader to use original URLs directly
    deviceSizes: [640, 828, 1200],
    imageSizes: [32, 64, 128],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ophim1.com",
      },
      {
        protocol: "https",
        hostname: "img.ophim.live",
      },
      {
        protocol: "https",
        hostname: "image.tmdb.org",
      },
      {
        protocol: "https",
        hostname: "phimimg.com",
      },
      {
        protocol: "https",
        hostname: "phimapi.com",
      },
      {
        protocol: "https",
        hostname: "wsrv.nl",
      },
      {
        protocol: "https",
        hostname: "phim.nguonc.com",
      },
      {
        protocol: "https",
        hostname: "vidlink.pro",
      },
      {
        protocol: "https",
        hostname: "**", // Allow all HTTPS domains temporarily for debugging
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-src 'self' https://vidlink.pro https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com;"
          },
        ],
      },
    ];
  },
};

export default nextConfig;
