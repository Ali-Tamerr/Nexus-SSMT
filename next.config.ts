import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Explicitly set the workspace root to the project directory to ensure Turbopack can locate the Next.js package
    root: process.cwd(),
  },
  async rewrites() {
    const backendUrl = (
      process.env.NEXT_PRIVATE_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      ""
    ).replace(/\/$/, "");

    if (!backendUrl) return [];

    return {
      beforeFiles: [],
      afterFiles: [
        // Proxy backend API calls, but EXCLUDE Next.js-hosted routes:
        // /api/auth/*, /api/profiles/*
        {
          source: "/api/:path((?!auth|profiles).*)",
          destination: `${backendUrl}/api/:path*`,
        },
      ],
      fallback: [],
    };
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
    ],
  },
};

export default nextConfig;
