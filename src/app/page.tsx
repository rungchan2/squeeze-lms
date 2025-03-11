"use client";

import { useRouter } from "next/navigation";
import HomeTab from "@/components/home/HomeTab";
import { logout } from "@/app/(auth)/actions";

export default function Home() {
  const router = useRouter();
  
  return (
    <div className="container">
      <HomeTab />
      <button
        onClick={() => {
          logout();
          router.push("/login");
        }}
      >
        sign out
      </button>
    </div>
  );
}
