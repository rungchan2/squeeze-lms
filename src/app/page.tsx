"use client";

import { useRouter } from "next/navigation";
import HomeTab from "@/components/home/HomeTab";
import { useAuth } from "@/components/AuthProvider";

export default function Home() {
  const router = useRouter();
  const { logout } = useAuth();
  
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
