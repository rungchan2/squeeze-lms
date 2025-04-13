import useSWR, { mutate } from "swr";
import { Organization } from "@/types";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

// 조직 목록 조회 함수
async function getOrganizationList() {
  const { data, error } = await supabase.from("organizations").select("*");
  if (error) throw error;
  const filteredData = data.filter((item) => item.name !== "스퀴즈팀");
  return filteredData as Organization[];
}

// 단일 조직 조회 함수
async function getSingleOrganization(id: string) {
  if (!id) return null;
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Organization;
}

// 조직 생성 함수
async function createOrganization(organization: Omit<Organization, "id">) {
  const { data, error } = await supabase
    .from("organizations")
    .insert(organization)
    .select()
    .single();
  if (error) throw error;
  
  // 캐시 무효화
  await mutate("organizations");
  return data as Organization;
}

// 조직 수정 함수
async function updateOrganization(id: string, organization: Partial<Organization>) {
  const { data, error } = await supabase
    .from("organizations")
    .update(organization)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  
  // 캐시 무효화
  await mutate("organizations");
  await mutate(`organization-${id}`);
  return data as Organization;
}

// 조직 삭제 함수
async function deleteOrganization(id: string) {
  const { error } = await supabase
    .from("organizations")
    .delete()
    .eq("id", id);
  if (error) throw error;
  
  // 캐시 무효화
  await mutate("organizations");
  await mutate(`organization-${id}`);
  return true;
}

// 조직 목록 조회 훅
export function useOrganizationList() {
  const { data, error, isLoading, mutate: revalidate } = useSWR(
    "organizations",
    getOrganizationList
  );

  return {
    organizations: data,
    isLoading,
    isError: error,
    mutate: revalidate,
  };
}

// 단일 조직 조회 훅
export function useOrganizationDetail(id: string) {
  const { data, error, isLoading, mutate: revalidate } = useSWR(
    id ? `organization-${id}` : null,
    () => getSingleOrganization(id)
  );

  return {
    organization: data,
    isLoading,
    isError: error,
    mutate: revalidate,
  };
}

// 모든 조직 관련 훅과 액션을 반환하는 함수
export function useOrganization() {
  return {
    data: {
      useOrganizationList,
      useOrganizationDetail,
    },
    actions: {
      createOrganization,
      updateOrganization,
      deleteOrganization,
    },
  };
}