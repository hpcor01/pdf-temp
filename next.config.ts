import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname:
          "axvaplbwrlcl.compat.objectstorage.sa-vinhedo-1.oraclecloud.com",
      },
    ],
  },
};

export default nextConfig;
