import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      auth: {
        // 익명 클라이언트로 사용하여 로그인 없이도 공개 데이터 접근 가능
        persistSession: false,
        autoRefreshToken: false,
      }
    }
  )
}

// 사이트맵 생성용 특수 클라이언트 - RLS 정책 우회
export async function createSitemapClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // 사이트맵용 쿠키 설정
          }
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          // 사이트맵 생성은 항상 성공해야 하므로 공개 정보로 취급
          'x-sitemap-generator': 'true'
        }
      }
    }
  )
}

// 관리자 전용 클라이언트 - Service Role Key 사용
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  console.log('[ADMIN_CLIENT] Environment check:', {
    hasServiceRoleKey: !!serviceRoleKey,
    hasSupabaseUrl: !!supabaseUrl,
    serviceRoleKeyLength: serviceRoleKey?.length || 0
  });
  
  if (!serviceRoleKey) {
    console.error('[ADMIN_CLIENT] SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  }
  
  if (!supabaseUrl) {
    console.error('[ADMIN_CLIENT] NEXT_PUBLIC_SUPABASE_URL not found in environment variables');
    throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is required');
  }
  
  return createServerClient<Database>(
    supabaseUrl,
    serviceRoleKey,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // Admin client doesn't need cookies
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    }
  )
}