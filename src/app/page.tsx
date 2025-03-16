"use client";

import { useRouter } from "next/navigation";
import HomeTab from "@/components/home/HomeTab";
import { logout } from "@/app/(auth)/actions";

export default function Home() {
  const router = useRouter();
  
  return (
    <div>
      <HomeTab />
    </div>
  );
}
