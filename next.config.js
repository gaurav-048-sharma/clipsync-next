/** @type {import('next').NextConfig} */
const nextConfig = {
  // External packages for server components (moved from experimental in Next.js 15+)
  serverExternalPackages: ['mongoose', 'bcryptjs'],
  // Increase body size limit for API routes (image uploads)
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
  // Image domains for S3 and other external sources
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.s3.ap-south-1.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  // Environment variables available on the client
  env: {
    NEXT_PUBLIC_APP_NAME: 'ClipSync',
  },
};

module.exports = nextConfig;
