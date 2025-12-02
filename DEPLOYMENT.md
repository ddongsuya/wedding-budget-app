# 배포 환경 및 설정

## 📋 목차
1. [배포 구조](#배포-구조)
2. [환경 변수](#환경-변수)
3. [CI/CD 파이프라인](#cicd-파이프라인)
4. [모니터링](#모니터링)

---

## 배포 구조

```
사용자 브라우저
    ↓
Vercel (프론트엔드)
https://wedding-budget-app.vercel.app
    ↓ API 요청
Render (백엔드)
https://wedding-budget-app.onrender.com
    ↓ 데이터베이스 쿼리
Supabase (PostgreSQL)
db.avljequxqmdlsbevqxff.supabase.co
```

---

## 환경 변수

### 프론트엔드 (Vercel)
```env
VITE_API_URL=https://wedding-budget-app.onrender.com/api
```

### 백엔드 (Render)
```env
# 서버 설정
NODE_ENV=production
PORT=10000

# 데이터베이스 (Supabase)
DB_HOST=db.avljequxqmdlsbevqxff.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=<Supabase 비밀번호>

# JWT 인증
JWT_SECRET=<랜덤 문자열 32자+>
JWT_REFRESH_SECRET=<랜덤 문자열 32자+>
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# 파일 업로드
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880

# CORS
CORS_ORIGIN=https://wedding-budget-app.vercel.app
```

---

## CI/CD 파이프라인

### 자동 배포 플로우

```
코드 수정
  ↓
git add .
git commit -m "메시지"
git push
  ↓
GitHub (main 브랜치)
  ↓
┌─────────────────┬─────────────────┐
│                 │                 │
Vercel 자동 배포  Render 자동 배포
(프론트엔드)      (백엔드)
│                 │
2-3분 소요        5-10분 소요
│                 │
배포 완료         배포 완료
```

### 배포 트리거
- **Vercel**: main 브랜치에 push 시 자동 배포
- **Render**: main 브랜치에 push 시 자동 배포
- **수동 배포**: 각 플랫폼에서 "Manual Deploy" 가능

---

## 모니터링

### Vercel Analytics
- **위치**: Vercel 프로젝트 → Analytics 탭
- **확인 가능 항목**:
  - 방문자 수
  - 페이지 로드 시간
  - 지역별 트래픽
  - 디바이스 분포

### Render Logs
- **위치**: Render 프로젝트 → Logs 탭
- **확인 가능 항목**:
  - 서버 로그
  - 에러 메시지
  - API 요청 로그
  - 빌드 로그

### Supabase Dashboard
- **위치**: Supabase 프로젝트 → Table Editor
- **확인 가능 항목**:
  - 테이블 데이터
  - 쿼리 실행
  - 데이터베이스 크기
  - 연결 수

---

## 성능 최적화

### 프론트엔드
- Vite 빌드 최적화
- 코드 스플리팅
- 이미지 lazy loading
- localStorage 캐싱

### 백엔드
- 데이터베이스 인덱스
- 페이지네이션
- 이미지 최적화 (Sharp)
- Connection pooling

### 데이터베이스
- 인덱스 8개
- Foreign key constraints
- Cascade delete

---

## 보안

### 인증
- JWT 액세스 토큰 (7일)
- JWT 리프레시 토큰 (30일)
- bcrypt 비밀번호 해싱 (salt rounds: 10)

### 데이터 격리
- 모든 쿼리에 couple_id 필터
- 사용자는 자신의 커플 데이터만 접근 가능

### CORS
- 특정 도메인만 허용
- Credentials 지원

### 입력 검증
- express-validator
- SQL injection 방지 (parameterized queries)
- XSS 방지

---

## 백업 및 복구

### Supabase 자동 백업
- 매일 자동 백업
- 7일 보관

### 수동 백업
```bash
# 데이터베이스 백업
pg_dump -h db.avljequxqmdlsbevqxff.supabase.co \
  -U postgres -d postgres > backup.sql

# 복원
psql -h db.avljequxqmdlsbevqxff.supabase.co \
  -U postgres -d postgres < backup.sql
```

---

## 확장 가능성

### 수평 확장
- Render: 인스턴스 추가 가능
- Supabase: 자동 스케일링

### 기능 추가
- 새 API 엔드포인트 추가 시:
  1. Controller 작성
  2. Route 추가
  3. 프론트엔드 API 함수 추가
  4. 커스텀 훅 업데이트

### 데이터베이스 마이그레이션
- 새 테이블/컬럼 추가 시:
  1. `backend/src/config/migrate.ts` 수정
  2. Supabase SQL Editor에서 실행
  3. 또는 로컬에서 `npm run migrate`
