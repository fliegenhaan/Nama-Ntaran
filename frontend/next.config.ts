import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pinjhirrfdcivrazudfm.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  staticPageGenerationTimeout: 1000,
};

export default nextConfig;