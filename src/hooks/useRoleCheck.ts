import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toaster } from "@/components/ui/toaster";

interface RoleCheckOptions {
  requiredRole: string;
  resourceId?: string;
  resourceType?: string;
  redirectTo?: string;
  showToast?: boolean;
}

interface RoleCheckResult {
  loading: boolean;
  authorized: boolean;
  role: string | null;
  error: string | null;
  checkRole: (options?: Partial<RoleCheckOptions>) => Promise<boolean>;
}

/**
 * 서버 사이드 역할 검증 API를 사용하는 훅
 * 페이지나 컴포넌트의 권한 검증 및 리다이렉션 처리를 위해 사용
 */
export function useRoleCheck(options: RoleCheckOptions): RoleCheckResult {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 권한 검증 요청 함수
  const checkRole = async (overrideOptions?: Partial<RoleCheckOptions>): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    // 기본 옵션과 오버라이드 옵션 병합
    const mergedOptions = { ...options, ...overrideOptions };
    const {
      requiredRole,
      resourceId,
      resourceType,
      redirectTo,
      showToast = true
    } = mergedOptions;
    
    try {
      // API 요청 URL 구성
      let url = `/api/auth/rolecheck?requiredRole=${requiredRole}`;
      if (resourceId && resourceType) {
        url += `&resourceId=${resourceId}&resourceType=${resourceType}`;
      }
      
      // 서버에 권한 검증 요청
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "권한 검증 중 오류가 발생했습니다.");
      }
      
      // 권한 검증 성공
      setAuthorized(true);
      setRole(data.role);
      setLoading(false);
      return true;
      
    } catch (error: any) {
      setAuthorized(false);
      setError(error.message);
      setLoading(false);
      
      // 에러 메시지 표시
      if (showToast) {
        toaster.create({
          title: "접근 권한이 없습니다",
          description: error.message,
          type: "error",
        });
      }
      
      // 리다이렉션이 지정된 경우 해당 경로로 이동
      if (redirectTo) {
        router.push(redirectTo);
      }
      
      return false;
    }
  };
  
  // 컴포넌트 마운트 시 자동으로 권한 검증
  useEffect(() => {
    checkRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.requiredRole, options.resourceId, options.resourceType]);
  
  return {
    loading,
    authorized,
    role,
    error,
    checkRole,
  };
} 