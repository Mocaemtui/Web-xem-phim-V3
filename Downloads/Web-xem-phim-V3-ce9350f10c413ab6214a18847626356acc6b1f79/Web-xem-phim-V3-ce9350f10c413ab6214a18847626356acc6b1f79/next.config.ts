import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // turbopack disabled to avoid root directory issues
  // turbopack: {
  //   root: __dirname,
  // },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-src 'self' https://vidlink.pro https://*.vidlink.pro https://phimapi.com https://ophim1.com https://*.ophim1.com https://phim.nguonc.com https://*.phim.nguonc.com https://vid.phtq.net https://*.vid.phtq.net https://vid2.phtq.net https://*.vid2.phtq.net https://player.vimeo.com https://*.player.vimeo.com https://www.youtube.com https://*.youtube.com;",
          },
        ],
      },
    ];
  },

  images: {
    unoptimized: true,
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
        hostname: "*.ophim1.com",
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
        hostname: "*.phimapi.com",
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
        hostname: "*.phim.nguonc.com",
      },
      {
        protocol: "https",
        hostname: "vidlink.pro",
      },
      {
        protocol: "https",
        hostname: "*.vidlink.pro",
      },
      {
        protocol: "https",
        hostname: "vid.phtq.net",
      },
      {
        protocol: "https",
        hostname: "*.vid.phtq.net",
      },
      {
        protocol: "https",
        hostname: "vid2.phtq.net",
      },
      {
        protocol: "https",
        hostname: "*.vid2.phtq.net",
      },
      {
        protocol: "https",
        hostname: "player.vimeo.com",
      },
      {
        protocol: "https",
        hostname: "*.player.vimeo.com",
      },
      {
        protocol: "https",
        hostname: "www.youtube.com",
      },
      {
        protocol: "https",
        hostname: "*.youtube.com",
      },
    ],
  },
};

export default nextConfig;
