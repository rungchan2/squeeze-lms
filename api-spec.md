# 📘 API Design Canvas & Spec

## 📊 구현 현황 (2025-08-12)
- ✅ **배포 완료**: Vercel에 성공적으로 배포
- ✅ **인증 시스템**: Supabase JWT 토큰 검증 구현
- ✅ **NLP 서비스**: 한국어 형태소 분석 (konlpy/Okt) + fallback
- ✅ **캐싱 시스템**: Redis 캐싱 (serverless 최적화)
- ✅ **Health Check**: 서비스 상태 모니터링
- ✅ **범위별 분석**: journey_id/journey_week_id 필터링 구현 완료
- ✅ **CORS 설정**: 환경변수 기반 CORS origins 지원

### 구현된 엔드포인트
- `GET /` - 루트 엔드포인트
- `GET /api/v1/health` - 헬스체크 ✅
- `POST /api/v1/analyze/word-frequency` - 단일 텍스트 단어 빈도 분석 ✅
- `GET /api/v1/analyze/range-word-frequency` - 범위별 단어 빈도 분석 ✅
- `POST /api/v1/analyze/group-words` - 단어 그룹핑 ✅

## 1. Canvas

### 1.1 목적
- **Text Analysis**: 주관식 답변에 대한 단어 빈도 분석 및 유사도 기반 단어 그룹 제공
- **Simple API**: 간단한 텍스트 입력으로 형태소 분석 및 단어 빈도 계산
- **Caching**: 분석 결과 캐싱을 통한 빠른 응답

### 1.2 핵심 지표
- 캐시 적중 응답 p50 < 200ms, 미적중 p95 < 2.5s
- 동일 파라미터 요청은 Redis/Supabase 캐시에 의해 재계산 없이 응답

### 1.3 주요 사용자
- **교사**: 텍스트 분석 리포트 조회, 단어 빈도 분석
- **관리자**: 전체 시스템 분석, 사용자 관리

### 1.4 데이터 소스
- **Core Tables**: posts (content/answers_data), journeys, journey_weeks, journey_mission_instances
- **User Data**: profiles, user_journeys
- **Analysis Cache**: Redis + Supabase persistent cache

### 1.5 보안
- JWT 기반 인증, RLS로 organization/journey 단위 접근 제한
- 역할 기반 권한: user(학생) < teacher(교사) < admin(관리자)

### 1.6 성능 전략
- **Simple Processing**: 텍스트 기반 처리로 빠른 응답
- **Caching**: Redis + Supabase 이중 캐시로 분석 결과 저장
- **Korean NLP**: Okt 라이브러리로 한국어 형태소 분석

### 1.7 실패 처리
- 텍스트 파라미터 검증 실패: 400 Bad Request
- 분석 API 오류: 캐시된 이전 결과 반환 + 에러 로깅
- 데이터 없음: 200 OK with 빈 배열

---

## 2. Endpoints (구현 완료)

### 2.1 단일 텍스트 단어 빈도 분석 ✅
**endpoint :** `/api/v1/analyze/word-frequency`

**기능 :** 텍스트 입력으로 한국어 형태소 분석 후 단어 빈도 계산. 불용어 제거 포함.

**method :** POST

**body, params :**
```json
{
  "text": "팀워크는 소통과 협업을 통해 달성된다. 좋은 협업이 프로젝트 성공의 열쇠다."
}
```

**response :**
```json
{
  "word_frequency": [
    ["팀워크", 1],
    ["소통", 1], 
    ["협업", 2],
    ["프로젝트", 1],
    ["성공", 1]
  ],
  "total_words": 6,
  "unique_words": 5,
  "processed_at": "2025-01-26T10:00:00Z"
}
```

---

### 2.2 범위별 단어 빈도 분석 ✅ (CACHED)
**endpoint :** `/api/v1/analyze/range-word-frequency`

**기능 :** journey/week/mission/student 범위별 posts 데이터에서 단어 빈도 분석. 캐시 우선. JOIN 쿼리를 통한 정확한 필터링 구현.

**method :** GET

**body, params :** query → journey_id, journey_week_id, mission_instance_id, user_id, top_n, min_count, force_refresh

