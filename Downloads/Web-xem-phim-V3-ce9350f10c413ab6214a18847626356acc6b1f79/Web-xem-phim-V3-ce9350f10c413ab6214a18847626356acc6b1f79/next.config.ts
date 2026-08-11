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
            value: "ALLOW-FROM https://phimapi.com https://phim.nguonc.com https://vidlink.pro",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-src 'self' https://vidlink.pro https://phimapi.com https://*.phimapi.com https://phim.nguonc.com https://*.phim.nguonc.com https://vidsource.co https://*.vidsource.co https://2embed.cc https://*.2embed.cc https://player.vimeo.com https://*.player.vimeo.com;",
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
    ],
  },
};

export default nextConfig;
