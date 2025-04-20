const nextPWA = require('next-pwa');

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
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ['error'],
    } : false,
  },
};

const withPWA = nextPWA({
  dest: 'public',
  register: true,
});

const config = withPWA(nextConfig);


module.exports = config; 