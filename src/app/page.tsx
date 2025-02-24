"use client";

import styles from "./page.module.css";
import { useEffect } from "react";
import { supabase } from "@/lib/initSupabase";

import { socialLogout } from "@/app/auth/socialLogin";

export default function Home() {
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
      <button onClick={() => socialLogout()}>sign out</button>
    </div>
  );
}
