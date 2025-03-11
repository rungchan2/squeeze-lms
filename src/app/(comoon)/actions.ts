"use server";

import { createClient } from "@/utils/supabase/server";

export const getUser = async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return { data, error };
};

export const uploadFile = async (file: File) => {
  const supabase = await createClient();
  
  // 현재 인증된 사용자 정보 가져오기
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError || !userData.user) {
    return { 
      data: null, 
      error: { message: "인증된 사용자만 파일을 업로드할 수 있습니다." } 
    };
  }
  
  // 사용자 ID를 파일 경로에 포함시켜 고유한 경로 생성
  const userId = userData.user.id;
  const filePath = `public/${userId}/${file.name}`;
  
  // 파일 업로드
  const { data, error } = await supabase.storage
    .from("images")
    .upload(filePath, file, {
      upsert: true // 같은 경로에 파일이 있으면 덮어쓰기
    });
  
  return { data, error };
};

export async function getImageUrl(path: string) {
  const supabase = await createClient();
  const { data } = supabase.storage.from("images").getPublicUrl(path);
  return data.publicUrl;
}