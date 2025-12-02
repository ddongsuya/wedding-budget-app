# 데이터 플로우 및 주요 기능 상세

## 📋 목차
1. [인증 플로우](#인증-플로우)
2. [데이터 CRUD 플로우](#데이터-crud-플로우)
3. [파일 업로드 플로우](#파일-업로드-플로우)
4. [커플 연결 플로우](#커플-연결-플로우)
5. [통계 계산 로직](#통계-계산-로직)

---

## 인증 플로우

### 1. 회원가입
```
사용자 입력 (이메일, 비밀번호, 이름)
  ↓
Register.tsx → authAPI.register()
  ↓
POST /api/auth/register
  ↓
authController.register()
  - 이메일 중복 확인
  - 비밀번호 해싱 (bcrypt)
  - 사용자 생성
  - JWT 토큰 생성
  ↓
응답: { user, accessToken, refreshToken }
  ↓
AuthContext: 토큰 저장 (localStorage)
  ↓
자동 로그인 → 대시보드로 이동
```

### 2. 로그인
```
사용자 입력 (이메일, 비밀번호)
  ↓
Login.tsx → authAPI.login()
  ↓
POST /api/auth/login
  ↓
authController.login()
  - 사용자 조회
  - 비밀번호 검증 (bcrypt.compare)
  - JWT 토큰 생성
  ↓
응답: { user, accessToken, refreshToken }
  ↓
AuthContext: 토큰 저장
  ↓
대시보드로 이동
```

### 3. 인증된 요청
```
API 요청
  ↓
apiClient 요청 인터셉터
  - localStorage에서 accessToken 가져오기
  - Authorization 헤더에 추가
  ↓
백엔드 auth 미들웨어
  - 토큰 검증
  - 사용자 정보 추출
  - req.user에 저장
  ↓
컨트롤러 실행
  - req.user.id로 사용자 식별
  - req.user.coupleId로 커플 데이터 격리
```

### 4. 토큰 갱신
```
API 요청 → 401 Unauthorized
  ↓
apiClient 응답 인터셉터
  - refreshToken으로 갱신 시도
  ↓
POST /api/auth/refresh
  ↓
새 토큰 발급
  ↓
원래 요청 재시도
  ↓
실패 시 → 로그인 페이지로 리다이렉트
```

---

## 데이터 CRUD 플로우

### 지출 추가 예시

#### 프론트엔드
```typescript
// 1. 사용자가 ExpenseForm에서 데이터 입력
const handleSubmit = async (data) => {
  try {
    // 2. useExpenses 훅 사용
    await addExpense({
      title: '스튜디오 계약금',
      amount: 500000,
      date: '2024-01-15',
      payer: 'groom',
      category_id: 1,
    });
    
    // 3. 성공 시 목록 자동 업데이트
    // 4. 토스트 알림 표시
  } catch (error) {
    // 에러 처리
  }
};
```

#### 백엔드
```typescript
// 1. POST /api/expenses
router.post('/', authenticate, validate, createExpense);

// 2. expenseController.createExpense()
export const createExpense = async (req, res) => {
  const coupleId = req.user.coupleId;  // 커플 ID 자동 추출
  const { title, amount, date, payer, category_id } = req.body;
  
  // 3. 데이터베이스에 저장
  const result = await pool.query(
    'INSERT INTO expenses (...) VALUES (...) RETURNING *',
    [coupleId, title, amount, date, payer, category_id]
  );
  
  // 4. 응답
  res.status(201).json({ expense: result.rows[0] });
};
```

### 목록 조회 (필터링, 정렬, 페이지네이션)

```typescript
// 프론트엔드
const { expenses, pagination } = useExpenses({
  page: 1,
  limit: 20,
  sort: 'date',
  order: 'DESC',
  category_id: 1,
  payer: 'groom',
  start_date: '2024-01-01',
  end_date: '2024-12-31',
});

// 백엔드
GET /api/expenses?page=1&limit=20&sort=date&order=DESC&category_id=1

// SQL 쿼리 동적 생성
SELECT e.*, c.name as category_name
FROM expenses e
LEFT JOIN budget_categories c ON e.category_id = c.id
WHERE e.couple_id = $1
  AND e.category_id = $2
  AND e.payer = $3
  AND e.date >= $4
  AND e.date <= $5
ORDER BY e.date DESC
LIMIT 20 OFFSET 0;

// 응답
{
  expenses: [...],
  pagination: {
    page: 1,
    limit: 20,
    total: 150,
    totalPages: 8
  }
}
```

---

## 파일 업로드 플로우

### 이미지 업로드 (영수증, 프로필 사진)

```
사용자가 파일 선택
  ↓
프론트엔드: FormData 생성
const formData = new FormData();
formData.append('image', file);
  ↓
POST /api/expenses/:id/receipt
Content-Type: multipart/form-data
  ↓
백엔드: Multer 미들웨어
  - 파일 검증 (타입, 크기)
  - uploads/ 폴더에 저장
  - 고유 파일명 생성 (UUID)
  ↓
Sharp로 이미지 최적화
  - 리사이즈 (최대 1200px)
  - 압축 (quality: 80-85)
  ↓
데이터베이스에 URL 저장
  - receipt_image = '/uploads/uuid.jpg'
  ↓
응답: { imageUrl, expense }
  ↓
프론트엔드: 이미지 표시
<img src={`${API_URL}${imageUrl}`} />
```

---

## 커플 연결 플로우

### 1. 초대 코드 생성
```
사용자 A: "초대 코드 생성" 버튼 클릭
  ↓
POST /api/couple/invite
  ↓
coupleController.createInvite()
  - 이미 커플인지 확인
  - 8자리 랜덤 코드 생성 (UUID)
  - couples 테이블에 저장
    user1_id = A
    invite_code = "ABC12345"
  - budget_settings 초기화
  ↓
응답: { inviteCode: "ABC12345" }
  ↓
사용자 A: 코드를 파트너에게 공유
```

### 2. 초대 코드로 연결
```
사용자 B: 초대 코드 입력 "ABC12345"
  ↓
POST /api/couple/join
Body: { inviteCode: "ABC12345" }
  ↓
coupleController.joinCouple()
  - 이미 커플인지 확인
  - 초대 코드로 커플 찾기
  - user2_id = B로 업데이트
  - invite_code = NULL (사용 완료)
  ↓
응답: { couple }
  ↓
사용자 A와 B가 연결됨!
  - 같은 데이터 공유
  - couple_id로 데이터 격리
```

---

## 통계 계산 로직

### 1. 전체 요약 (GET /api/stats/summary)

```sql
-- 총 예산 및 지출
SELECT 
  bs.total_budget,
  bs.groom_ratio,
  bs.bride_ratio,
  COALESCE(SUM(e.amount), 0) as total_spent
FROM budget_settings bs
LEFT JOIN expenses e ON e.couple_id = bs.couple_id
WHERE bs.couple_id = $1
GROUP BY bs.id;

-- 신랑/신부별 지출
SELECT 
  payer,
  SUM(amount) as amount
FROM expenses
WHERE couple_id = $1
GROUP BY payer;

-- 응답
{
  totalBudget: 50000000,
  totalSpent: 15000000,
  remaining: 35000000,
  percentageUsed: 30,
  groomBudget: 30000000,
  groomSpent: 9000000,
  brideBudget: 20000000,
  brideSpent: 6000000,
  topCategories: [...]
}
```

### 2. 카테고리별 통계

```sql
SELECT 
  c.id,
  c.name,
  c.icon,
  c.color,
  c.budget_amount,
  COALESCE(SUM(e.amount), 0) as spent_amount,
  COUNT(e.id) as expense_count,
  CASE 
    WHEN c.budget_amount > 0 
    THEN (SUM(e.amount)::float / c.budget_amount * 100)
    ELSE 0
  END as percentage_used
FROM budget_categories c
LEFT JOIN expenses e ON c.id = e.category_id
WHERE c.couple_id = $1
GROUP BY c.id
ORDER BY spent_amount DESC;
```

### 3. 월별 통계

```sql
SELECT 
  TO_CHAR(date, 'YYYY-MM') as month,
  SUM(amount) as total_amount,
  COUNT(id) as expense_count,
  SUM(CASE WHEN payer = 'groom' THEN amount ELSE 0 END) as groom_amount,
  SUM(CASE WHEN payer = 'bride' THEN amount ELSE 0 END) as bride_amount
FROM expenses
WHERE couple_id = $1
GROUP BY TO_CHAR(date, 'YYYY-MM')
ORDER BY month DESC;
```

---

## 데이터 격리 (커플 단위)

모든 API 요청은 커플 단위로 데이터가 격리됩니다:

```typescript
// 미들웨어에서 coupleId 자동 추출
export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.substring(7);
  const decoded = verifyAccessToken(token);
  
  // 커플 ID 조회
  const result = await pool.query(
    'SELECT id FROM couples WHERE user1_id = $1 OR user2_id = $1',
    [decoded.id]
  );
  
  req.user = {
    id: decoded.id,
    email: decoded.email,
    coupleId: result.rows[0]?.id,  // 자동 추출
  };
  
  next();
};

// 컨트롤러에서 사용
export const getExpenses = async (req, res) => {
  const coupleId = req.user.coupleId;  // 자동으로 사용
  
  // 이 커플의 데이터만 조회
  const result = await pool.query(
    'SELECT * FROM expenses WHERE couple_id = $1',
    [coupleId]
  );
};
```

---

**다음 문서**: [환경 변수 및 배포](DEPLOYMENT.md)
