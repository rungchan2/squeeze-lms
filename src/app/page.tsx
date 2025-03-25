"use client";

import { useRouter } from "next/navigation";
import HomeTab from "@/components/home/HomeTab";

export default function Home() {
  const router = useRouter();
  
  return (
    <div>
      <HomeTab />
    </div>
  );
}
