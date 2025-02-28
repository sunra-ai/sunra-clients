import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    SUNRA_KEY: process.env.SUNRA_KEY,
    SUNRA_API_ENDPOINT: process.env.SUNRA_API_ENDPOINT,
    SUNRA_QUEUE_DOMAIN: process.env.SUNRA_QUEUE_DOMAIN,
  }
};

export default nextConfig;
