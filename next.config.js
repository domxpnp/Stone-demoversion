/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  images: {
    // Serve resized WebP/AVIF thumbnails (via next/image) instead of shipping
    // the full-size originals — keeps image-heavy grids (admin Media) smooth.
    formats: ['image/avif', 'image/webp'],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
  },
};

module.exports = nextConfig;
