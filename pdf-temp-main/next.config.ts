import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React Strict Mode for better error handling
  reactStrictMode: true,

  // Enable experimental features for Next.js 15
  experimental: {
    // Optimize CSS by removing unused styles
    optimizeCss: true,

    // Faster external module handling
    esmExternals: true,

    // Bundle optimization with package imports
    optimizePackageImports: [
      "lucide-react",
      "lodash-es",
      "@radix-ui/react-*",
      "@hello-pangea/dnd",
    ],
  },

  // Move turbo config to turbopack (deprecation fix)
  turbopack: {},

  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Disable sourcemaps in production for smaller bundles
  productionBrowserSourceMaps: false,

  // Expose the build version to the frontend
  env: {
    NEXT_PUBLIC_VERSION: process.env.VERCEL_GIT_COMMIT_SHA || "development",
  },

  // Optimize images with modern formats
  images: {
    // Enable modern image formats
    formats: ["image/avif", "image/webp"],

    // Remote patterns for image optimization
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
