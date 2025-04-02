import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "@/components/ui/toaster";
import { Navigation } from "@/components/navigation/Navigation";
import { KakaoScript } from "@/components/KaKao";
import { GoogleAnalytics } from "@next/third-parties/google";

type LayoutProps = {
  children: React.ReactNode;
  params: { [key: string]: string };
};

export const metadata: Metadata = {
  title: "스퀴즈!",
  description: "스퀴즈와 함께 학습을 디자인 해봐요!",
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
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png" }],
  },
};

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <Providers>
          <Navigation exceptionPath={["/login", "/signup"]} />
          {children}
          <Toaster />
          <SpeedInsights />
          <KakaoScript />
        </Providers>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ""} />
      </body>
    </html>
  );
}
