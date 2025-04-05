import { createClient } from "@/utils/supabase/client";

export async function getJourney(uuid: string) {
  // 최소화 버전 - 디버깅용 코드 추가

  if (!uuid) {
    const error = new Error("UUID가 제공되지 않았습니다");
    console.error("[CLIENT] 유효하지 않은 UUID:", error);
    return { data: null, error };
  }

  // 임시 객체를 명시적으로 생성하여 반환
  let result;

  try {
    const supabase = createClient();

    const response = await supabase
      .from("journeys")
      .select("*")
      .eq("uuid", uuid)
      .single();
    
    // 결과 명시적으로 생성
    result = {
      data: response?.data || null,
      error: response?.error || null,
    };
  } catch (error) {
    console.error("[CLIENT] getJourney 오류:", error);
    result = { data: null, error };
  }


  return result;
}
export async function getMissionTypes() {
  const supabase = createClient();
  const { data, error } = await supabase.rpc(
    "get_distinct_mission_types" as any
  );
  return { data, error };
}
