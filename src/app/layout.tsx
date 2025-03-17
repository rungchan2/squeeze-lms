import type { Metadata } from "next";
import Script from "next/script";
import { Providers } from "./providers";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "@/components/ui/toaster";
import { Navigation } from "@/components/navigation/Navigation";

export const metadata: Metadata = {
  title: "Squeeze LMS",
  description: "Learning Management System",
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
        <Script src="https://developers.kakao.com/sdk/js/kakao.js" strategy="beforeInteractive" />
        <Script id="kakao-init" strategy="afterInteractive">
          {`
            if (window.Kakao) {
              if (!window.Kakao.isInitialized()) {
                window.Kakao.init('522aca402d6e1064a4d0d46a6a280b8a');
              }
            }
          `}
        </Script>

        <Providers>
          <Navigation exceptionPath={["/login", "/register"]} />
          <div className="container">{children}</div>
          <div className="root-footer"></div>
          <Toaster />
          <SpeedInsights />
        </Providers>
      </body>
    </html>
  );
}
