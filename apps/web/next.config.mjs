/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@aicompta/types', '@aicompta/validators'],
};

export default nextConfig;
