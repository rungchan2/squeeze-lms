"use client";

import { useAuthStore } from "@/store/auth";
import { toaster } from "@/components/ui/toaster";
import Button from "@/components/common/Button";
import { Table } from "@chakra-ui/react";
import Select from "react-select";
import { useOrganization } from "@/hooks/useOrganization";
export default function AdminPage() {
  const { fetchUser } = useAuthStore();
  const {
    data: { useOrganizationList },
  } = useOrganization();
  const { organizations } = useOrganizationList();
  const organizationOptions = organizations?.map((organization) => ({
    label: organization.name,
    value: organization.id,
  }));

  return (
    <div>
      <Select options={organizationOptions} />

      <h1>관리자 페이지</h1>
      <Button
        variant="flat"
        onClick={() => {
          fetchUser();
        }}
      >
        초기화
      </Button>
      <Button
        variant="flat"
        onClick={() => {
          toaster.success({
            title: "관리자 페이지",
            description: "관리자 페이지입니다.",
          });
        }}
      >
        로그아웃
      </Button>
    </div>
  );
}

//TODO: 1. 어드민패널 페이지 만들기