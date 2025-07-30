import { 
  useSupabaseQuery,
  createCacheKey,
  createMutation
} from '../base/useSupabaseQuery';

interface AccessCode {
  id: string;
  code: string;
  role_id: string;
  is_active: boolean;
  usage_count: number;
  max_usage?: number;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

interface CreateAccessCode {
  code: string;
  role_id: string;
  max_usage?: number;
  expires_at?: string;
}

// 액세스 코드 목록 조회 훅
export function useAccessCodesRefactored() {
  return useSupabaseQuery<AccessCode[]>(
    createCacheKey('access-codes'),
    async (supabase) => {
      const { data, error } = await supabase
        .from('role_access_code')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as AccessCode[];
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
    async (supabase) => {
      if (!accessCodeId) throw new Error('Access code ID is required');

      const { data, error } = await supabase
        .from('role_access_code')
        .select('*')
        .eq('id', accessCodeId)
        .single();

      if (error) throw error;
      return data as AccessCode;
    }
  );
}

// 액세스 코드 유효성 검증 훅
export function useAccessCodeValidationRefactored(code: string | null) {
  return useSupabaseQuery<{ isValid: boolean; accessCode?: AccessCode }>(
    code ? createCacheKey('access-code-validation', { code }) : null,
    async (supabase) => {
      if (!code) return { isValid: false };

      const { data, error } = await supabase
        .from('role_access_code')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return { isValid: false };
      }

      const accessCode = data as AccessCode;
      const now = new Date();

      // 만료일 확인
      if (accessCode.expires_at && new Date(accessCode.expires_at) < now) {
        return { isValid: false };
      }

      // 사용 횟수 확인
      if (accessCode.max_usage && accessCode.usage_count >= accessCode.max_usage) {
        return { isValid: false };
      }

      return { isValid: true, accessCode };
    }
  );
}

// 액세스 코드 CRUD 작업 훅
export function useAccessCodeActionsRefactored() {

  // 액세스 코드 생성
  const createAccessCode = createMutation<AccessCode, CreateAccessCode>(
    async (supabase, accessCodeData) => {
      const { data, error } = await supabase
        .from('role_access_code')
        .insert({
          ...accessCodeData,
          is_active: true,
          usage_count: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data as AccessCode;
    },
    {
      revalidateKeys: ['access-codes'],
    }
  );

  // 액세스 코드 업데이트
  const updateAccessCode = createMutation<
    AccessCode,
    { id: string; updates: Partial<AccessCode> }
  >(
    async (supabase, { id, updates }) => {
      const { data, error } = await supabase
        .from('role_access_code')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as AccessCode;
    },
    {
      revalidateKeys: ['access-codes', 'access-code'],
    }
  );

  // 액세스 코드 삭제
  const deleteAccessCode = createMutation<boolean, string>(
    async (supabase, accessCodeId) => {
      const { error } = await supabase
        .from('role_access_code')
        .delete()
        .eq('id', accessCodeId);

      if (error) throw error;
      return true;
    },
    {
      revalidateKeys: ['access-codes'],
    }
  );

  // 액세스 코드 활성화/비활성화
  const toggleAccessCodeStatus = createMutation<
    AccessCode,
    { id: string; isActive: boolean }
  >(
    async (supabase, { id, isActive }) => {
      const { data, error } = await supabase
        .from('role_access_code')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as AccessCode;
    },
    {
      revalidateKeys: ['access-codes', 'access-code'],
    }
  );

  // 액세스 코드 사용 (사용 횟수 증가)
  const useAccessCode = createMutation<AccessCode, string>(
    async (supabase, code) => {
      // 현재 액세스 코드 정보 조회
      const { data: currentCode, error: fetchError } = await supabase
        .from('role_access_code')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (fetchError || !currentCode) {
        throw new Error('Invalid access code');
      }

      const accessCode = currentCode as AccessCode;

      // 유효성 검증
      const now = new Date();
      if (accessCode.expires_at && new Date(accessCode.expires_at) < now) {
        throw new Error('Access code has expired');
      }

      if (accessCode.max_usage && accessCode.usage_count >= accessCode.max_usage) {
        throw new Error('Access code usage limit reached');
      }

      // 사용 횟수 증가
      const { data, error } = await supabase
        .from('role_access_code')
        .update({ 
          usage_count: accessCode.usage_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', accessCode.id)
        .select()
        .single();

      if (error) throw error;
      return data as AccessCode;
    },
    {
      revalidateKeys: ['access-codes', 'access-code', 'access-code-validation'],
    }
  );

  return {
    createAccessCode,
    updateAccessCode,
    deleteAccessCode,
    toggleAccessCodeStatus,
    useAccessCode,
  };
}

// 액세스 코드 통계 훅
export function useAccessCodeStatsRefactored() {
  const { data: accessCodes } = useAccessCodesRefactored();

  return useSupabaseQuery(
    createCacheKey('access-code-stats'),
    async () => {
      if (!accessCodes) return {};

      const stats = {
        total: accessCodes.length,
        active: accessCodes.filter(code => code.is_active).length,
        inactive: accessCodes.filter(code => !code.is_active).length,
        expired: accessCodes.filter(code => {
          if (!code.expires_at) return false;
          return new Date(code.expires_at) < new Date();
        }).length,
        usageLimitReached: accessCodes.filter(code => {
          if (!code.max_usage) return false;
          return code.usage_count >= code.max_usage;
        }).length,
        totalUsage: accessCodes.reduce((sum, code) => sum + code.usage_count, 0),
      };

      return stats;
    },
    {
      // accessCodes 데이터가 변경될 때만 재계산
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
}

// 역할별 액세스 코드 조회 훅
export function useAccessCodesByRoleRefactored(roleId: string | null) {
  return useSupabaseQuery<AccessCode[]>(
    roleId ? createCacheKey('access-codes-by-role', { roleId }) : null,
    async (supabase) => {
      if (!roleId) return [];

      const { data, error } = await supabase
        .from('role_access_code')
        .select('*')
        .eq('role_id', roleId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as AccessCode[];
    }
  );
}