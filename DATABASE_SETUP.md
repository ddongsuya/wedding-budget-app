# 데이터베이스 설정 가이드

## 1. 현재 데이터베이스

**PostgreSQL 14+** 를 사용합니다.

### 왜 PostgreSQL인가?
- 무료 오픈소스
- 안정적이고 성능이 우수
- JSON 데이터 타입 지원
- 풍부한 클라우드 호스팅 옵션
- 관계형 데이터에 최적화

## 2. 로컬 개발 환경 설정

### Windows

#### 방법 1: PostgreSQL 설치 프로그램 (권장)

1. **다운로드**
   - https://www.postgresql.org/download/windows/
   - PostgreSQL 14 이상 버전 다운로드

2. **설치**
   - 설치 프로그램 실행
   - 기본 포트: 5432
   - 슈퍼유저 비밀번호 설정 (기억해두세요!)
   - Stack Builder는 건너뛰어도 됩니다

3. **환경 변수 설정** (선택사항)
   - 시스템 환경 변수에 PostgreSQL bin 경로 추가
   - 예: `C:\Program Files\PostgreSQL\14\bin`

4. **데이터베이스 생성**
   ```cmd
   # psql 실행 (시작 메뉴에서 "SQL Shell (psql)" 검색)
   # 또는 명령 프롬프트에서:
   psql -U postgres
   
   # 비밀번호 입력 후
   CREATE DATABASE wedding_budget;
   
   # 확인
   \l
   
   # 종료
   \q
   ```

#### 방법 2: Docker 사용

```cmd
# Docker Desktop 설치 필요
docker run --name wedding-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=wedding_budget -p 5432:5432 -d postgres:14

# 확인
docker ps
```

### macOS

#### 방법 1: Homebrew (권장)

```bash
# Homebrew 설치 (없는 경우)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# PostgreSQL 설치
brew install postgresql@14

# 서비스 시작
brew services start postgresql@14

# 데이터베이스 생성
createdb wedding_budget

# 확인
psql wedding_budget
```

#### 방법 2: Postgres.app

1. https://postgresapp.com/ 에서 다운로드
2. 앱 실행
3. "Initialize" 클릭
4. 터미널에서 데이터베이스 생성:
   ```bash
   createdb wedding_budget
   ```

### Linux (Ubuntu/Debian)

```bash
# PostgreSQL 설치
sudo apt update
sudo apt install postgresql postgresql-contrib

# 서비스 시작
sudo systemctl start postgresql
sudo systemctl enable postgresql

# postgres 사용자로 전환
sudo -i -u postgres

# 데이터베이스 생성
createdb wedding_budget

# psql 접속
psql wedding_budget

# 종료
exit
```

## 3. .env 파일 설정

### 기본 설정

`backend/.env` 파일을 생성하고 다음 내용을 입력하세요:

```env
PORT=3000
NODE_ENV=development

# Database - 로컬 PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wedding_budget
DB_USER=postgres
DB_PASSWORD=your_password_here  # 설치 시 설정한 비밀번호

# JWT - 보안을 위해 반드시 변경하세요!
JWT_SECRET=your-super-secret-key-change-this-now
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-key-also-change-this
JWT_REFRESH_EXPIRES_IN=30d

# Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 설정 값 설명

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `DB_HOST` | 데이터베이스 호스트 | localhost |
| `DB_PORT` | PostgreSQL 포트 | 5432 |
| `DB_NAME` | 데이터베이스 이름 | wedding_budget |
| `DB_USER` | 데이터베이스 사용자 | postgres |
| `DB_PASSWORD` | 데이터베이스 비밀번호 | (설정 필요) |
| `JWT_SECRET` | JWT 토큰 암호화 키 | (변경 필수!) |
| `JWT_REFRESH_SECRET` | 리프레시 토큰 키 | (변경 필수!) |

### JWT Secret 생성 방법

안전한 랜덤 문자열을 생성하세요:

```bash
# Node.js 사용
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 또는 온라인 생성기
# https://randomkeygen.com/
```

## 4. 데이터베이스 마이그레이션

환경 변수 설정 후 테이블을 생성하세요:

```bash
cd backend
npm run migrate
```

성공 메시지가 표시되면 완료입니다!

### 마이그레이션 확인

```bash
# psql 접속
psql -U postgres -d wedding_budget

# 테이블 목록 확인
\dt

# 예상 테이블:
# - users
# - couples
# - couple_profiles
# - budget_settings
# - budget_categories
# - venues
# - expenses

