"use client";
import { toaster } from "@/components/ui/toaster";
import Button from "@/components/common/Button";
import Select from "react-select";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/components/AuthProvider";
import { Error } from "@/components/common/Error";
export default function AdminPage() {
  const { isAuthenticated, role } = useAuth();

  const {
    data: { useOrganizationList },
  } = useOrganization();
  const { organizations } = useOrganizationList();
  const organizationOptions = organizations?.map((organization) => ({
    label: organization.name,
    value: organization.id,
  }));
  if (!isAuthenticated || role !== "admin") {
    return <Error message="관리자 권한이 없습니다." />;
  }

  return (
    <div>
      <h1>관리자 페이지 입니다. (빠른 시일 내 개발 예정입니다.)</h1>
    </div>
  );
}

//TODO: 2. 어드민패널 페이지 만들기
