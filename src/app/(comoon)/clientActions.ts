import { createClient } from "@/utils/supabase/client";
import { CreateBugReport } from "@/types";

export async function createBugReport(bugReport: CreateBugReport) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bug_reports")
    .insert(bugReport)
    .single();
  return { data, error };
}
export const uploadFile = async (file: File) => {
  const supabase = createClient();
  
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError || !userData.user) {
    return { 
      data: null, 
      error: { message: "인증된 사용자만 파일을 업로드할 수 있습니다." } 
    };
  }
  
  const userId = userData.user.id;
  const filePath = `public/${userId}/${file.name}`;

  const { data, error } = await supabase.storage
    .from("images")
    .upload(filePath, file, {
      upsert: true // 같은 경로에 파일이 있으면 덮어쓰기
    });
  
  return { data, error };
};

export async function getImageUrl(path: string) {
  const supabase =  createClient();
  const { data } = supabase.storage.from("images").getPublicUrl(path);
  return data.publicUrl;
}
