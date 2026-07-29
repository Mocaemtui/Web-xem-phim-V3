import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: typeof process !== "undefined" ? process.cwd() : undefined,
  },

  images: {
    unoptimized: false, // Enable optimization
    loader: "custom",
    loaderFile: "./lib/imageLoader.ts",
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
            value: "frame-src 'self' https://vidlink.pro https://*.vidlink.pro https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://vidlink.xyz https://*.vidlink.xyz; connect-src 'self' https://opensubtitles-v3.strem.io https://api.subdl.com https://dl.subdl.com https://vidlink.pro https://*.vidlink.pro;"
          },
        ],
      },
    ];
  },
};

export default nextConfig;
