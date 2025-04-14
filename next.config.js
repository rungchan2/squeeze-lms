/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "lh3.googleusercontent.com",
      "avatars.githubusercontent.com",
      "picsum.photos",
      "example.com",
      `${process.env.PROJECT_ID}.supabase.co`,
    ].filter(Boolean),
  },
  experimental: {
    // ... 다른 experimental 설정들 ...
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ['error'],
    } : false,
  },
};

module.exports = nextConfig; 