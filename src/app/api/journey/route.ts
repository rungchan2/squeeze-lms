import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // UUID 파라미터 가져오기
    const searchParams = request.nextUrl.searchParams;
    const uuid = searchParams.get('uuid');
        
    if (!uuid) {
      return NextResponse.json(
        { error: "UUID가 제공되지 않았습니다" },
        { status: 400 }
      );
    }
    
    // Supabase에서 데이터 가져오기
    const supabase = await createClient();
    const response = await supabase
      .from('journeys')
      .select('*')
      .eq('uuid', uuid)
      .single();
    
    // 응답 로깅

    
    // 데이터 반환
    if (response.error) {
      return NextResponse.json(
        { error: response.error.message },
        { status: response.status || 500 }
      );
    }
    
    return NextResponse.json({ data: response.data });
  } catch (error) {
    console.error("[API] Journey 오류:", error);
    return NextResponse.json(
      { error: "요청 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
} 