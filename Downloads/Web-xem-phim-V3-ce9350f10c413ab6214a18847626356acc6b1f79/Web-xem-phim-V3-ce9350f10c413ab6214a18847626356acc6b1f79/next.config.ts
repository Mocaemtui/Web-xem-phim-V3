import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: typeof process !== "undefined" ? process.cwd() : undefined,
  },

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
            value: "default-src 'self' 'unsafe-inline' 'unsafe-eval' *; connect-src 'self' https://vidlink.pro https://*.vidlink.pro https://phimapi.com https://player.phimapi.com https://v7.kkphimplayer7.com https://vip.opstream10.com https://phimimg.com https://*.kkphim.com https://*.phimapi.com https://*.kkphimplayer*.com https://*.opstream*.com https://ophim1.com https://img.ophim.live https://*.ophim.live *; frame-src 'self' https://vidlink.pro https://*.vidlink.pro https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://vidlink.xyz https://*.vidlink.xyz https://player.phimapi.com https://vip.opstream10.com https://*.kkphim.com https://*.phimapi.com https://*.kkphimplayer*.com https://*.opstream*.com *; img-src 'self' https://phimimg.com https://img.ophim.live https://image.tmdb.org https://*.kkphim.com https://*.phimapi.com https://*.kkphimplayer*.com https://*.opstream*.com data: blob: *; media-src 'self' https://*.vidlink.pro https://*.kkphimplayer*.com https://*.opstream*.com https://*.phimapi.com https://phimapi.com *;",
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
        hostname: "player.phimapi.com",
      },
      {
        protocol: "https",
        hostname: "v7.kkphimplayer7.com",
      },
      {
        protocol: "https",
        hostname: "vip.opstream10.com",
      },
      {
        protocol: "https",
        hostname: "*.kkphim.com",
      },
      {
        protocol: "https",
        hostname: "*.phimapi.com",
      },
    ],
  },
};

export default nextConfig;
