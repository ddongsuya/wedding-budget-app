-- Venue Contracts Table Migration
-- 식장 계약 정보 테이블 생성

-- Create venue_contracts table
CREATE TABLE IF NOT EXISTS venue_contracts (
    id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    couple_id INTEGER NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    
    -- 1. 행사 관련 정보
    event_datetime TIMESTAMP WITH TIME ZONE,
    event_datetime_memo TEXT,
    event_location VARCHAR(200),           -- 행사장소 (홀 이름 등)
    event_location_memo TEXT,
    reception_hall VARCHAR(200),           -- 피로연장
    reception_hall_memo TEXT,
    guaranteed_guests INTEGER DEFAULT 0,   -- 식사보증인원
    guaranteed_guests_memo TEXT,
    meal_ticket_count INTEGER DEFAULT 0,   -- 식권 갯수
    meal_ticket_memo TEXT,
    
    -- 신랑/신부 정보
    groom_name VARCHAR(100),
    groom_contact VARCHAR(50),
    bride_name VARCHAR(100),
    bride_contact VARCHAR(50),
    couple_info_memo TEXT,
    
    -- 2. 식사 관련
    meal_course_name VARCHAR(200),         -- 식사 코스명
    meal_course_price BIGINT DEFAULT 0,    -- 1인당 요금
    meal_total_price BIGINT DEFAULT 0,     -- 총액
    meal_course_memo TEXT,
    alcohol_service_included BOOLEAN DEFAULT FALSE,  -- 주류 무료제공 여부
    alcohol_service_price BIGINT DEFAULT 0,          -- 주류 가격 (유료 시)
    alcohol_service_memo TEXT,
    
    -- 3. 대관 관련
    hall_rental_fee BIGINT DEFAULT 0,      -- 홀대관료
    hall_rental_fee_memo TEXT,
    hall_rental_fee_status VARCHAR(20) DEFAULT 'pending',  -- pending/completed
    
    wedding_supplies TEXT,                 -- 혼구용품 내용
    wedding_supplies_fee BIGINT DEFAULT 0,
    wedding_supplies_memo TEXT,
    wedding_supplies_status VARCHAR(20) DEFAULT 'pending',
    
    -- 예식장비
    equipment_lighting BOOLEAN DEFAULT FALSE,        -- 조명
    equipment_lighting_fee BIGINT DEFAULT 0,
    equipment_lighting_memo TEXT,
    equipment_video BOOLEAN DEFAULT FALSE,           -- 영상연출
    equipment_video_fee BIGINT DEFAULT 0,
    equipment_video_memo TEXT,
    equipment_bgm BOOLEAN DEFAULT FALSE,             -- BGM
    equipment_bgm_fee BIGINT DEFAULT 0,
    equipment_bgm_memo TEXT,
    equipment_confetti BOOLEAN DEFAULT FALSE,        -- 축포
    equipment_confetti_fee BIGINT DEFAULT 0,
    equipment_confetti_memo TEXT,
    equipment_status VARCHAR(20) DEFAULT 'pending',
    
    -- 폐백
    pyebaek_included BOOLEAN DEFAULT FALSE,
    pyebaek_fee BIGINT DEFAULT 0,
    pyebaek_memo TEXT,
    pyebaek_status VARCHAR(20) DEFAULT 'pending',
    
    -- 4. 특전 관련
    benefit_hotel_room BOOLEAN DEFAULT FALSE,        -- 호텔룸 제공
    benefit_hotel_room_memo TEXT,
    benefit_meals BOOLEAN DEFAULT FALSE,             -- 식사 제공
    benefit_meals_memo TEXT,
    benefit_wedding_cake BOOLEAN DEFAULT FALSE,      -- 웨딩 케익
    benefit_wedding_cake_memo TEXT,
    benefit_other TEXT,                              -- 기타 특전
    
    -- 5. 계약 관련
    deposit_amount BIGINT DEFAULT 0,                 -- 계약금
    deposit_paid BOOLEAN DEFAULT FALSE,
    deposit_paid_date DATE,
    deposit_memo TEXT,
    
    date_change_condition TEXT,                      -- 날짜 변경 조건
    cancellation_penalty TEXT,                       -- 위약금 조건
    contract_memo TEXT,                              -- 계약 관련 기타 메모
    
    -- 메타 정보
    total_contract_amount BIGINT DEFAULT 0,          -- 총 계약 금액
    total_paid_amount BIGINT DEFAULT 0,              -- 총 지불 금액
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(venue_id)  -- 하나의 식장에 하나의 계약만
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_venue_contracts_venue_id ON venue_contracts(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_contracts_couple_id ON venue_contracts(couple_id);

-- Add comment
COMMENT ON TABLE venue_contracts IS '식장 계약 상세 정보 테이블';

-- Create venue_contract_expenses table for linking expenses
CREATE TABLE IF NOT EXISTS venue_contract_expenses (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER NOT NULL REFERENCES venue_contracts(id) ON DELETE CASCADE,
    expense_id INTEGER REFERENCES expenses(id) ON DELETE SET NULL,
    expense_type VARCHAR(50) NOT NULL,  -- hall_rental, meal, equipment, pyebaek, deposit, etc.
    amount BIGINT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',  -- pending/completed
    due_date DATE,
    paid_date DATE,
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_venue_contract_expenses_contract ON venue_contract_expenses(contract_id);
CREATE INDEX IF NOT EXISTS idx_venue_contract_expenses_expense ON venue_contract_expenses(expense_id);

COMMENT ON TABLE venue_contract_expenses IS '식장 계약 관련 지출 연동 테이블';
