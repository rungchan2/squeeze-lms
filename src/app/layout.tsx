import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";
import { Navigation } from "@/components/common/navigation/Navigation";
import dayjs from "dayjs";
import 'dayjs/locale/ko'
dayjs.locale('ko')


export const metadata: Metadata = {
  title: "Squeeze LMS",
  description: "Learning Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" data-theme="light" style={{ colorScheme: 'light' }}>
      <body>
        <Providers>
          <Navigation />
          <div className="container">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
