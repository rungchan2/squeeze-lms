-- Enhanced RLS (Row Level Security) Policies
-- 보안 강화된 행 단위 보안 정책

-- ============================================================================
-- 1. profiles 테이블 RLS 정책
-- ============================================================================

-- 기존 정책 제거 (있다면)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Teachers can view organization profiles" ON profiles;

-- RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 1-1. 본인 프로필 조회 및 수정
CREATE POLICY "Users can manage own profile"
ON profiles
FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 1-2. Teacher/Admin은 같은 조직 사용자 프로필 조회 가능
CREATE POLICY "Teachers can view organization profiles"
ON profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles teacher_profile
    WHERE teacher_profile.id = auth.uid()
    AND teacher_profile.role IN ('teacher', 'admin')
    AND teacher_profile.organization_id = profiles.organization_id
  )
);

-- ============================================================================
-- 2. journeys 테이블 RLS 정책
-- ============================================================================

-- 기존 정책 제거
DROP POLICY IF EXISTS "Journey access policy" ON journeys;

-- RLS 활성화
ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;

-- 2-1. 여정 조회 권한 - 참여자 또는 같은 조직의 teacher/admin
CREATE POLICY "Journey view access"
ON journeys
FOR SELECT
USING (
  -- 여정 참여자
  EXISTS (
    SELECT 1 FROM user_journeys
    WHERE user_journeys.journey_id = journeys.id
    AND user_journeys.user_id = auth.uid()
  )
  OR
  -- 같은 조직의 teacher/admin
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'admin')
    AND profiles.organization_id = journeys.organization_id
  )
);

-- 2-2. 여정 생성/수정 권한 - teacher/admin만
CREATE POLICY "Journey modify access"
ON journeys
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'admin')
    AND profiles.organization_id = journeys.organization_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'admin')
    AND profiles.organization_id = journeys.organization_id
  )
);

-- ============================================================================
-- 3. missions 테이블 RLS 정책
-- ============================================================================

-- 기존 정책 제거
DROP POLICY IF EXISTS "Mission access policy" ON missions;

-- RLS 활성화
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

-- 3-1. 미션 조회 권한
CREATE POLICY "Mission view access"
ON missions
FOR SELECT
USING (
  -- 같은 조직의 사용자
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.organization_id = missions.organization_id
  )
);

-- 3-2. 미션 생성/수정 권한 - teacher/admin만
CREATE POLICY "Mission modify access"
ON missions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'admin')
    AND profiles.organization_id = missions.organization_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'admin')
    AND profiles.organization_id = missions.organization_id
  )
);

-- ============================================================================
-- 4. posts 테이블 RLS 정책
-- ============================================================================

-- 기존 정책 제거
DROP POLICY IF EXISTS "Post access policy" ON posts;

-- RLS 활성화
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 4-1. 게시물 조회 권한
CREATE POLICY "Post view access"
ON posts
FOR SELECT
USING (
  -- 본인 게시물
  user_id = auth.uid()
  OR
  -- 같은 여정 참여자들의 게시물
  EXISTS (
    SELECT 1 FROM journey_mission_instances jmi
    JOIN user_journeys uj ON uj.journey_id = jmi.journey_id
    WHERE jmi.id = posts.journey_mission_instance_id
    AND uj.user_id = auth.uid()
  )
  OR
  -- 같은 조직의 teacher/admin
  EXISTS (
    SELECT 1 FROM journey_mission_instances jmi
    JOIN journeys j ON j.id = jmi.journey_id
    JOIN profiles p ON p.id = auth.uid()
    WHERE jmi.id = posts.journey_mission_instance_id
    AND p.role IN ('teacher', 'admin')
    AND p.organization_id = j.organization_id
  )
);

-- 4-2. 게시물 생성/수정 권한 - 본인 게시물만
CREATE POLICY "Post modify access"
ON posts
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 5. user_journeys 테이블 RLS 정책
-- ============================================================================

-- 기존 정책 제거
DROP POLICY IF EXISTS "User journey access policy" ON user_journeys;

-- RLS 활성화
ALTER TABLE user_journeys ENABLE ROW LEVEL SECURITY;

