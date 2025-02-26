import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    SUNRA_KEY: process.env.SUNRA_KEY,
    SUNRA_API_ENDPOINT: process.env.SUNRA_API_ENDPOINT,
  }
};

export default nextConfig;
