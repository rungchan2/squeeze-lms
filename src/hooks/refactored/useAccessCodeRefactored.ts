import { 
  useSupabaseQuery,
  createCacheKey,
  createMutation
} from '../base/useSupabaseQuery';
import {
  getAllAccessCodes,
  getAccessCode,
  createAccessCode as createAccessCodeData,
  updateAccessCode,
  deleteAccessCode,
  confirmAccessCode,
  toggleAccessCodeExpiry,
  getAccessCodeByCode
} from '@/utils/data/accessCode';
import { Role } from '@/types';

interface AccessCode {
  id: string;
  code: string | null;
  role: Role;
  created_at: string | null;
  expiry_date: string | null;
}

interface CreateAccessCode {
  code: string;
  role: Role;
  expiry_date?: string;
}

// 액세스 코드 목록 조회 훅
export function useAccessCodesRefactored() {
  return useSupabaseQuery<AccessCode[]>(
    createCacheKey('access-codes'),
    async () => {
      const result = await getAllAccessCodes();
      if (result.error) throw result.error;
      return (result.data || []) as AccessCode[];
    },
    {
      dedupingInterval: 60000, // 1분 동안 중복 요청 방지
    }
  );
}

// 단일 액세스 코드 조회 훅
export function useAccessCodeRefactored(accessCodeId: string | null) {
  return useSupabaseQuery<AccessCode>(
    accessCodeId ? createCacheKey('access-code', { accessCodeId }) : null,
    async () => {
      if (!accessCodeId) throw new Error('Access code ID is required');
      
      const result = await getAccessCode(accessCodeId);
      if (result.error) throw result.error;
      return result.data as AccessCode;
    }
  );
}

// 액세스 코드 유효성 검증 훅
export function useAccessCodeValidationRefactored(code: string | null, role?: Role) {
  return useSupabaseQuery<{ isValid: boolean; accessCode?: AccessCode }>(
    code ? createCacheKey('access-code-validation', { code, role }) : null,
    async () => {
      if (!code) return { isValid: false };
      
      const result = await confirmAccessCode(code, role);
      return {
        isValid: result.isValid,
        accessCode: result.accessCode as AccessCode | undefined
      };
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30초 동안 중복 요청 방지
    }
  );
}

// 액세스 코드 CRUD 액션들
export function useAccessCodeActionsRefactored() {
  // 액세스 코드 생성
  const createAccessCode = createMutation<AccessCode, CreateAccessCode>(
    async (accessCodeData) => {
      const result = await createAccessCodeData(accessCodeData);
      if (result.error) throw result.error;
      return result.data as AccessCode;
    },
    {
      revalidateKeys: ['access-codes']
    }
  );

  // 액세스 코드 수정
  const updateAccessCodeMutation = createMutation<AccessCode, { id: string; updates: { code?: string; role?: Role; expiry_date?: string } }>(
    async ({ id, updates }) => {
      const result = await updateAccessCode(id, updates);
      if (result.error) throw result.error;
      return result.data as AccessCode;
    },
    {
      revalidateKeys: ['access-codes', 'access-code']
    }
  );

  // 액세스 코드 삭제
  const deleteAccessCodeMutation = createMutation<boolean, string>(
    async (accessCodeId) => {
      const result = await deleteAccessCode(accessCodeId);
      if (result.error) throw result.error;
      return true;
    },
    {
      revalidateKeys: ['access-codes', 'access-code']
    }
  );

  // 액세스 코드 만료일 설정
  const toggleAccessCodeExpiryMutation = createMutation<AccessCode, { id: string; expiryDate: string | null }>(
    async ({ id, expiryDate }) => {
      const result = await toggleAccessCodeExpiry(id, expiryDate);
      if (result.error) throw result.error;
      return result.data as AccessCode;
    },
    {
      revalidateKeys: ['access-codes', 'access-code']
    }
  );

  // 코드로 액세스 코드 조회
  const getAccessCodeByCodeMutation = createMutation<AccessCode, string>(
    async (code) => {
      const result = await getAccessCodeByCode(code);
      if (result.error) throw result.error;
      return result.data as AccessCode;
    }
  );

  return {
    createAccessCode,
    updateAccessCode: updateAccessCodeMutation,
    deleteAccessCode: deleteAccessCodeMutation,
    toggleAccessCodeExpiry: toggleAccessCodeExpiryMutation,
    getAccessCodeByCode: getAccessCodeByCodeMutation
  };
}

// 편의 함수들
export function useCreateAccessCodeRefactored() {
  const actions = useAccessCodeActionsRefactored();
  return actions.createAccessCode;
}

export function useDeleteAccessCodeRefactored() {
  const actions = useAccessCodeActionsRefactored();
  return actions.deleteAccessCode;
}

export function useToggleAccessCodeExpiryRefactored() {
  const actions = useAccessCodeActionsRefactored();
  return actions.toggleAccessCodeExpiry;
}