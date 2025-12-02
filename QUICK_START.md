# 빠른 시작 가이드

## 자동 설치 스크립트 사용

### 1단계: 데이터베이스 생성 및 백엔드 설정

**방법 A: 자동 설정 (권장)**

`backend/setup.bat` 파일을 더블클릭하세요.

- PostgreSQL 비밀번호를 입력하라고 나오면 입력하세요
- 자동으로 데이터베이스 생성, 의존성 설치, 마이그레이션을 실행합니다

**방법 B: 수동 설정**

1. `backend/create-db.bat` 더블클릭 → 비밀번호 입력
2. 터미널에서:
   ```bash
   cd backend
   npm install
   npm run migrate
   ```

### 2단계: 프론트엔드 의존성 설치

터미널에서:
```bash
npm install
```

### 3단계: 서버 실행

**터미널 2개를 열어서:**

**터미널 1 (백엔드):**
- `start-backend.bat` 더블클릭
- 또는 터미널에서: `cd backend && npm run dev`

**터미널 2 (프론트엔드):**
- `start-frontend.bat` 더블클릭
- 또는 터미널에서: `npm run dev`

### 4단계: 브라우저에서 접속

http://localhost:5173

## 문제 해결

### "psql을 찾을 수 없습니다"

PostgreSQL 경로가 다른 경우 `backend/setup.bat` 파일을 열어서 경로를 수정하세요:

```batch
"C:\Program Files\PostgreSQL\18\bin\psql.exe"
```

버전 번호(18)를 설치된 버전으로 변경하세요.

### "database already exists"

이미 데이터베이스가 생성되어 있습니다. 계속 진행하세요.

### 포트 충돌

다른 프로그램이 포트를 사용 중인 경우:
- 백엔드: `backend/.env`에서 `PORT=3001`로 변경
- 프론트엔드: `.env.local`에서 `VITE_API_URL=http://localhost:3001/api`로 변경

## 수동 명령어

자동 스크립트가 작동하지 않으면 수동으로 실행하세요:

### 데이터베이스 생성
```bash
# SQL Shell (psql) 실행 후
CREATE DATABASE wedding_budget;
\q
```

### 백엔드 설정
```bash
cd backend
npm install
npm run migrate
npm run dev
```

### 프론트엔드 설정
```bash
npm install
npm run dev
```

## 완료!

모든 것이 정상적으로 실행되면:
- 백엔드: http://localhost:3000
- 프론트엔드: http://localhost:5173

회원가입하고 앱을 사용하세요! 🎉
