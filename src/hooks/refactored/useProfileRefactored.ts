import { useSupabaseQuery, createMutation } from '../base/useSupabaseQuery';
import { useSupabaseAuth } from '../useSupabaseAuth';
import { Profile } from '@/types';

// 현재 사용자 프로필 조회
export function useProfileRefactored() {
  const { id: userId } = useSupabaseAuth();

  const result = useSupabaseQuery<Profile>(
    userId ? `profile:${userId}` : null,
    async (supabase) => {
      if (!userId) throw new Error('User ID is required');

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          organizations (
            id,
            name
          )
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    {
      dedupingInterval: 60000, // 1분
      revalidateOnMount: true,
    }
  );

  return {
    profile: result.data,
    error: result.error,
    isLoading: result.isLoading,
    mutate: result.refetch,
  };
}

// 프로필 업데이트 작업
export function useProfileActionsRefactored() {
  const { id: userId } = useSupabaseAuth();

  // 프로필 업데이트
  const updateProfile = createMutation<Profile, Partial<Profile>>(
    async (supabase, updates) => {
      if (!userId) throw new Error('User ID is required');

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select(`
          *,
          organizations (
            id,
            name
          )
        `)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    {
      revalidateKeys: [`profile:${userId}`],
    }
  );

  // 프로필 이미지 업데이트
  const updateProfileImage = createMutation<string, File>(
    async (supabase, imageFile) => {
      if (!userId) throw new Error('User ID is required');

      // 이미지 업로드
      const fileName = `${userId}_${Date.now()}_${imageFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      // Public URL 생성
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(uploadData.path);

      // 프로필 업데이트
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_image: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      return publicUrl;
    },
    {
      revalidateKeys: [`profile:${userId}`],
    }
  );

  // 비밀번호 변경
  const updatePassword = createMutation<boolean, { newPassword: string }>(
    async (supabase, { newPassword }) => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      return true;
    }
  );

  // 이메일 변경
  const updateEmail = createMutation<boolean, { newEmail: string }>(
    async (supabase, { newEmail }) => {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) throw error;
      return true;
    }
  );

  return {
    updateProfile,
    updateProfileImage,
    updatePassword,
    updateEmail,
  };
}