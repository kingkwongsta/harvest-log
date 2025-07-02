import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [],
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.com',
      },
      {
        protocol: 'https',
        hostname: 'fymwqokuavoalfrwbeod.supabase.co',
      },
    ],
  },
  env: {
    // Make sure environment variables are available in the frontend
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  // Add some debugging for environment variables
  webpack: (config, { dev }) => {
    if (dev) {
      console.log('🔧 Build Environment Variables:', {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NODE_ENV: process.env.NODE_ENV,
      });
    }
    return config;
  },
};

export default nextConfig;
