# 버그 해결 및 개선사항 구현 플랜

## 1. 미션 할당 날짜 문제 해결

### 문제 설명
미션 할당 시 시작일자를 오늘보다 과거로 설정해야만 추가가 되고, 다른 경우에는 추가가 안되는 문제

### 해결 플랜
**단계 1: 문제 원인 분석**
- 파일: `src/app/journey/[slug]/_plan/MissionComponent.tsx`
- 함수: `handleConfirmAddMission`
- 확인사항: 날짜 검증 로직과 미션 할당 조건 분석

**단계 2: 날짜 검증 로직 수정**
- `handleConfirmAddMission` 함수 내 날짜 비교 로직 수정
- 현재 날짜 이후의 미션 할당이 가능하도록 조건 변경
- dayjs 라이브러리 사용하여 정확한 날짜 비교

**단계 3: 테스트**
- 오늘 날짜로 미션 할당 테스트
- 미래 날짜로 미션 할당 테스트
- 과거 날짜로 미션 할당 테스트

---

## 2. 미션 생성 UI 개선

### 문제 설명
미션 생성하는 곳의 UI가 직관적이지 않음

### 해결 플랜
**단계 1: 현재 UI 분석**
- 파일: `src/app/mission/create/client.tsx`
- 파일: `src/components/mission/QuestionBuilder/QuestionBuilder.tsx`
- 파일: `src/components/mission/QuestionBuilder/QuestionItem.tsx`

**단계 2: UI 개선사항 식별**
- 모드 토글 버튼 더 명확하게 구분
- 질문 추가 버튼 배치 개선
- 질문 설정 섹션 가독성 향상
- 저장/취소 버튼 위치 개선

**단계 3: 컴포넌트 개선**
- `ModeToggleButton` 스타일링 개선
- `AddQuestionGrid` 레이아웃 최적화
- `QuestionItemContainer` 시각적 계층 구조 개선
- 도움말 텍스트 및 가이드라인 추가

**단계 4: 사용성 테스트**
- 신규 사용자 관점에서 미션 생성 플로우 테스트
- 각 질문 타입별 설정 프로세스 검증

---

## 3. 홈화면 탭 상태 유지 개선

### 문제 설명
홈화면 탭 변경 시 새로고침하면 탭 상태가 유지되지 않음

### 해결 플랜
**단계 1: 현재 탭 관리 구조 분석**
- 파일: `src/app/(home)/page.tsx`
- 파일: `src/app/(home)/layout.tsx`
- 현재 useState로 관리되는 탭 상태 확인

**단계 2: URL 파라미터 기반 탭 관리로 변경**
- `useSearchParams`와 `useRouter` 활용
- 탭 변경 시 URL에 `tab` 파라미터 추가
- 페이지 로드 시 URL에서 탭 상태 복원

**단계 3: 구현**
- `page.tsx`에서 searchParams 읽기 로직 추가
- 탭 변경 함수에서 `router.push()` 로 URL 업데이트
- 기본 탭 설정 및 유효하지 않은 탭 파라미터 처리

**단계 4: 뒤로가기 지원**
- 브라우저 뒤로가기 시 이전 탭으로 복원
- 탭 히스토리 관리

---

## 4. 탭 구성 변경 및 미션 기능 통합

### 문제 설명
미션 탭 삭제하고 일정 페이지를 미션 페이지와 동일한 기능으로 변경

### 해결 플랜
**단계 1: 현재 탭 구조 분석**
- 파일: `src/app/(home)/page.tsx`
- 현재 클래스, 알림, 미션, 프로필 탭 구조 확인

**단계 2: 미션 탭 제거 및 일정 페이지 기능 확장**
- 미션 탭 관련 코드 제거
- 일정(클래스) 탭에서 미션 카드 표시 기능 추가
- 파일: `src/app/(home)/_class/ClassTab.tsx` (또는 해당 컴포넌트)

**단계 3: 미션 카드 컴포넌트 개발**
- 완료된 미션: opacity 처리 + 클릭 비활성화
- 미완료 미션: 클릭 시 미션 수행 페이지 이동
- 완료된 미션 위에 "완료된 미션 보기" 버튼 추가

**단계 4: 미션 상태 관리**
- 사용자의 미션 완료 상태 확인 로직
- 파일: `src/utils/data/posts.ts` 또는 `src/hooks/usePosts.ts`
- 미션별 완료 여부 판단 함수 개발

**단계 5: 라우팅 설정**
- 미션 수행: `/mission/[missionId]/execute`
- 완료된 미션 보기: `/post/[postId]`

---

## 5. 알림 탭 통합 및 프로필 분리

### 문제 설명
알림 탭을 클래스 내부로 이동하고, 프로필 탭을 별도 페이지로 분리

