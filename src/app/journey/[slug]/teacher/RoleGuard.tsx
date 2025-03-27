"use client";

import { useAuth } from "@/components/AuthProvider";
import { useJourneyUser } from "@/hooks/useJourneyUser";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useJourneyStore } from "@/store/journey";
import { toaster } from "@/components/ui/toaster";


export default function RoleGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { loading: authLoading, role } = useAuth();
  const { currentJourneyId } = useJourneyStore();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // 여정 ID 로드 및 사용자 정보 가져오기
  const {
    data,
    isLoading: journeyUsersLoading,
    journeyTeacher,
  } = useJourneyUser(currentJourneyId || 0);

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
    if (journeyUsersLoading || !data) return;

    const isTeacherOrAdmin = role === "teacher" || role === "admin";
    setIsAuthorized(!!isTeacherOrAdmin);
    if (!isTeacherOrAdmin) {
      toaster.create({
        title: "권한이 없습니다.",
        type: "error",
      });
      router.push(`/journey/${slug}`);
    }
  }, [
    role,
    authLoading,
    journeyUsersLoading,
    data,
    journeyTeacher,
    router,
    slug,
  ]);
  if (authLoading || journeyUsersLoading || isAuthorized === null) {
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

  // 권한이 확인되면 children 렌더링
  return <>{children}</>;
}