-- 5-1. 사용자-여정 관계 조회
CREATE POLICY "User journey view access"
ON user_journeys
FOR SELECT
USING (
  -- 본인의 여정 참여 정보
  user_id = auth.uid()
  OR
  -- 같은 여정의 다른 참여자 정보 (같은 여정에 참여한 경우)
  EXISTS (
    SELECT 1 FROM user_journeys my_journey
    WHERE my_journey.user_id = auth.uid()
    AND my_journey.journey_id = user_journeys.journey_id
  )
  OR
  -- 같은 조직의 teacher/admin
  EXISTS (
    SELECT 1 FROM journeys j
    JOIN profiles p ON p.id = auth.uid()
    WHERE j.id = user_journeys.journey_id
    AND p.role IN ('teacher', 'admin')
    AND p.organization_id = j.organization_id
  )
);

-- 5-2. 사용자-여정 관계 생성/수정 - teacher/admin 또는 본인
CREATE POLICY "User journey modify access"
ON user_journeys
FOR ALL
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM journeys j
    JOIN profiles p ON p.id = auth.uid()
    WHERE j.id = user_journeys.journey_id
    AND p.role IN ('teacher', 'admin')
    AND p.organization_id = j.organization_id
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM journeys j
    JOIN profiles p ON p.id = auth.uid()
    WHERE j.id = user_journeys.journey_id
    AND p.role IN ('teacher', 'admin')
    AND p.organization_id = j.organization_id
  )
);

-- ============================================================================
-- 6. organizations 테이블 RLS 정책
-- ============================================================================

-- 기존 정책 제거
DROP POLICY IF EXISTS "Organization access policy" ON organizations;

-- RLS 활성화
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- 6-1. 조직 조회 권한 - 소속 구성원만
CREATE POLICY "Organization view access"
ON organizations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.organization_id = organizations.id
    AND profiles.id = auth.uid()
  )
);

-- 6-2. 조직 수정 권한 - admin만
CREATE POLICY "Organization modify access"
ON organizations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.organization_id = organizations.id
    AND profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.organization_id = organizations.id
    AND profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================================================
-- 7. files 테이블 RLS 정책
-- ============================================================================

-- 기존 정책 제거
DROP POLICY IF EXISTS "File access policy" ON files;

-- RLS 활성화 (files 테이블이 있는 경우)
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- 7-1. 파일 조회 권한
CREATE POLICY "File view access"
ON files
FOR SELECT
USING (
  -- 업로드한 사용자
  uploaded_by = auth.uid()
  OR
  -- 공개 파일
  is_public = true
  OR
  -- 같은 조직 구성원 (조직이 설정된 경우)
  (organization_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.organization_id = files.organization_id
  ))
);

-- 7-2. 파일 수정/삭제 권한 - 업로드한 사용자 또는 admin
CREATE POLICY "File modify access"
ON files
FOR ALL
USING (
  uploaded_by = auth.uid()
  OR
  (organization_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
    AND profiles.organization_id = files.organization_id
  ))
)
WITH CHECK (
  uploaded_by = auth.uid()
  OR
  (organization_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
    AND profiles.organization_id = files.organization_id
  ))
);

-- ============================================================================
-- 8. 보안 함수들
-- ============================================================================

-- 8-1. 사용자 역할 확인 함수
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- 8-2. 사용자 조직 ID 확인 함수  
CREATE OR REPLACE FUNCTION auth.user_organization_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$;

-- 8-3. 관리자 여부 확인 함수
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT role = 'admin' FROM profiles WHERE id = auth.uid();
$$;

-- 8-4. Teacher 이상 권한 확인 함수
CREATE OR REPLACE FUNCTION auth.is_teacher_or_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT role IN ('teacher', 'admin') FROM profiles WHERE id = auth.uid();
$$;

-- ============================================================================
-- 9. 보안 감사 정책
-- ============================================================================

-- 중요한 변경사항에 대한 감사 로그 (선택적)
-- CREATE TABLE IF NOT EXISTS audit_logs (
--   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
--   table_name text NOT NULL,
--   operation text NOT NULL,
--   old_data jsonb,
--   new_data jsonb,
--   user_id uuid REFERENCES auth.users(id),
--   created_at timestamptz DEFAULT now()
-- );

-- ============================================================================
-- 완료 메시지
-- ============================================================================
SELECT 'Enhanced RLS policies have been successfully applied!' as status;