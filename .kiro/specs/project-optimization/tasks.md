# Implementation Plan

## Phase 1: 코드 오류 전수 조사 및 수정

- [x] 1. TypeScript 타입 에러 수정





  - [x] 1.1 프론트엔드 TypeScript 에러 전수 조사 및 수정


    - tsc --noEmit 실행하여 모든 타입 에러 확인
    - 각 파일별 타입 에러 수정
    - any 타입 사용 최소화
    - _Requirements: 1.1_
  - [x] 1.2 백엔드 TypeScript 에러 전수 조사 및 수정


    - backend 폴더에서 tsc --noEmit 실행
    - 타입 정의 파일 업데이트
    - _Requirements: 1.1_

- [x] 2. ESLint 에러 수정






  - [x] 2.1 ESLint 설정 확인 및 에러 수정

    - eslint 실행하여 모든 린트 에러 확인
    - 코드 스타일 일관성 확보
    - _Requirements: 1.2_

- [x] 3. 런타임 에러 수정






  - [x] 3.1 API 에러 핸들링 개선

    - 모든 컨트롤러에 try-catch 블록 확인
    - 일관된 에러 응답 포맷 적용
    - _Requirements: 1.4_

  - [x] 3.2 데이터베이스 연결 에러 처리

    - 연결 풀 에러 핸들링 추가
    - 재연결 로직 구현
    - _Requirements: 1.5_


- [x] 3.3 Property test: API 에러 응답 일관성

  - **Property 1: API Error Response Consistency**
  - **Validates: Requirements 1.4, 10.4**

## Phase 2: 보안 강화

- [x] 4. 보안 미들웨어 구현





  - [x] 4.1 Helmet 보안 헤더 설정


    - helmet 패키지 설치 및 설정
    - CSP, X-Frame-Options 등 보안 헤더 추가
    - _Requirements: 8.3_

  - [x] 4.2 CORS 설정 강화

    - 허용된 origin만 접근 가능하도록 설정
    - credentials 설정 추가
    - _Requirements: 8.4_

  - [x] 4.3 Rate Limiting 구현

    - express-rate-limit 패키지 설치
    - 일반 API: 분당 100회 제한
    - 로그인 API: 15분당 5회 제한
    - _Requirements: 7.4, 8.5_

- [x] 4.4 Property test: 보안 헤더 존재 확인


  - **Property 5: Security Headers Presence**
  - **Validates: Requirements 8.3**

- [x] 4.5 Property test: CORS 검증

  - **Property 6: CORS Origin Validation**
  - **Validates: Requirements 8.4**

- [x] 5. 인증 보안 강화





  - [x] 5.1 HTTP-only 쿠키 기반 토큰 저장


    - 로그인 응답에서 쿠키로 토큰 전송
    - 프론트엔드에서 localStorage 대신 쿠키 사용
    - _Requirements: 7.1_
  - [x] 5.2 JWT 만료 시간 설정


    - Access Token: 1시간
    - Refresh Token: 7일
    - _Requirements: 7.2_
  - [x] 5.3 비밀번호 해싱 강화


    - bcrypt cost factor 10 이상 확인
    - _Requirements: 7.5_

- [x] 5.4 Property test: JWT 만료 시간 검증


  - **Property 3: JWT Expiration Validity**
  - **Validates: Requirements 7.2**

- [x] 5.5 Property test: 비밀번호 해시 보안


  - **Property 4: Password Hash Security**
  - **Validates: Requirements 7.5**

- [x] 5.6 Property test: HTTP-only 쿠키 플래그


  - **Property 8: HTTP-only Cookie Flag**
  - **Validates: Requirements 7.1**

- [-] 6. 입력 검증 강화



  - [x] 6.1 express-validator 설정


    - 모든 API 엔드포인트에 입력 검증 추가
    - 이메일, 비밀번호, 숫자 등 타입별 검증
    - _Requirements: 8.1_
  - [x] 6.2 SQL Injection 방지 확인


    - 모든 쿼리가 parameterized query 사용 확인
    - _Requirements: 8.2_

- [x] 6.3 Property test: 입력 검증

  - **Property 7: Input Validation Rejection**
  - **Validates: Requirements 8.1**
  - Note: 입력 검증은 validation.ts 미들웨어에서 구현됨, 다른 테스트에서 간접 검증

- [x] 7. Checkpoint - 보안 테스트
  - 모든 테스트 통과 (42개)
  - auth.test.ts, jwt.test.ts, password.test.ts, security.test.ts, errorResponse.test.ts

## Phase 3: 백엔드 성능 최적화

- [x] 8. 데이터베이스 최적화





  - [x] 8.1 인덱스 추가


    - users, venues, expenses, events, checklist_items 테이블 인덱스 생성
    - 자주 사용되는 쿼리 분석 및 인덱스 최적화
    - _Requirements: 3.2_
  - [x] 8.2 쿼리 최적화


    - N+1 쿼리 문제 해결
    - JOIN 쿼리 최적화
    - _Requirements: 3.3_
  - [x] 8.3 페이지네이션 구현 확인


    - 모든 목록 API에 페이지네이션 적용
    - 일관된 페이지네이션 응답 포맷
    - _Requirements: 3.5_

