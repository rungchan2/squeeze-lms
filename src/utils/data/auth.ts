import { createClient } from "@/utils/supabase/client";

export async function getUser() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  return { data, error };
}

export async function userLogout() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  return error;
}

export async function signUpWithEmail(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { userData: data, error };
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { userData: data, error };
}

export async function getUserProfileWithEmail(email: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .single();
  return { profileData: data, error };
}

export async function refreshToken() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.refreshSession();
  return { data, error };
}

export const getURL = () => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    const { hostname, protocol, port } = window.location;
    
    // Check if running on localhost or local IP
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    
    if (isLocalhost) {
      return `${protocol}//${hostname}:${port || '3000'}/auth/callback`;
    }
    
    // For production, always use HTTPS
    return `https://${hostname}/auth/callback`;
  }
  
  // Fallback for server-side or build time
  // Use environment variable if available
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;
  }
  
  // Default to production URL
  return 'https://squeezeedu.com/auth/callback';
}

export async function socialLogin(
  provider: "google" | "github" | "apple" | "twitter" | "facebook"
) {
  const supabase = createClient();
  try {
    console.log("소셜 로그인 시도:", provider);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getURL(),
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      console.error("소셜 로그인 에러:", error);
      throw error;
    }

    console.log("소셜 로그인 데이터:", data);
    return { data, error };
  } catch (error) {
    console.error("소셜 로그인 예외:", error);
    return { data: null, error };
  }
}