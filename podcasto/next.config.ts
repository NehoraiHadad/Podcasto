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

// Build remote patterns for S3 images and CloudFront
const buildS3RemotePatterns = () => {
  const patterns = [
    {
      protocol: 'https' as const,
      hostname: 'picsum.photos',
    }
  ];

  // Add CloudFront domain if configured (PRIORITY - check first)
  const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN;
  if (cloudfrontDomain) {
    patterns.push({
      protocol: 'https' as const,
      hostname: cloudfrontDomain,
    });
  }

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
    // Optimized image settings to reduce Vercel transformations usage
    // Reduced from 21 total sizes to 8 essential sizes for the application
    deviceSizes: [640, 750, 1080, 1920],  // 4 device breakpoints
    imageSizes: [64, 96, 256, 384],       // 4 common image sizes (thumbnails, cards, etc.)
    // Using only WebP format (instead of WebP + AVIF) reduces transformations by 50%
    formats: ['image/webp'],
    // Cache images for 31 days (instead of 60 seconds) to drastically reduce re-transformations
    // This is the primary optimization - prevents creating new transformations on every request
    minimumCacheTTL: 2678400,  // 31 days in seconds (recommended by Vercel)
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
