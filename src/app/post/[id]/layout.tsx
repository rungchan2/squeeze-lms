import { createClient } from "@/utils/supabase/server";
import type { Metadata, ResolvingMetadata } from "next";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export async function generateMetadata(
  { params }: LayoutProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    // params가 Promise이므로 await로 값을 추출
    const resolvedParams = await params;
    const id = resolvedParams?.id ? Number(resolvedParams.id) : null;
    
    if (id === null) {
      console.error("Post ID is missing or invalid");
      return {
        title: "클라스",
        description: "",
        openGraph: {
          images: [],
        },
      };
    }
    
    const supabase = await createClient();
    
    const { data: postData, error } = await supabase
      .from("posts")
      .select("title, content")
      .eq("id", id)
      .single();

    const postImageUrl = postData?.content?.match(/<img[^>]*src="([^"]+)"[^>]*>/)?.[0];

    if (error || !postData) {
      console.error("Post metadata fetch error:", error);
      return {
        title: "클라스",
        description: "",
        openGraph: {
          images: [],
        },
      };
    }

    const previousImages = (await parent).openGraph?.images || [];

    return {
      title: "포스팅 : " + postData.title || "클라스",
      description: postData.content || "",
      openGraph: {
        images: [
          ...(postImageUrl ? [postImageUrl] : []),
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

export default function PostLayout({ children }: LayoutProps) {
  return (
    <>
        {children}
    </>
  );
} 