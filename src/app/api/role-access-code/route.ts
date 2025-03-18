import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    // role_access_code 테이블의 모든 데이터 가져오기
    const { data, error } = await supabase.from("role_access_code").select("*");
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // 테이블 데이터 반환
    return NextResponse.json({ 
      data,
      success: true 
    });
  } catch (e) {
    console.error("Error in role-access-code API route:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
} 