import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.LIFEOS_TEST_MODE === '1' ? '.next-admin-test' : '.next',
  output: "standalone",
  turbopack: {
    root: process.cwd(),
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
