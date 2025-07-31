import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Role } from '@/types';
import { useSupabaseAuth } from '../useSupabaseAuth';

// 역할 기반 접근 제어 훅
export function useRoleRefactored(requiredRole: Role) {
  const { role, isAuthenticated, loading } = useSupabaseAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated && role !== requiredRole) {
      router.push('/login');
    }
  }, [role, isAuthenticated, loading, router, requiredRole]);

  return { 
    role, 
    isAuthenticated, 
    loading,
    hasRequiredRole: role === requiredRole,
  };
}

// 역할 계층 확인 훅 (역할 레벨 기반)
export function useRoleHierarchyRefactored(minimumRole: Role) {
  const { role, isAuthenticated, loading } = useSupabaseAuth();
  const router = useRouter();

  // 역할 레벨 정의
  const roleLevel = {
    'user': 1,
    'teacher': 2,
    'admin': 3,
  };

  const hasPermission = role && roleLevel[role] >= roleLevel[minimumRole];

  useEffect(() => {
    if (!loading && isAuthenticated && !hasPermission) {
      router.push('/login');
    }
  }, [role, isAuthenticated, loading, router, hasPermission]);

  return { 
    role, 
    isAuthenticated, 
    loading,
    hasPermission: !!hasPermission,
    userLevel: role ? roleLevel[role] : 0,
    requiredLevel: roleLevel[minimumRole],
  };
}

// 다중 역할 허용 훅
export function useMultipleRolesRefactored(allowedRoles: Role[]) {
  const { role, isAuthenticated, loading } = useSupabaseAuth();
  const router = useRouter();

  const hasAllowedRole = role && allowedRoles.includes(role);

  useEffect(() => {
    if (!loading && isAuthenticated && !hasAllowedRole) {
      router.push('/login');
    }
  }, [role, isAuthenticated, loading, router, hasAllowedRole]);

  return { 
    role, 
    isAuthenticated, 
    loading,
    hasAllowedRole: !!hasAllowedRole,
    allowedRoles,
  };
}

// 역할별 리다이렉트 훅 (커스텀 리다이렉트 경로)
export function useRoleRedirectRefactored(
  requiredRole: Role, 
  redirectPath: string = '/login'
) {
  const { role, isAuthenticated, loading } = useSupabaseAuth();
  const router = useRouter();

  const hasRequiredRole = role === requiredRole;

  useEffect(() => {
    if (!loading && isAuthenticated && !hasRequiredRole) {
      router.push(redirectPath);
    }
  }, [role, isAuthenticated, loading, router, hasRequiredRole, redirectPath]);

  return { 
    role, 
    isAuthenticated, 
    loading,
    hasRequiredRole,
    redirectPath,
  };
}

// 역할 확인만 하는 훅 (리다이렉트 없음)
export function useRoleCheckRefactored(requiredRole?: Role) {
  const { role, isAuthenticated, loading } = useSupabaseAuth();

  // 역할 레벨 정의
  const roleLevel = {
    'user': 1,
    'teacher': 2,
    'admin': 3,
  };

  const checks = {
    isUser: role === 'user',
    isTeacher: role === 'teacher',
    isAdmin: role === 'admin',
    isTeacherOrAdmin: role === 'teacher' || role === 'admin',
    isAuthenticated,
    hasRole: !!role,
    hasRequiredRole: requiredRole ? role === requiredRole : true,
    hasMinimumRole: (minimumRole: Role) => {
      return role ? roleLevel[role] >= roleLevel[minimumRole] : false;
    },
    hasAnyRole: (roles: Role[]) => {
      return role ? roles.includes(role) : false;
    },
  };

  return {
    role,
    isAuthenticated,
    loading,
    ...checks,
  };
}

// 페이지별 권한 관리 훅
export function usePagePermissionsRefactored(pageConfig: {
  allowedRoles?: Role[];
  minimumRole?: Role;
  requireAuth?: boolean;
  redirectPath?: string;
}) {
  const { 
    allowedRoles, 
    minimumRole, 
    requireAuth = true, 
    redirectPath = '/login' 
  } = pageConfig;
  
  const { role, isAuthenticated, loading } = useSupabaseAuth();
  const router = useRouter();

  const roleLevel = {
    'user': 1,
    'teacher': 2,
    'admin': 3,
  };

  // 권한 확인 로직
  const hasPermission = () => {
    if (!requireAuth) return true;
    if (!isAuthenticated) return false;
    if (!role) return false;

    if (allowedRoles && !allowedRoles.includes(role)) return false;
    if (minimumRole && roleLevel[role] < roleLevel[minimumRole]) return false;

    return true;
  };

  const permission = hasPermission();

  useEffect(() => {
    if (!loading && !permission) {
      router.push(redirectPath);
    }
  }, [loading, permission, router, redirectPath]);

  return {
    role,
    isAuthenticated,
    loading,
    hasPermission: permission,
    pageConfig,
  };
}

// 조건부 렌더링을 위한 역할 가드 훅
export function useRoleGuardRefactored() {
  const { role, isAuthenticated, loading } = useSupabaseAuth();

  const RoleGuard = {
    // 특정 역할만 렌더링
    forRole: (targetRole: Role, children: React.ReactNode) => {
      return role === targetRole ? children : null;
    },
    
    // 최소 역할 레벨 이상만 렌더링
    forMinimumRole: (minimumRole: Role, children: React.ReactNode) => {
      const roleLevel = { 'user': 1, 'teacher': 2, 'admin': 3 };
      const hasPermission = role && roleLevel[role] >= roleLevel[minimumRole];
      return hasPermission ? children : null;
    },
    
    // 다중 역할 중 하나라도 해당하면 렌더링
    forAnyRole: (allowedRoles: Role[], children: React.ReactNode) => {
      const hasPermission = role && allowedRoles.includes(role);
      return hasPermission ? children : null;
    },
    
    // 인증된 사용자만 렌더링
    forAuthenticated: (children: React.ReactNode) => {
      return isAuthenticated ? children : null;
    },
    
    // 비인증 사용자만 렌더링
    forGuest: (children: React.ReactNode) => {
      return !isAuthenticated ? children : null;
    },
  };

  return {
    role,
    isAuthenticated,
    loading,
    RoleGuard,
  };
}