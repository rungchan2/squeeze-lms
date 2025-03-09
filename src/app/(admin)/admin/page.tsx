"use client";

import { useAuthStore } from "@/store/auth";
import { toaster } from "@/components/ui/toaster";
import Button from "@/components/common/Button";
export default function AdminPage() {
  const { fetchUser } = useAuthStore();
  
  return <div>
    <h1>관리자 페이지</h1>
      <Button variant="flat" onClick={() => {
        fetchUser();
      }}>
        초기화
      </Button>
      <Button variant="flat" onClick={() => {
        toaster.success({
          title: "관리자 페이지",
          description: "관리자 페이지입니다.",
        });
      }}>
        로그아웃
      </Button>
  </div>;
}
