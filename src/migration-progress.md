# UUID 마이그레이션 진행 상태

## 완료된 작업

### 데이터베이스 
- ✅ Supabase 데이터베이스 스키마 변경 (ID 필드를 UUID로)
- ✅ Custom JWT Claims 설정 (`custom_access_token_hook` 함수 추가)

### 타입 정의
- ✅ database.types.ts 업데이트 (모든 ID 필드가 string 타입으로 변경됨)
- ✅ userJourneys.ts 타입 정의 업데이트 (ID 필드를 string 타입으로 변경)
- ✅ journeys.ts 타입 정의 업데이트 (ID 필드를 string 타입으로 변경, uuid 필드 제거)
- ✅ teams.ts 타입 정의 업데이트 (ID 필드를 string 타입으로 변경)
- ✅ posts.ts 타입 정의 업데이트 (ID 필드를 string 타입으로 변경)
- ✅ users.ts 타입 정의 업데이트 (ID 필드를 string 타입으로 변경, uid 필드 제거)
- ✅ organizations.ts 타입 정의 업데이트 (ID 필드를 string 타입으로 변경, description 필드 추가)
- ✅ missions.ts 타입 정의 업데이트 (ID 필드를 string 타입으로 변경, expiry_date 필드 추가)
- ✅ journeyMissionInstances.ts 타입 정의 업데이트 (ID 필드를 string 타입으로 변경, status 필드 enum으로 수정)
- ✅ journeyWeeks.ts 타입 정의 업데이트 (ID 필드를 string 타입으로 변경)
- ✅ comments.ts 타입 정의 업데이트 (ID 필드를 string 타입으로 변경, content 필드 필수로 변경)
- ✅ likes.ts 타입 정의 업데이트 (ID 필드를 string 타입으로 변경)
- ✅ notification.ts 타입 정의 업데이트 (ID 필드를 string 타입으로 변경, type 필드 수정)
- ✅ bugReports.ts 타입 정의 업데이트 (ID 필드를 string 타입으로 변경)
- ✅ userPoints.ts 타입 정의 업데이트 (ID 필드를 string 타입으로 변경)
- ✅ roleAccessCode.ts 타입 정의 업데이트 (ID 필드를 string 타입으로 변경, role 필드 추가)

### 인증 및 컴포넌트
- ✅ useSupabaseAuth 훅 구현 (JWT에서 사용자 정보 추출)
- ✅ Navigation 컴포넌트 업데이트 (useSupabaseAuth 사용, ID 타입 처리)

## 진행 중인 작업

### 컴포넌트 업데이트
- ⏳ AuthProvider 컴포넌트 수정
- ⏳ 기존 useAuth 사용 코드를 useSupabaseAuth 사용으로 변경

### 데이터 접근 코드
- ⏳ 데이터 액세스 유틸리티 업데이트 (getJourney, createJourney 등)
- ⏳ 팀 관련 기능 구현

## 남은 작업

### 데이터 액세스
- ❌ ID 관련 데이터 조회/수정/삭제 코드 업데이트
- ❌ 타입 캐스팅 제거

### 테스트
- ❌ 인증 흐름 테스트
- ❌ 역할 기반 접근 제어 테스트
- ❌ 팀 관련 기능 테스트
- ❌ 데이터 CRUD 작업 테스트 