import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '스퀴즈!',
    short_name: '스퀴즈!',
    description: '스퀴즈 팀 학습 관리 시스템.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/favicon-196.png',
        sizes: '196x196',
        type: 'image/png',
      },
      {
        src: '/manifest-icon-192.maskable.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/manifest-icon-512.maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/apple-icon-180.png',
        sizes: '180x180',
        type: 'image/png',
      }
    ],
    // 스플래시 스크린은 pwa-assets 폴더에서 참조
    screenshots: [
      {
        src: '/pwa-assets/apple-splash-1170-2532.png',
        sizes: '1170x2532',
        type: 'image/png',
        form_factor: 'narrow' // 모바일(세로)
      },
      {
        src: '/pwa-assets/apple-splash-2732-2048.png',
        sizes: '2732x2048',
        type: 'image/png',
        form_factor: 'wide' // 데스크톱(가로)
      }
    ],
  }
}