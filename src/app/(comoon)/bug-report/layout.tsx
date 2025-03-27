import { Metadata, ResolvingMetadata } from "next";

type LayoutProps = {
  children: React.ReactNode;
};

export async function generateMetadata(
  _: LayoutProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    // 기존 이미지 유지
    const previousImages = (await parent).openGraph?.images || [];

    return {
      title: "스퀴즈 : 버그 리포트",
      description: "스퀴즈 버그 리포트 페이지입니다.",
      openGraph: {
        title: "스퀴즈 : 버그 리포트",
        description: "스퀴즈 버그 리포트 페이지입니다.",
        images: [
          ...previousImages,
          {
            url: "/open-graph.png",
          },
        ],
      },
    };
  } catch (error) {
    console.error("버그 리포트 메타데이터 생성 오류:", error);
    return {
      title: "스퀴즈 : 버그 리포트",
      description: "스퀴즈 버그 리포트 페이지입니다.",
      openGraph: {
        images: [],
      },
    };
  }
}

export default function BugReportLayout({ children }: LayoutProps) {
  return <>{children}</>;
}

