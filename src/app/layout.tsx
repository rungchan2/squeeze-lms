import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
