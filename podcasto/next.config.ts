import type { NextConfig } from "next";

// Get S3 configuration from environment variables
const getS3Hostname = () => {
  const bucket = process.env.S3_BUCKET_NAME;
  const region = process.env.AWS_REGION || 'us-east-1';
  
  if (!bucket) {
    console.warn('S3_BUCKET_NAME not set, using default bucket name');
    return 'podcasto-podcasts.s3.amazonaws.com';
  }
  
  // Support both path-style and virtual-hosted-style URLs
  return `${bucket}.s3.${region}.amazonaws.com`;
};

// Build remote patterns for S3 images
const buildS3RemotePatterns = () => {
  const patterns = [
    {
      protocol: 'https' as const,
      hostname: 'picsum.photos',
    }
  ];
  
  // Add current S3 bucket configuration
  const s3Hostname = getS3Hostname();
  patterns.push({
    protocol: 'https' as const,
    hostname: s3Hostname,
  });
  
  // Add fallback patterns for common S3 formats
  const bucket = process.env.S3_BUCKET_NAME || 'podcasto-podcasts';
  const region = process.env.AWS_REGION || 'us-east-1';
  
  // Virtual-hosted-style URL
  patterns.push({
    protocol: 'https' as const,
    hostname: `${bucket}.s3.${region}.amazonaws.com`,
  });
  
  // Legacy format without region
  patterns.push({
    protocol: 'https' as const,
    hostname: `${bucket}.s3.amazonaws.com`,
  });
  
  // Path-style URL (fallback)
  patterns.push({
    protocol: 'https' as const,
    hostname: `s3.${region}.amazonaws.com`,
  });
  
  return patterns;
};

const nextConfig: NextConfig = {
  images: {
    remotePatterns: buildS3RemotePatterns(),
    // Advanced image optimization settings
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512, 640, 750, 828, 1080],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
};

export default nextConfig;
