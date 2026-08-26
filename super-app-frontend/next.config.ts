import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export đã được gỡ bỏ để cho phép API Routes (Dify Proxy) và server-side features.
  // App chạy bằng `next start` thay vì serve static files.
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    'localhost:3000',
    '127.0.0.1:3000'
  ],
};

export default nextConfig;
