import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "@/components/ui/toaster";
import { Navigation } from "@/components/navigation/Navigation";
import { KakaoScript } from "@/components/KaKao";

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
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 현재 URL 경로를 서버 컴포넌트에서는 직접 확인할 수 없으므로
  // 클라이언트 컴포넌트에서 처리하도록 수정
  return (
    <html lang="ko" data-theme="light" style={{ colorScheme: "light" }}>
      <body>
        <Providers>
          <Navigation exceptionPath={["/login", "/register"]} />
          <div className="container">
            {children}
            <SpeedInsights />
          </div>
          <Toaster />
          <KakaoScript />
        </Providers>
      </body>
    </html>
  );
}
