import { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "인증 - Squeeze LMS",
  description: "Squeeze LMS 인증 페이지",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <div className="container">{children}</div>
      <SpeedInsights />
      <Toaster />
    </div>
  );
}
