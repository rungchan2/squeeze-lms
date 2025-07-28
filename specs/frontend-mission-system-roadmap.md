# Frontend Mission System Roadmap

## 📋 프로젝트 개요

Sqeeze LMS의 미션 시스템을 단일 텍스트/이미지 기반에서 다중 질문 기반의 구조화된 시스템으로 확장하는 종합적인 프론트엔드 업데이트 로드맵입니다.

### 🎯 목표
- **기존**: 단순한 텍스트/이미지 미션
- **신규**: 구조화된 다중 질문 미션 (주관식, 객관식, 이미지 업로드, 복합형)
- **UI/UX**: Modern, Simple, Intuitive 인터페이스
- **호환성**: 기존 Legacy 미션들과 완전 호환

---

## ✅ 완료된 작업 (Phase 1: Foundation)

### **1. 데이터베이스 & 타입 시스템**
- [x] **Database Types 재생성**: Supabase schema 업데이트 반영
- [x] **Mission Types 확장**: `essay`, `multiple_choice`, `image_upload`, `mixed` ENUM 추가
- [x] **Question Types 시스템**: 포괄적인 질문 타입 스키마 및 validation 구축
- [x] **Legacy 호환성**: 기존 `text`, `image`, `team` 타입과 신규 ENUM 매핑

### **2. 백엔드 데이터 레이어**
- [x] **Mission Data Layer**: mission_questions 테이블 CRUD 작업 추가
- [x] **Hooks 확장**: useMission, useMissionQuestions 훅 구현
- [x] **API 통합**: 질문 생성, 수정, 삭제, 순서 변경 API 연동

### **3. 미션 생성 시스템**
- [x] **Dual-Mode Interface**: 간단 모드 vs 고급 질문 빌더 모드
- [x] **Question Builder**: 동적 질문 추가/편집/삭제 컴포넌트
- [x] **Question Types**: 각 질문 타입별 설정 인터페이스
  - Essay: 최대 글자 수, 플레이스홀더 설정
  - Multiple Choice: 선택지 관리, 정답 설정
  - Image Upload: 최대 이미지 수, 필수 여부 설정
  - Mixed: 텍스트 + 이미지 복합 설정
- [x] **Drag & Drop**: @dnd-kit을 활용한 질문 순서 변경
- [x] **Form Validation**: React Hook Form + Zod 통합 검증
- [x] **Mission Type 오류 수정**: Legacy type 자동 변환 및 form 동기화

### **4. 미션 할당 시스템**
- [x] **Question Preview**: MissionCard에 질문 구조 미리보기 추가
- [x] **Type Icons**: 질문 타입별 아이콘 및 라벨 표시
- [x] **Mission Allocation**: 교사가 미션 할당 시 질문 구조 확인 가능

---

## 🚧 진행 중인 작업 (Phase 2: Interface Redesign)

### **5. 종합 문서화**
- [x] **Technical Specification**: 현재 문서 작성 중
- [ ] **Component Documentation**: 새로 생성된 컴포넌트들 문서화
- [ ] **Migration Guide**: Legacy 시스템에서 새 시스템으로 마이그레이션 가이드

---

## 📅 향후 업데이트 계획 (Phase 3-5)

### **Phase 3: Mission Execution Interface (High Priority)**

#### **3.1 미션 수행 인터페이스 현대화**
```typescript
// 목표: CreatePostFrom.tsx 완전 리뉴얼
interface MissionExecutionProps {
  missionType: 'essay' | 'multiple_choice' | 'image_upload' | 'mixed';
  questions: MissionQuestion[];
  onSubmit: (answers: StructuredAnswers) => void;
}
```

**주요 개선사항:**
- [ ] **Modern UI Design**: Clean, minimal, mobile-first 디자인
- [ ] **Question-based Flow**: 질문별 단계적 진행 인터페이스
- [ ] **Progress Indicator**: 진행률 표시 및 임시저장 기능
- [ ] **Type-specific Components**: 
  - `EssayQuestionInput`: Rich text editor, 글자 수 카운터
  - `MultipleChoiceInput`: Radio/Checkbox 선택 인터페이스
  - `ImageUploadInput`: Drag & drop 이미지 업로드
  - `MixedQuestionInput`: 텍스트 + 이미지 복합 입력

#### **3.2 답안 데이터 구조**
```typescript
interface StructuredAnswers {
  answers: {
    question_id: string;
    question_type: QuestionType;
    answer_data: {
      text?: string;
      selected_options?: string[];
      images?: string[];
      metadata?: any;
    };
  }[];
}
```

#### **3.3 실시간 Validation**
- [ ] **Question-level Validation**: 각 질문별 실시간 검증
- [ ] **Required Field Checking**: 필수 질문 답변 여부 확인
- [ ] **Character/Image Limits**: 제한사항 실시간 체크
- [ ] **Auto-save**: 답안 자동 저장 기능

### **Phase 4: Post Display Enhancement (Medium Priority)**

#### **4.1 PostCard 업데이트**
현재 PostCard는 일반적인 텍스트 기반 포스트만 지원. 미션 타입별 표시 개선 필요.

**개선 계획:**
- [ ] **Mission Type Indicators**: 미션 타입별 아이콘 및 라벨
- [ ] **Structured Answer Display**: 질문별 답안 구조화 표시
- [ ] **Question Summary**: 주요 질문들 미리보기
- [ ] **Score Display**: 객관식 문제 점수 표시
- [ ] **Rich Media Support**: 이미지 답안 갤러리 표시

