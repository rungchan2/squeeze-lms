import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "@/components/ui/toaster";
import { Navigation } from "@/components/navigation/Navigation";
import { KakaoScript } from "@/components/KaKao";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Viewport } from "next";
import Pwa from "@/components/pwa";
type LayoutProps = {
  children: React.ReactNode;
  params: { [key: string]: string };
};

export const metadata: Metadata = {
  title: {
    default: "스퀴즈!",
    template: "%s | 스퀴즈!",
  },
  description: "스퀴즈와 함께 학습을 디자인 해봐요!",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "스퀴즈!",
    description: "스퀴즈와 함께 학습을 디자인 해봐요!",
    siteName: "스퀴즈",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "https://lsaveangkauvxmfurksh.supabase.co/storage/v1/object/public/images/public/og-image.png",
      },
    ],
  },
  keywords: ["스퀴즈", "학습", "디자인", "학습 디자인", "학습 디자인 툴", "학습 디자인 툴 추천", "학습 디자인 툴 추천 사이트", "학습 디자인 툴 추천 사이트 추천", "학습 디자인 툴 추천 사이트 추천 사이트"],
  icons: {
    icon: [
      { url: '/favicon-196.png', sizes: '196x196', type: 'image/png' },
      { url: '/manifest-icon-192.maskable.png', sizes: '192x192', type: 'image/png' },
      { url: '/manifest-icon-512.maskable.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: '/apple-icon-180.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    startupImage: [
      {
        url: "/pwa-assets/apple-splash-2048-2732.png",
        media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        url: "/pwa-assets/apple-splash-2732-2048.png",
        media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
      },
      {
        url: "/pwa-assets/apple-splash-1668-2388.png",
        media: "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        url: "/pwa-assets/apple-splash-2388-1668.png",
        media: "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
      },
      {
        url: "/pwa-assets/apple-splash-1536-2048.png",
        media: "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        url: "/pwa-assets/apple-splash-2048-1536.png",
        media: "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
      },
      {
        url: "/pwa-assets/apple-splash-1668-2224.png",
        media: "(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        url: "/pwa-assets/apple-splash-2224-1668.png",
        media: "(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
      },
      {
        url: "/pwa-assets/apple-splash-1620-2160.png",
        media: "(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        url: "/pwa-assets/apple-splash-2160-1620.png",
        media: "(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
      },
      {
        url: "/pwa-assets/apple-splash-1290-2796.png",
        media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/pwa-assets/apple-splash-2796-1290.png",
        media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
      },
      {
        url: "/pwa-assets/apple-splash-1179-2556.png",
        media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/pwa-assets/apple-splash-2556-1179.png",
        media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
      },
      {
        url: "/pwa-assets/apple-splash-1284-2778.png",
        media: "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/pwa-assets/apple-splash-2778-1284.png",
        media: "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
      },
      {
        url: "/pwa-assets/apple-splash-1170-2532.png",
        media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/pwa-assets/apple-splash-2532-1170.png",
        media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
      },
      {
        url: "/pwa-assets/apple-splash-1125-2436.png",
        media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/pwa-assets/apple-splash-2436-1125.png",
        media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
      },
      {
        url: "/pwa-assets/apple-splash-1242-2688.png",
        media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/pwa-assets/apple-splash-2688-1242.png",
        media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
      },
      {
        url: "/pwa-assets/apple-splash-828-1792.png",
        media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        url: "/pwa-assets/apple-splash-1792-828.png",
        media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
      },
      {
        url: "/pwa-assets/apple-splash-1242-2208.png",
        media: "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/pwa-assets/apple-splash-2208-1242.png",
        media: "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
      },
      {
        url: "/pwa-assets/apple-splash-750-1334.png",
        media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        url: "/pwa-assets/apple-splash-1334-750.png",
        media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
      },
      {
        url: "/pwa-assets/apple-splash-640-1136.png",
        media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        url: "/pwa-assets/apple-splash-1136-640.png",
        media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
      },
    ],
  },
};

export const viewport: Viewport = {
  maximumScale: 1, 
  userScalable: false,
};

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          <Navigation exceptionPath={["/login", "/signup"]} />
          {children}
          <Toaster />
          <SpeedInsights />
          <KakaoScript />
        </Providers>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ""} />
        <Pwa />
      </body>
    </html>
  );
}
