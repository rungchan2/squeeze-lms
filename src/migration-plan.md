# UUID 기반 데이터베이스 마이그레이션 계획

## 1. 데이터베이스 마이그레이션

### 1.1 스키마 변경 사항
- 모든 ID 필드를 `integer` → `uuid` 타입으로 변경
- `profiles` 테이블과 `auth.users` 직접 연결 (id = auth.users.id)
- Custom JWT Claim 구성하여 토큰에 사용자 정보 포함

### 1.2 마이그레이션 절차
1. `profiles` 테이블 구조 변경:
   ```sql
   -- 기존 데이터 백업
   CREATE TABLE profiles_backup AS SELECT * FROM profiles;
   
   -- profiles 테이블 재구성
   DROP TABLE profiles;
   CREATE TABLE profiles (
     id UUID PRIMARY KEY REFERENCES auth.users(id),
     email TEXT NOT NULL,
     first_name TEXT,
     last_name TEXT,
     role TEXT,
     profile_image TEXT,
     organization_id UUID REFERENCES organizations(id),
     marketing_opt_in BOOLEAN DEFAULT FALSE,
     privacy_agreed BOOLEAN DEFAULT FALSE,
     phone TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   
   -- 백업 데이터 마이그레이션
   INSERT INTO profiles (id, email, first_name, last_name, role, profile_image, organization_id, marketing_opt_in, privacy_agreed, phone, created_at, updated_at)
   SELECT auth.users.id, profiles_backup.email, profiles_backup.first_name, profiles_backup.last_name, profiles_backup.role, 
          profiles_backup.profile_image, organizations.id, profiles_backup.marketing_opt_in, 
          profiles_backup.privacy_agreed, profiles_backup.phone, profiles_backup.created_at, profiles_backup.updated_at
   FROM profiles_backup
   JOIN auth.users ON profiles_backup.uid = auth.users.id
   LEFT JOIN organizations ON profiles_backup.organization_id = organizations.id;
   ```

2. 관련 테이블 ID 필드 변경:
   - `organizations`, `journeys`, `teams` 등 모든 테이블의 ID 필드를 UUID로 변경
   - 외래 키 제약 조건 업데이트

3. JWT Custom Claims 설정:
   ```sql
   -- Function to add user metadata to JWT
   CREATE OR REPLACE FUNCTION add_user_metadata_to_jwt()
   RETURNS TRIGGER AS $$
   DECLARE profile_data RECORD;
   BEGIN
     SELECT role, first_name, last_name, organization_id INTO profile_data 
     FROM profiles WHERE id = NEW.id;
     
     NEW.raw_app_meta_data := jsonb_build_object(
       'role', profile_data.role,
       'organization_id', profile_data.organization_id
     );
     
     NEW.raw_user_meta_data := jsonb_build_object(
       'first_name', profile_data.first_name,
       'last_name', profile_data.last_name
     );
     
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   -- Trigger to update JWT on auth.users changes
   DROP TRIGGER IF EXISTS add_user_metadata_to_jwt ON auth.users;
   CREATE TRIGGER add_user_metadata_to_jwt
     BEFORE INSERT OR UPDATE ON auth.users
     FOR EACH ROW EXECUTE PROCEDURE add_user_metadata_to_jwt();
   ```

## 2. 프론트엔드 코드 변경

### 2.1 인증 관련 변경

1. `useSupabaseAuth` 훅 구현:
   ```typescript
   // src/hooks/useSupabaseAuth.ts
   import { createClient } from '@/utils/supabase/client';
   import { useEffect, useState } from 'react';
   import { jwtDecode } from 'jwt-decode';

   // ... 코드 생략 ...

   export function useSupabaseAuth() {
     // ... 구현 ...
     return {
       user,
       session,
       isAuthenticated: !!user,
       role,
       firstName,
       lastName,
       organizationId,
       hasPermission,
       profileImage,
       id: user?.id || null,
     };
   }
   ```

2. 기존 `useAuth` 사용 코드 변경:
   ```typescript
   // 변경 전
   const { profiles } = useStore();
   const isAdmin = profiles?.role === 'admin';

   // 변경 후
   const { role } = useSupabaseAuth();
   const isAdmin = role === 'admin';
   ```

### 2.2 데이터 액세스 변경

1. ID 타입 변경:
   ```typescript
   // 변경 전
   const userId: number = 123;

   // 변경 후
   const userId: string = "550e8400-e29b-41d4-a716-446655440000";
   ```

2. 데이터 조회 쿼리 업데이트:
   ```typescript
   // 타입 캐스팅 제거
   const { data } = await supabase.from('posts').select().eq('user_id', userId);
   ```

3. 팀 관련 기능 추가:
   ```typescript
   // 팀 생성
   const { data, error } = await supabase
     .from('teams')
     .insert({
       journey_id: journeyId,
       name: teamName,
       description: teamDescription
     })
     .select();

   // 팀원 추가
   const { error } = await supabase
     .from('team_members')
     .insert({
       team_id: teamId,
       user_id: userId,
       is_leader: isLeader
     });
   ```

### 2.3 UI 컴포넌트 변경

1. 역할 기반 UI 렌더링:
   ```tsx
   const { role } = useSupabaseAuth();
   const isAdmin = role === 'admin';

   {isAdmin && <AdminPanel />}
   ```

2. 사용자 정보 표시:
   ```tsx
   const { firstName, lastName } = useSupabaseAuth();
   const userName = `${firstName} ${lastName}`;
   ```

## 3. 마이그레이션 단계별 실행

### 3.1 준비 단계
1. 데이터베이스 백업 생성
2. 마이그레이션 SQL 스크립트 준비
3. 프론트엔드 코드 변경 사항 목록 작성

### 3.2 실행 단계
1. 데이터베이스 마이그레이션 실행
2. JWT Custom Claims 설정
3. `useSupabaseAuth` 훅 구현 
4. 컴포넌트 한 개씩 순차적으로 업데이트:
   - Navigation 컴포넌트
   - AuthProvider 컴포넌트
   - 페이지 컴포넌트
   - 데이터 접근 유틸리티

### 3.3 검증 단계
1. 인증 흐름 테스트
2. 역할 기반 접근 제어 테스트
3. 팀 관련 기능 테스트
4. 사용자 정보 표시 테스트

## 4. 롤백 계획

1. 데이터베이스 롤백
   - 백업에서 복원
   - 변경된 스키마 되돌리기

2. 코드 롤백
   - Git을 사용하여 변경 사항 되돌리기
   - 프론트엔드 코드를 이전 버전으로 복원 