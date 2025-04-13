# UUID 기반 데이터베이스 마이그레이션 요약 가이드

## 1. 데이터베이스 마이그레이션 

- **profiles 테이블** 변경: ID를 UUID로, auth.users와 직접 연결
- **기타 테이블** 변경: 모든 ID 필드를 UUID로 변경
- **JWT Custom Claims** 설정: 사용자 정보를 토큰에 포함

## 2. 프론트엔드 코드 변경 순서

### 1단계: 기본 타입 및 훅 준비
- `jwt-decode` 라이브러리 설치: `npm install jwt-decode`
- `useSupabaseAuth` 훅 구현 (src/hooks/useSupabaseAuth.ts)
- 주요 인터페이스/타입 업데이트 (ID 타입을 number에서 string으로)

### 2단계: 컴포넌트 순차적 업데이트
1. **Navigation.tsx**: useAuth → useSupabaseAuth 변경
2. **AuthProvider.tsx**: JWT 기반 사용자 정보 처리로 변경 
3. **기타 컴포넌트**: 역할 기반 UI 렌더링 업데이트

### 3단계: 데이터 접근 코드 업데이트
- ID 타입을 string(UUID)로 변경
- 타입 캐스팅 제거
- 팀 관련 기능 구현

## 3. 유의사항

- ID 관련 모든 변수 타입 확인 (number → string)
- 마이그레이션 완료 전까지 호환성 코드 유지:
  ```typescript
  // ID 변환 헬퍼
  const idStr = typeof id === 'number' ? String(id) : id;
  ```
- 데이터베이스 마이그레이션 전 충분한 테스트 및 백업

## 4. 테스트 체크리스트

- [ ] 로그인/로그아웃 흐름
- [ ] 사용자 정보 표시
- [ ] 역할 기반 접근 제어
- [ ] 팀 관련 기능
- [ ] 데이터 CRUD 작업 