```typescript
// PostCard 확장 예시
interface EnhancedPostCardProps {
  post: PostWithStructuredAnswers;
  missionType: MissionType;
  showQuestionBreakdown?: boolean;
}
```

#### **4.2 미션별 표시 방식**
- **Essay**: 기존과 유사, 텍스트 중심 표시
- **Multiple Choice**: 선택한 답안 및 정답률 표시
- **Image Upload**: 이미지 갤러리 형태 표시
- **Mixed**: 텍스트 + 이미지 조합 표시

### **Phase 5: Advanced Features (Low Priority)**

#### **5.1 미션 발견 및 탐색**
- [ ] **Mission Gallery**: 미션 타입별 필터링 및 검색
- [ ] **Difficulty Indicators**: 미션 난이도 시각화
- [ ] **Completion Stats**: 완료율, 평균 점수 표시
- [ ] **Recommendation Engine**: 개인화된 미션 추천

#### **5.2 피드백 및 채점 시스템**
- [ ] **Auto-scoring**: 객관식 자동 채점
- [ ] **Rubric System**: 주관식 채점 기준표
- [ ] **Peer Review**: 동료 평가 시스템
- [ ] **AI-assisted Feedback**: AI 기반 피드백 제안

#### **5.3 Analytics & Insights**
- [ ] **Performance Dashboard**: 학습자별 성과 분석
- [ ] **Question Analytics**: 질문별 정답률, 소요시간 분석
- [ ] **Learning Path Optimization**: 데이터 기반 학습 경로 최적화

---

## 🛠 Technical Requirements

### **개발 환경 및 도구**
- **Framework**: Next.js 15 + App Router
- **UI Library**: Chakra UI v3 + Emotion
- **State Management**: Zustand + SWR
- **Validation**: Zod + React Hook Form
- **Drag & Drop**: @dnd-kit
- **Rich Text**: Tiptap
- **Database**: Supabase + TypeScript

### **성능 및 최적화**
- **Code Splitting**: 미션 타입별 컴포넌트 lazy loading
- **Image Optimization**: Next.js Image component 활용
- **Caching Strategy**: SWR 기반 효율적 데이터 캐싱
- **Mobile Performance**: 모바일 최적화 인터페이스

### **접근성 및 사용성**
- **Keyboard Navigation**: 전체 인터페이스 키보드 네비게이션 지원
- **Screen Reader**: 스크린 리더 호환성
- **Color Contrast**: WCAG 2.1 AA 기준 준수
- **Responsive Design**: 모든 디바이스 대응

---

## 📊 우선순위 매트릭스

| Phase | 기능 | 우선순위 | 예상 공수 | 비즈니스 임팩트 |
|-------|------|----------|-----------|------------------|
| 3.1 | 미션 수행 인터페이스 리디자인 | High | 3-4주 | 매우 높음 |
| 3.2 | 질문별 입력 컴포넌트 | High | 2-3주 | 높음 |
| 3.3 | 실시간 Validation | High | 1-2주 | 높음 |
| 4.1 | PostCard 업데이트 | Medium | 2주 | 중간 |
| 4.2 | 미션별 표시 방식 | Medium | 1-2주 | 중간 |
| 5.1 | 미션 갤러리 | Low | 2-3주 | 낮음 |
| 5.2 | 채점 시스템 | Low | 3-4주 | 중간 |
| 5.3 | Analytics | Low | 4-5주 | 낮음 |

---

## 🚀 Quick Wins

### **즉시 구현 가능한 개선사항**
1. **Mission Type Icons**: 기존 MissionCard에 타입별 아이콘 추가 (1일)
2. **Progress Indicators**: 미션 수행 중 진행률 표시 (2일)
3. **Better Error Messages**: 사용자 친화적 오류 메시지 (1일)
4. **Loading States**: 적절한 로딩 상태 표시 (1일)

### **단계별 롤아웃 전략**
1. **Week 1-2**: 미션 수행 인터페이스 기본 리디자인
2. **Week 3-4**: 질문 타입별 입력 컴포넌트 구현
3. **Week 5-6**: PostCard 업데이트 및 표시 방식 개선
4. **Week 7+**: 고급 기능 순차적 도입

---

## 📝 개발 노트

### **현재 한계사항**
- 미션 수행 인터페이스가 단일 Rich Text Editor 기반
- PostCard가 구조화된 답안 표시 미지원
- 실시간 validation 및 progress tracking 부재
- 모바일 사용성 개선 필요

### **설계 원칙**
- **Progressive Enhancement**: 기본 기능부터 고급 기능까지 단계적 확장
- **Backward Compatibility**: 기존 Legacy 미션들과 완전 호환
- **Mobile First**: 모바일 환경을 우선 고려한 설계
- **Accessibility**: 모든 사용자가 접근 가능한 인터페이스
- **Performance**: 빠른 로딩과 반응성 우선

### **Risk Mitigation**
- **Feature Flags**: 새 기능들을 점진적으로 롤아웃
- **A/B Testing**: 인터페이스 변경사항 사용자 테스트
- **Rollback Plan**: 문제 발생 시 빠른 롤백 가능한 구조
- **User Training**: 새 인터페이스 사용법 가이드 제공

---

*Last Updated: 2024-12-19*  
*Version: 1.0*  
*Contributors: Claude Code Assistant*