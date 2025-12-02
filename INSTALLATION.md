# 설치 및 실행 가이드

## 프로젝트 구조

```
wedding-budget-app/
├── backend/          # Node.js + Express + PostgreSQL API
├── src/              # React 프론트엔드
├── package.json      # 프론트엔드 의존성
└── README.md
```

## 사전 요구사항

- Node.js 18+ 
- PostgreSQL 14+
- npm 또는 yarn

## 백엔드 설치 및 실행

### 1. PostgreSQL 데이터베이스 생성

```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE wedding_budget;

# 종료
\q
```

### 2. 백엔드 설정

```bash
# 백엔드 디렉토리로 이동
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
```

`.env` 파일을 열어서 데이터베이스 정보를 수정하세요:

```env
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wedding_budget
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this
JWT_REFRESH_EXPIRES_IN=30d

# Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

### 3. 데이터베이스 마이그레이션

```bash
npm run migrate
```

### 4. 백엔드 서버 실행

```bash
# 개발 모드
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

서버가 http://localhost:3000 에서 실행됩니다.

## 프론트엔드 설치 및 실행

### 1. 프론트엔드 설정

```bash
# 프로젝트 루트로 이동
cd ..

# 의존성 설치
npm install
```

### 2. 환경 변수 확인

`.env.local` 파일이 이미 생성되어 있습니다:

```env
VITE_API_URL=http://localhost:3000/api
```

### 3. 프론트엔드 실행

```bash
npm run dev
```

프론트엔드가 http://localhost:5173 에서 실행됩니다.

## 테스트

### API 테스트

`backend/api-examples.http` 파일을 사용하여 API를 테스트할 수 있습니다.

VS Code의 REST Client 확장 프로그램을 설치하면 파일 내에서 직접 요청을 보낼 수 있습니다.

### 회원가입 및 로그인

1. 브라우저에서 http://localhost:5173 접속
2. "회원가입" 클릭
3. 이메일, 비밀번호, 이름 입력
4. 회원가입 완료 후 자동 로그인

## 문제 해결

### 포트 충돌

백엔드나 프론트엔드 포트가 이미 사용 중인 경우:

**백엔드 포트 변경:**
```bash
# backend/.env
PORT=3001
```

**프론트엔드 포트 변경:**
```bash
# vite.config.ts에 추가
export default defineConfig({
  server: {
    port: 5174
  }
})
```

### 데이터베이스 연결 오류

1. PostgreSQL이 실행 중인지 확인:
```bash
# Windows
pg_ctl status

# Mac/Linux
sudo service postgresql status
```

2. 데이터베이스 접속 정보가 올바른지 확인
3. 데이터베이스가 생성되었는지 확인

### CORS 오류

백엔드 `src/index.ts`에서 CORS 설정 확인:

```typescript
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

## 프로덕션 배포

### 백엔드 배포

```bash
cd backend
npm run build
npm start
```

### 프론트엔드 배포

```bash
npm run build
```

`dist/` 폴더의 내용을 정적 호스팅 서비스에 배포하세요.

환경 변수를 프로덕션 API URL로 변경:
```env
VITE_API_URL=https://your-api-domain.com/api
```

## 다음 단계

1. 회원가입 및 로그인
2. 커플 연결 (초대 코드 생성 및 공유)
3. 프로필 설정
4. 예산 설정
5. 식장 추가
6. 지출 기록

자세한 API 사용법은 `FRONTEND_API_INTEGRATION.md`를 참고하세요.
