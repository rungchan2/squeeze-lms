-- Custom Access Token Hook 설정
-- Supabase 대시보드의 SQL Editor에서 실행하세요

-- 1. profiles 테이블이 존재하는지 확인하고 필요한 컬럼 추가
DO $$
BEGIN
    -- profiles 테이블 생성 (이미 있으면 스킵)
    CREATE TABLE IF NOT EXISTS public.profiles (
        id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email text,
        first_name text,
        last_name text,
        role text DEFAULT 'user',
        organization_id uuid,
        profile_image text,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
    );
    
    -- role 컬럼이 없으면 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'user';
    END IF;
    
    -- organization_id 컬럼이 없으면 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN organization_id uuid;
    END IF;
END
$$;

-- 2. Custom Access Token Hook 함수 생성
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
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
    id,
    profile_image
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
        'role', COALESCE(profile_record.role, 'user'),
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
        'email', COALESCE(profile_record.email, claims->>'email'),
        'profile_image', profile_record.profile_image
      )
    );
  ELSE
    -- 프로필이 없으면 기본값 설정
    claims = jsonb_set(
      claims,
      '{app_metadata}',
      jsonb_build_object(
        'role', 'user',
        'organization_id', null,
        'profile_id', user_id
      )
    );
  END IF;
  
  -- 수정된 claims 반환
  RETURN jsonb_build_object('claims', claims);
END;
$$;

-- 3. 권한 설정
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- 4. 테스트용 사용자 데이터 추가 (현재 로그인한 사용자를 teacher로 설정)
-- 현재 사용자의 ID를 확인하고 teacher 권한 부여
DO $$
DECLARE
    current_user_email text := 'leeh09077@gmail.com'; -- 실제 이메일로 변경
    user_record RECORD;
BEGIN
    -- auth.users에서 해당 이메일의 사용자 찾기
    SELECT id, email INTO user_record 
    FROM auth.users 
    WHERE email = current_user_email;
    
    IF user_record.id IS NOT NULL THEN
        -- profiles 테이블에 레코드가 있는지 확인
        IF EXISTS (SELECT 1 FROM public.profiles WHERE id = user_record.id) THEN
            -- 기존 레코드 업데이트
            UPDATE public.profiles 
            SET 
                role = 'teacher',
                email = user_record.email,
                updated_at = now()
            WHERE id = user_record.id;
        ELSE
            -- 새 레코드 삽입
            INSERT INTO public.profiles (id, email, role, first_name, last_name)
            VALUES (
                user_record.id, 
                user_record.email, 
                'teacher',
                '테스트',
                '사용자'
            );
        END IF;
        
        RAISE NOTICE 'User % has been granted teacher role', current_user_email;
    ELSE
        RAISE NOTICE 'User % not found in auth.users', current_user_email;
    END IF;
END
$$;

-- 5. 확인 쿼리
SELECT 
    p.id,
    p.email,
    p.role,
    p.first_name,
    p.last_name,
    p.created_at
FROM public.profiles p
ORDER BY p.created_at DESC;

-- 6. Hook 함수가 제대로 생성되었는지 확인
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'custom_access_token_hook'
AND routine_schema = 'public';