import { getJourney } from "@/app/journey/actions";
import { toaster } from "@/components/ui/toaster";
import { redirect } from "next/navigation";
import JourneyClient from "./client";

type Params = {
  params: Promise<{ slug: string }>;
};

export default async function JourneyPage({ params }: Params) {
  try {
    // 디버깅 정보 기록
    
    // params 전체를 await
    const resolvedParams = await params;
    const { slug } = resolvedParams;
    
    // 서버 사이드에서 먼저 확인
    let journeyResult;
    try {
      journeyResult = await getJourney(slug);
    } catch (fetchError) {
      console.error("[JourneyPage] getJourney 에러:", fetchError);
      journeyResult = { error: fetchError };
    }
    
    const { error } = journeyResult || { error: null };
    
    if (error) {
      console.error("[JourneyPage] 에러 발생:", error);
      toaster.create({
        title: "여정을 찾을 수 없습니다",
        type: "error",
      });
      redirect("/");
    }
      
    // 클라이언트 컴포넌트에 slug만 전달
    return <JourneyClient slug={slug} />;
    
  } catch (error) {
    console.error("[JourneyPage] 전체 오류:", error);
    toaster.create({
      title: "오류가 발생했습니다",
      type: "error",
    });
    redirect("/");
  }
}
