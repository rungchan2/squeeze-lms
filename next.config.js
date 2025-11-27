const nextPWA = require('next-pwa');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 16: Turbopack이 기본값. next-pwa가 webpack 설정을 추가하므로 빈 turbopack 설정 필요
  turbopack: {
    root: __dirname,
  },
  // Next.js 16: React Compiler 활성화 - 자동 메모이제이션으로 불필요한 리렌더링 방지
  reactCompiler: true,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
      },
      {
        protocol: 'https',
        hostname: `${process.env.PROJECT_ID}.supabase.co`,
      },
    ].filter(Boolean),
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ['error'],
    } : false,
  },
};

// PWA 설정 수정
const withPWA = nextPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development', // 개발 환경에서 비활성화
  register: false, // 수동으로 등록하므로 자동 등록 비활성화
  skipWaiting: true,
  // 오류 발생하는 파일들 제외
  buildExcludes: [/^\/_next\//, /\/app-build-manifest\.json$/, /_error\.js$/],
  maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB 이하 파일만 캐싱
});

const config = withPWA({
	...nextConfig,
});

module.exports = config;