import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "@/components/ui/toaster";
import { Navigation } from "@/components/navigation/Navigation";
import { KakaoScript } from "@/components/KaKao";
import { GoogleAnalytics } from "@next/third-parties/google";


export const metadata: Metadata = {
  title: "스퀴즈!",
  description: "스퀴즈와 함께 학습을 디자인 해봐요!",
  openGraph: {
    title: "스퀴즈!",
    description: "스퀴즈와 함께 학습을 디자인 해봐요!",
    images: [
      {
        url: "https://lsaveangkauvxmfurksh.supabase.co/storage/v1/object/public/images/public/og-image.png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <Providers>
          <Navigation exceptionPath={["/login", "/register"]} />
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
