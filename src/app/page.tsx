"use client";

import styles from "./page.module.css";
import { useEffect } from "react";
import { socialLogout } from "@/utils/socialLogin";
import { useRouter } from "next/navigation";
import HomeTab from "@/components/home/HomeTab";
import { useAuthStore } from "@/store/auth";

export default function Home() {
  const router = useRouter();
  const { fetchUser } = useAuthStore();
  useEffect(() => {
    fetchUser();
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
