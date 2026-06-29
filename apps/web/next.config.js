/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@bpexch/shared'],
  async rewrites() {
    const backend = process.env.API_URL;
    if (!backend) return [];
    return [
      {
        source: '/api/:path*',
        destination: `${backend.replace(/\/$/, '')}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
