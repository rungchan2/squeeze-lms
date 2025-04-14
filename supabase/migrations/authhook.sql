-- Custom Access Token Hook 함수
CREATE OR REPLACE FUNCTION public.custom_access_token_hook2(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid;
  profile_record RECORD;
  claims jsonb;
BEGIN
  -- 사용자 ID 가져오기
  user_id = (event->>'user_id')::uuid;
  claims = event->'claims';
  
  -- 사용자 프로필 정보 조회
  SELECT 
    role, 
    first_name, 
    last_name, 
    organization_id,
    email,
    id
  INTO profile_record
  FROM public.profiles
  WHERE id = user_id;
  
  -- 프로필 정보가 있으면 JWT에 추가
  IF profile_record IS NOT NULL THEN
    -- app_metadata에 역할 및 조직 정보 추가
    claims = jsonb_set(
      claims,
      '{app_metadata}',
      jsonb_build_object(
        'role', profile_record.role,
        'organization_id', profile_record.organization_id,
        'profile_id', profile_record.id
      )
    );
    
    -- user_metadata에 개인 정보 추가
    claims = jsonb_set(
      claims,
      '{user_metadata}',
      jsonb_build_object(
        'first_name', profile_record.first_name,
        'last_name', profile_record.last_name,
        'email', profile_record.email
      )
    );
  END IF;
  
  -- 수정된 claims 반환
  RETURN jsonb_build_object('claims', claims);
END;
$$;

-- 권한 설정
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook2 TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook2 FROM authenticated, anon, public;