### 해결 플랜
**단계 1: 알림 탭 이동**
- 현재 파일: `src/app/(home)/_notifications/NotificationsTab.tsx`
- 목표: 각 클래스(Journey) 페이지 내부로 알림 기능 이동
- 파일: `src/app/journey/[slug]/page.tsx` 내 알림 탭 추가

**단계 2: 프로필 탭 제거 및 별도 페이지 생성**
- `src/app/(home)/_profile/` 디렉토리 내용을 `src/app/(common)/profile/`로 이동
- 홈 탭에서 프로필 탭 제거
- 네비게이션 드롭다운에서 프로필 페이지 링크 확인

**단계 3: 클래스별 알림 필터링**
- 알림 데이터를 클래스별로 필터링하는 로직 추가
- 파일: `src/utils/data/notifications.ts`
- 함수: `getNotificationsByJourney(journeyId: string)`

**단계 4: 네비게이션 업데이트**
- 상단 네비게이션의 프로필 드롭다운 확인
- "내 프로필" 링크가 `/profile`로 연결되는지 확인

---

## 6. 뒤로가기 버튼 추가

### 문제 설명
각 탭마다 뒤로가기 버튼이 필요함

### 해결 플랜
**단계 1: 공통 뒤로가기 컴포넌트 생성**
- 파일: `src/components/common/BackButton.tsx`
- `router.back()` 활용한 컴포넌트 개발
- 아이콘 + 텍스트 조합으로 직관적인 디자인

**단계 2: 각 페이지에 뒤로가기 버튼 추가**
- 홈 탭들: `src/app/(home)/`
- 클래스 상세: `src/app/journey/[slug]/`
- 미션 관련: `src/app/mission/`
- 프로필: `src/app/(common)/profile/`

**단계 3: 조건부 렌더링 로직**
- 최상위 페이지(홈)에서는 뒤로가기 버튼 숨김
- `window.history.length` 또는 referrer 확인하여 표시 여부 결정

**단계 4: 스타일링 및 위치 조정**
- 페이지 헤더 영역에 일관된 위치로 배치
- 모바일 반응형 고려

---

## 7. 클래스 카드 그리드 레이아웃 개선

### 문제 설명
클래스 카드가 일렬로 나열되어 스크롤이 많이 필요함

### 해결 플랜
**단계 1: 현재 레이아웃 분석**
- 파일: `src/app/(home)/_class/ClassTab.tsx` (또는 해당 컴포넌트)
- 현재 클래스 카드 컴포넌트와 레이아웃 구조 확인

**단계 2: 그리드 레이아웃 구현**
- CSS Grid 또는 Flexbox 활용
- 반응형 그리드: `grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))`
- 카드 최대 너비: 30% 제한

**단계 3: 카드 컴포넌트 스타일 조정**
- 현재 카드 디자인 유지하면서 너비 제약 추가
- `min-width: 300px`, `max-width: 30%`
- 카드 내부 컨텐츠 반응형 조정

**단계 4: 모바일 최적화**
- 작은 화면에서는 1-2열로 표시
- 태블릿에서는 2-3열
- 데스크톱에서는 3-4열

**단계 5: 성능 최적화**
- 가상화(virtualization) 고려 (클래스가 많은 경우)
- 이미지 lazy loading 적용

---

## 우선순위 및 예상 작업 시간

### 높은 우선순위 (즉시 수정 필요)
1. **미션 할당 날짜 문제** - 2-3시간
2. **홈화면 탭 상태 유지** - 3-4시간

### 중간 우선순위 (기능 개선)
3. **탭 구성 변경 및 미션 기능 통합** - 6-8시간
4. **알림 탭 통합 및 프로필 분리** - 4-5시간
5. **클래스 카드 그리드 레이아웃** - 2-3시간

### 낮은 우선순위 (UX 개선)
6. **미션 생성 UI 개선** - 4-5시간
7. **뒤로가기 버튼 추가** - 2-3시간

## 주요 파일 및 함수 체크리스트

### 미션 관련
- `src/app/journey/[slug]/_plan/MissionComponent.tsx` - `handleConfirmAddMission`
- `src/app/mission/create/client.tsx` - 전체 UI 구조
- `src/utils/data/mission.ts` - 미션 CRUD 함수들

### 홈 및 탭 관리
- `src/app/(home)/page.tsx` - 메인 탭 관리
- `src/app/(home)/layout.tsx` - 레이아웃 구조
- 각 탭 컴포넌트들: `_class/`, `_notifications/`, `_profile/`

### 데이터 및 상태 관리
- `src/utils/data/posts.ts` - 미션 완료 상태 확인
- `src/utils/data/notifications.ts` - 알림 관련
- `src/hooks/` - 관련 커스텀 훅들
