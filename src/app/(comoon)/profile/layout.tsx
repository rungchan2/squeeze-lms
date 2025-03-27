import type { Metadata } from "next";

type LayoutProps = {
  children: React.ReactNode;
};

export const metadata: Metadata = {
  title: "프로필 : 스퀴즈",
  description: "스퀴즈 프로필 페이지입니다.",
  openGraph: {
    title: "프로필 : 스퀴즈",
    description: "스퀴즈 프로필 페이지입니다.",
    images: [
      {
        url: "/open-graph.png",
      },
    ],
  },
};

export default function ProfileLayout({ children }: LayoutProps) {
  return <>{children}</>;
}