# 종료
\q
```

## 5. 연결 테스트

백엔드 서버를 실행하여 연결을 테스트하세요:

```bash
cd backend
npm run dev
```

다음과 같은 메시지가 표시되면 성공:
```
Server running on port 3000
Environment: development
```

## 6. 클라우드 데이터베이스 (배포용)

### 추천 무료 클라우드 DB 서비스

#### 1. **Supabase** (가장 추천!)

**장점:**
- PostgreSQL 기반
- 무료 플랜: 500MB 데이터베이스
- 자동 백업
- 실시간 기능 지원
- 간편한 설정

**설정 방법:**
1. https://supabase.com 회원가입
2. 새 프로젝트 생성
3. Database 설정에서 연결 정보 확인
4. `.env` 업데이트:
   ```env
   DB_HOST=db.xxxxxxxxxxxxx.supabase.co
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=your_supabase_password
   ```

#### 2. **Neon** (서버리스 PostgreSQL)

**장점:**
- 무료 플랜: 3GB 스토리지
- 자동 스케일링
- 빠른 콜드 스타트
- 브랜치 기능 (개발/프로덕션 분리)

**설정 방법:**
1. https://neon.tech 회원가입
2. 프로젝트 생성
3. 연결 문자열 복사
4. `.env` 업데이트

#### 3. **Railway**

**장점:**
- PostgreSQL + 백엔드 호스팅 통합
- 무료 플랜: $5 크레딧/월
- GitHub 연동 자동 배포
- 간편한 환경 변수 관리

**설정 방법:**
1. https://railway.app 회원가입
2. New Project → PostgreSQL 선택
3. 자동 생성된 환경 변수 사용

#### 4. **ElephantSQL**

**장점:**
- 무료 플랜: 20MB (소규모 프로젝트용)
- 간단한 설정
- 자동 백업

**설정 방법:**
1. https://www.elephantsql.com 회원가입
2. 무료 플랜 선택
3. 인스턴스 생성
4. 연결 정보 복사

#### 5. **Render**

**장점:**
- 무료 PostgreSQL
- 백엔드 호스팅도 무료
- 자동 SSL
- GitHub 연동

**설정 방법:**
1. https://render.com 회원가입
2. New PostgreSQL 선택
3. 무료 플랜 선택
4. 연결 정보 사용

### 비교표

| 서비스 | 무료 용량 | 장점 | 단점 |
|--------|-----------|------|------|
| **Supabase** | 500MB | 풍부한 기능, 실시간 지원 | - |
| **Neon** | 3GB | 서버리스, 브랜치 기능 | 콜드 스타트 |
| **Railway** | $5/월 | 통합 호스팅 | 크레딧 소진 |
| **ElephantSQL** | 20MB | 간단함 | 용량 제한 |
| **Render** | 무제한 | 백엔드 통합 | 느린 시작 |

### 추천 조합

**개발 단계:**
- 로컬 PostgreSQL

**프로토타입/테스트:**
- Supabase 무료 플랜

**프로덕션:**
- Supabase (소규모)
- Neon (중규모)
- Railway (백엔드 + DB 통합)

## 7. 문제 해결

### "psql: command not found"

**Windows:**
- PostgreSQL bin 폴더를 PATH에 추가
- 또는 "SQL Shell (psql)" 앱 사용

**macOS:**
```bash
echo 'export PATH="/usr/local/opt/postgresql@14/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### "connection refused"

1. PostgreSQL이 실행 중인지 확인:
   ```bash
   # Windows
   services.msc 에서 postgresql 서비스 확인
   
   # macOS
   brew services list
   
   # Linux
   sudo systemctl status postgresql
   ```

2. 포트 확인:
   ```bash
   # 5432 포트가 사용 중인지 확인
   netstat -an | grep 5432
   ```

3. 방화벽 확인

### "password authentication failed"

1. `.env` 파일의 비밀번호 확인
2. PostgreSQL 비밀번호 재설정:
   ```bash
   psql -U postgres
   ALTER USER postgres PASSWORD 'new_password';
   ```

### "database does not exist"

```bash
# 데이터베이스 생성
createdb wedding_budget

# 또는 psql에서
psql -U postgres
CREATE DATABASE wedding_budget;
```

## 8. 데이터베이스 관리 도구

### GUI 도구 (선택사항)

1. **pgAdmin** (무료)
   - https://www.pgadmin.org/
   - 공식 PostgreSQL 관리 도구

2. **DBeaver** (무료)
   - https://dbeaver.io/
   - 다양한 DB 지원

3. **TablePlus** (무료/유료)
   - https://tableplus.com/
   - 깔끔한 UI

4. **Postico** (macOS, 무료/유료)
   - https://eggerapps.at/postico/

## 9. 백업 및 복원

### 백업

```bash
# 전체 데이터베이스 백업
pg_dump -U postgres wedding_budget > backup.sql

# 압축 백업
pg_dump -U postgres wedding_budget | gzip > backup.sql.gz
```

### 복원

```bash
# SQL 파일에서 복원
psql -U postgres wedding_budget < backup.sql

# 압축 파일에서 복원
gunzip -c backup.sql.gz | psql -U postgres wedding_budget
```

## 10. 보안 권장사항

1. **프로덕션 환경:**
   - 강력한 비밀번호 사용
   - JWT Secret 변경
   - SSL/TLS 연결 사용
   - 정기적인 백업

2. **환경 변수:**
   - `.env` 파일을 Git에 커밋하지 마세요
   - `.gitignore`에 `.env` 추가됨

3. **데이터베이스 사용자:**
   - 프로덕션에서는 별도 사용자 생성
   - 최소 권한 원칙 적용

```sql
-- 새 사용자 생성
CREATE USER wedding_app WITH PASSWORD 'secure_password';

-- 권한 부여
GRANT ALL PRIVILEGES ON DATABASE wedding_budget TO wedding_app;
```

## 도움이 필요하신가요?

문제가 발생하면:
1. 에러 메시지 확인
2. PostgreSQL 로그 확인
3. 연결 정보 재확인
4. 방화벽/보안 설정 확인