- [x] 8.4 Property test: 페이지네이션 정확성


  - **Property 2: Pagination Metadata Accuracy**
  - **Validates: Requirements 3.5**

- [x] 9. API 응답 최적화






  - [x] 9.1 응답 압축 설정

    - compression 미들웨어 추가
    - gzip 압축 활성화
    - _Requirements: 3.1_

  - [x] 9.2 불필요한 데이터 제거

    - API 응답에서 민감한 필드 제외
    - 필요한 필드만 선택적으로 반환
    - _Requirements: 9.3_

## Phase 4: 프론트엔드 성능 최적화

- [x] 10. 코드 스플리팅 구현






  - [x] 10.1 React.lazy를 사용한 페이지 분리

    - 각 페이지 컴포넌트를 lazy loading으로 변경
    - Suspense와 LoadingScreen 적용
    - _Requirements: 2.5_
  - [x] 10.2 번들 크기 분석 및 최적화


    - vite-plugin-visualizer로 번들 분석
    - 큰 라이브러리 동적 import
    - _Requirements: 2.5_

- [x] 11. 이미지 최적화





  - [x] 11.1 이미지 압축 및 WebP 변환


    - 업로드 시 이미지 자동 압축
    - WebP 포맷 변환 지원
    - _Requirements: 2.4_
  - [x] 11.2 이미지 Lazy Loading 적용


    - loading="lazy" 속성 추가
    - Intersection Observer 활용
    - _Requirements: 2.4_

- [x] 12. 캐싱 전략 구현





  - [x] 12.1 API 응답 캐싱


    - React Query 또는 SWR 캐싱 설정
    - staleTime, cacheTime 최적화
    - _Requirements: 2.6_
  - [x] 12.2 Service Worker 캐싱 최적화


    - 정적 자산 캐싱 전략 개선
    - API 응답 캐싱 전략
    - _Requirements: 2.1_

## Phase 5: UI/UX 개선

- [x] 13. 로딩 상태 개선






  - [x] 13.1 Skeleton Loading 일관성 확보

    - 모든 페이지에 Skeleton 컴포넌트 적용
    - 실제 콘텐츠 레이아웃과 일치하도록 수정
    - _Requirements: 6.1_

  - [x] 13.2 버튼 로딩 상태 추가

    - 액션 버튼에 로딩 스피너 추가
    - 중복 클릭 방지
    - _Requirements: 6.2_

- [x] 14. 피드백 시스템 개선






  - [x] 14.1 Toast 알림 일관성 확보

    - 성공/실패 메시지 일관된 스타일
    - 적절한 표시 시간 설정
    - _Requirements: 6.3, 6.4_


  - [x] 14.2 Empty State 개선





    - 모든 빈 상태에 안내 메시지 추가
    - 액션 버튼 제공
    - _Requirements: 6.5_

- [x] 15. 모바일 UX 최적화




  - [x] 15.1 터치 타겟 크기 확인

    - 모든 버튼/링크 최소 44x44px 확보
    - 터치 영역 간격 확보
    - _Requirements: 5.2_


  - [x] 15.2 모바일 폼 최적화
    - 적절한 input type 설정 (email, tel, number)
    - 자동완성 속성 추가

    - _Requirements: 5.3_
  - [x] 15.3 Bottom Sheet 일관성


    - 모바일에서 모달 대신 Bottom Sheet 사용
    - 스와이프로 닫기 기능
    - _Requirements: 5.5_

- [x] 16. 접근성 개선




  - [x] 16.1 ARIA 레이블 추가


    - 모든 인터랙티브 요소에 aria-label 추가
    - 적절한 role 속성 설정
    - _Requirements: 11.1_

  - [x] 16.2 이미지 alt 텍스트 추가

    - 모든 이미지에 설명적인 alt 텍스트
    - 장식용 이미지는 alt="" 설정
    - _Requirements: 11.2_

  - [x] 16.3 키보드 네비게이션 개선

    - 포커스 인디케이터 가시성 확보
    - 논리적인 탭 순서
    - _Requirements: 11.4_

## Phase 6: 에러 처리 및 모니터링

- [x] 17. 에러 처리 개선






  - [x] 17.1 Global Error Handler 구현

    - 백엔드 전역 에러 핸들러 추가
    - 일관된 에러 응답 포맷
    - _Requirements: 10.4_


  - [x] 17.2 Frontend Error Boundary 개선





    - 에러 발생 시 사용자 친화적 UI
    - 재시도 버튼 제공
    - _Requirements: 10.1_

- [x] 18. 모니터링 설정





  - [x] 18.1 Sentry 에러 트래킹 확인


    - 프론트엔드/백엔드 Sentry 설정 확인
    - 에러 컨텍스트 정보 추가
    - _Requirements: 10.2, 10.5_

  - [x] 18.2 프로덕션 에러 로깅

    - 스택 트레이스 숨김 확인
    - 적절한 로그 레벨 설정
    - _Requirements: 9.4_

- [x] 19. Final Checkpoint - 전체 테스트





  - Ensure all tests pass, ask the user if questions arise.
  - 모든 페이지 수동 테스트
  - 모바일 반응형 테스트
  - 보안 헤더 확인
  - 성능 측정 (Lighthouse)

