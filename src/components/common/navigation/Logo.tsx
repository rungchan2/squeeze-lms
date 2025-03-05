"use client";

import Image from "next/image";
import logo from "@/assets/logo.svg";
import { useRouter } from "next/navigation";

export function Logo({ width }: { width: number }) {
  const router = useRouter();
  if (!width) {
    width = 100;
  }
  return (
    <Image
      src={logo}
      alt="Logo"
      width={width}
      onClick={() => router.push("/")}
      style={{ cursor: "pointer" }}
    />
  );
}
