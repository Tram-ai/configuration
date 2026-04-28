/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/configuration',
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
