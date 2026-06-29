/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:8000/api/v1/:path*',
      },
      {
        source: '/api/traces/:path*',
        destination: 'http://localhost:8000/api/traces/:path*',
      },
      {
        source: '/api/spans/:path*',
        destination: 'http://localhost:8000/api/spans/:path*',
      }
    ];
  },
};

module.exports = nextConfig;
