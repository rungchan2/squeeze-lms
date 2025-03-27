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
  // 프로덕션 빌드에서도 콘솔 로그 유지
  // compiler: {
  //   removeConsole: {
  //     exclude: ['error'],
  //   },
  // },
};

module.exports = nextConfig; 