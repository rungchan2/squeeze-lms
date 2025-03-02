"use client";

import styles from "./page.module.css";
import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
const supabase = createClient();

import { socialLogout } from "@/utils/socialLogin";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('Current session:', session);
      console.log('Session error:', error);
    };
  
    checkSession();
  }, []);
  return (
    <div className={styles.page}>
      <h1>Hello World</h1>
      <button onClick={() => {
        socialLogout();
        router.push('/login');
      }}>sign out</button>
    </div>
  );
}
