"use client";

import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toaster } from "@/components/ui/toaster";


export default function RoleGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { loading: authLoading, role } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // 권한 체크 로직
  useEffect(() => {
    if (authLoading) return;

    if (!role) {
      toaster.create({
        title: "권한이 없습니다.",
        type: "error",
      });
      router.back();

      return;
    }

    const isTeacherOrAdmin = role === "teacher" || role === "admin";
    setIsAuthorized(!!isTeacherOrAdmin);
    if (!isTeacherOrAdmin) {
      toaster.create({
        title: "권한이 없습니다.",
        type: "error",
      });
      router.back();
    }
  }, [
    role,
    authLoading,
    router,
  ]);
  if (authLoading || isAuthorized === null) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          pointerEvents: "none",
          opacity: 0.5,
          cursor: "not-allowed",
        }}
      >
      </div>
    );
  }

  return <>{children}</>;
}
