/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "lh3.googleusercontent.com",
      "avatars.githubusercontent.com",
      "picsum.photos",
      `${process.env.PROJECT_ID}.supabase.co`,
    ].filter(Boolean),
  },
  experimental: {
    // ... 다른 experimental 설정들 ...
  },
};

module.exports = nextConfig; 