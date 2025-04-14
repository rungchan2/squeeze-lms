import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("journeys").select("*");
    
    if (error) {
      console.error("[API] journeys 오류:", error);
      return NextResponse.json({ 
        error: error.message,
        details: error.details
      }, { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        } 
      });
    }
    
    return NextResponse.json({ 
      data,
      timestamp: new Date().toISOString() 
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    console.error("[API] journeys 예외:", error);
    return NextResponse.json(
      { 
        error: "요청 처리 중 오류가 발생했습니다",
        details: error instanceof Error ? error.message : String(error)
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uuid } = body;
    
    if (!uuid) {
      console.error("[API] journeys/by-uuid 파라미터 누락:", body);
      return NextResponse.json(
        { error: "UUID가 필요합니다" },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("journeys")
      .select("*")
      .eq("id", uuid)
      .single();
    
    if (error) {
      console.error("[API] journeys/by-uuid 오류:", error);
      return NextResponse.json({ 
        error: error.message,
        details: error.details
      }, { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      });
    }
    
    return NextResponse.json({ 
      data,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    console.error("[API] journeys/by-uuid 예외:", error);
    return NextResponse.json(
      { 
        error: "요청 처리 중 오류가 발생했습니다",
        details: error instanceof Error ? error.message : String(error) 
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    );
  }
} 