"use client";

import styles from "./page.module.css";
import { useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { socialLogout } from "@/utils/socialLogin";
import { useRouter } from "next/navigation";
import HomeTab from "@/components/home/HomeTab";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getUser();
      console.log("Current session:", data);
    };

    checkSession();
  }, []);
  return (
    <div className={styles.container}>
      <HomeTab />
      <button
        onClick={() => {
          socialLogout();
          router.push("/login");
        }}
      >
        sign out
      </button>
    </div>
  );
}
