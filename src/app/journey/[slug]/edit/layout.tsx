import { Metadata, ResolvingMetadata } from "next";
import { getJourneyByUuid } from "../actions";
type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  { params }: LayoutProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    // params가 Promise이므로 await로 값을 추출
    const resolvedParams = await params;
    const slug = resolvedParams?.slug || '';
    
    if (!slug) {
      console.error("Slug is missing or invalid in edit layout");
      return {
        title: "클라스 편집",
        openGraph: {
          images: [],
        },
      };
    }
    
    const { data: journeyData, error } = await getJourneyByUuid(slug);

    if (error || !journeyData) {
      console.error("Journey metadata fetch error in edit layout:", error);
      return {
        title: "클라스 편집",
        openGraph: {
          images: [],
        },
      };
    }

    const previousImages = (await parent).openGraph?.images || [];

    return {
      title: "클라스 편집 : " + journeyData.name || "클라스 편집",
      openGraph: {
        images: [
          ...(journeyData.image_url ? [journeyData.image_url] : []),
          ...previousImages
        ],
      },
    };
  } catch (error) {
    console.error("Metadata generation error in edit layout:", error);
    return {
      title: "클라스 편집",
      openGraph: {
        images: [],
      },
    };
  }
}

export default function EditLayout({ children, params }: LayoutProps) {
  return <>{children}</>;
}
