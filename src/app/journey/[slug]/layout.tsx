import { createClient } from "@/utils/supabase/server";
import type { Metadata, ResolvingMetadata } from "next";

type LayoutProps = {
  children: React.ReactNode;
  params: { slug: string };
};

export async function generateMetadata(
  { params }: LayoutProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    const { slug } = params;
    const supabase = await createClient();
    
    const { data: journeyData, error } = await supabase
      .from("journeys")
      .select("name, image_url")
      .eq("uuid", slug)
      .single();

    if (error || !journeyData) {
      console.error("Journey metadata fetch error:", error);
      return {
        title: "클라스",
        openGraph: {
          images: [],
        },
      };
    }

    const previousImages = (await parent).openGraph?.images || [];

    return {
      title: journeyData.name || "클라스",
      openGraph: {
        images: [
          ...(journeyData.image_url ? [journeyData.image_url] : []),
          ...previousImages
        ],
      },
    };
  } catch (error) {
    console.error("Metadata generation error:", error);
    return {
      title: "클라스",
      openGraph: {
        images: [],
      },
    };
  }
}

export default function JourneyLayout({ children, params }: LayoutProps) {
  return <>{children}</>;
} 