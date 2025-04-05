import { Metadata, ResolvingMetadata } from "next";
import RoleGuard from "./RoleGuard";

type LayoutProps = {
  children: React.ReactNode;
};

export async function generateMetadata(parent: ResolvingMetadata): Promise<Metadata> {
  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: "미션 관리",
    openGraph: {
      images: [
        ...previousImages
      ],
    },
  };
}

export default function TeacherLayout({ children }: LayoutProps) {
  return <RoleGuard>{children}</RoleGuard>;
}
