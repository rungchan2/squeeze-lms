import useSWR, { mutate } from "swr";
import { accessCode } from "@/utils/data/accessCode";

const fetcher = async () => {
  const data = await accessCode.getAllAccessCodes();
  return data;
};

export default function useAccessCode() {
  const { data, error, isLoading } = useSWR("/api/access-code", fetcher);

  // 액세스 코드 생성 함수
  const createAccessCode = async (code: string, roleId: string) => {
    try {
      const data = await accessCode.createAccessCode(code, roleId);

      // SWR 캐시 갱신
      mutate("/api/access-code");

      return { data, success: true };
    } catch (error) {
      return { error, success: false };
    }
  };

  // 액세스 코드 삭제 함수
  const deleteAccessCode = async (id: string) => {
    try {
      const data = await accessCode.deleteAccessCode(id);
      mutate("/api/access-code");
      
      return { data, success: true };
    } catch (error) {
      return { error, success: false };
    }
  };

  return {
    accessCodes: data,
    isLoading,
    error,
    createAccessCode,
    deleteAccessCode
  };
}