**구현 특징:**
- journey_mission_instances → journey_weeks JOIN을 통한 정확한 필터링
- AnalysisScope enum과 호환되는 소문자 scope 값 반환
- 캐시 미스 시 자동으로 데이터베이스에서 조회 후 분석

**response :**
```json
{
  "scope": "journey_week",
  "range": {"journey_id":"uuid","journey_week_id":"uuid"},
  "cache_hit": true,
  "word_frequency": [
    ["협업", 123],
    ["소통", 89],
    ["팀워크", 67],
    ["프로젝트", 45]
  ],
  "total_posts": 45,
  "analyzed_at": "2025-01-26T10:00:00Z"
}
```

---

### 2.3 단어 그룹핑 ✅
**endpoint :** `/api/v1/analyze/group-words`

**기능 :** 단어 리스트를 유사도 기반으로 그룹화

**method :** POST

**body, params :**
```json
{
  "words": ["소통","협업","대화","책임","신뢰","팀워크"],
  "n_clusters": 3
}
```

**response :**
```json
{
  "groups": [
    {
      "label": "소통 관련",
      "words": ["소통","대화"]
    },
    {
      "label": "협업 관련", 
      "words": ["협업","팀워크"]
    },
    {
      "label": "신뢰 관련",
      "words": ["책임","신뢰"]
    }
  ],
  "total_groups": 3
}
```

---

### 2.4 헬스체크 ✅
**endpoint :** `/api/v1/health`

**기능 :** 서비스 상태 및 데이터베이스 연결 확인 (Serverless 최적화)

**method :** GET

**body, params :** 없음

**response :**
```json
{
  "status": "healthy",  // Redis 실패시에도 Supabase만 정상이면 healthy
  "version": "1.0.0",
  "services": {
    "redis": "healthy",    // serverless에서는 non-critical
    "supabase": "healthy"  // 필수 서비스
  },
  "uptime_seconds": 3600
}
```

**특징:**
- Serverless 환경에서 Redis를 선택적 서비스로 처리
- 병렬 health check으로 성능 향상
- 타임아웃 처리로 hanging 방지


---

## 3. 구현 가이드라인

### 3.1 API 응답 표준
- **단순성**: 최소한의 필드로 명확한 응답 구조
- **일관성**: 모든 단어 빈도는 `[단어, 빈도수]` 배열 형태
- **에러 처리**: 400/500 상태 코드와 명확한 에러 메시지
- **버전 관리**: `/api/v1/` 접두사

### 3.2 성능 최적화  
- **캐시 전략**: Redis 캐시 우선, TTL 7일
- **한국어 NLP**: Okt 라이브러리로 형태소 분석
- **불용어 제거**: 조사, 어미 등 의미없는 단어 제거

### 3.3 보안
- **인증**: JWT 토큰 기반
- **권한**: teacher/admin만 분석 API 접근
- **데이터 격리**: organization 단위 데이터 분리

---

## 4. 구현 세부사항

### 4.1 인증 시스템
- **Supabase JWT 토큰 지원**
  - Bearer Token
  - Session 토큰 (sb-access-token, sb-refresh-token)
  - Custom auth hook 토큰
- **다양한 토큰 형식 자동 감지**

### 4.2 NLP 처리
- **Production (Vercel)**
  - konlpy 사용 불가 (jpype1 컴파일 오류)
  - Fallback: 기본 regex 토큰화
  - nltk 라이브러리 지원
  
- **Development**
  - konlpy/Okt 완전 지원
  - 정확한 한국어 형태소 분석

### 4.3 Redis 캐싱
- **Serverless 최적화**
  - Connection pooling
  - Health check with timeout
  - Event loop 처리
  - 연결 실패시 graceful degradation

### 4.4 배포
- **Vercel 배포 완료**
  - vercel.json 설정
  - requirements.txt 최적화
  - 환경 변수 설정 완료
  - CORS 환경변수 지원 (ALLOWED_ORIGINS)

## 5. 향후 개선사항
- Rate limiting 구현
- 더 정교한 한국어 NLP (Cloud API 활용)
- 실시간 분석 WebSocket 지원
- 분석 결과 시각화 API

모든 응답은 Pydantic 스키마로 검증되며, 단어 빈도는 `[단어, 횟수]` 형태의 배열로 일관성있게 반환됩니다.
"
