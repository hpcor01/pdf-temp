import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  experimental: {
    optimizeCss: true, // remove CSS não usado
    esmExternals: true, // mais rápido e leve
  },

  compiler: {
    removeConsole: true,
  },

  // Optional: desativa sourcemaps em produção
  productionBrowserSourceMaps: false,

  // Configure images
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname:
          "axvaplbwrlcl.compat.objectstorage.sa-vinhedo-1.oraclecloud.com",
      },
      // Add remove.bg domain for better optimization
      {
        protocol: "https",
        hostname: "api.remove.bg",
      },
    ],
  },

  // Add headers for aggressive caching
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
