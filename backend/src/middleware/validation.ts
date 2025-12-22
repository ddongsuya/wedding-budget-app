import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult, ValidationChain } from 'express-validator';

/**
 * Validation middleware for express-validator
 * Validates: Requirements 8.1 - Input validation for all API endpoints
 */

// Handle validation errors and return consistent error response
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '입력값이 올바르지 않습니다',
      code: 'VALIDATION_ERROR',
      errors: errors.array().map(err => ({
        field: 'path' in err ? err.path : 'unknown',
        message: err.msg,
      })),
    });
  }
  next();
};

// ============================================
// Common Validators
// ============================================

// Email validation
export const validateEmail = body('email')
  .isEmail()
  .withMessage('유효한 이메일 주소를 입력해주세요')
  .normalizeEmail()
  .isLength({ max: 255 })
  .withMessage('이메일은 255자를 초과할 수 없습니다');

// Password validation
export const validatePassword = body('password')
  .isLength({ min: 8, max: 128 })
  .withMessage('비밀번호는 8자 이상 128자 이하여야 합니다')
  .matches(/^[\x20-\x7E]+$/)
  .withMessage('비밀번호에 허용되지 않는 문자가 포함되어 있습니다');

// New password validation (for password change)
export const validateNewPassword = body('newPassword')
  .isLength({ min: 8, max: 128 })
  .withMessage('새 비밀번호는 8자 이상 128자 이하여야 합니다')
  .matches(/^[\x20-\x7E]+$/)
  .withMessage('비밀번호에 허용되지 않는 문자가 포함되어 있습니다');

// Name validation
export const validateName = body('name')
  .trim()
  .notEmpty()
  .withMessage('이름은 필수입니다')
  .isLength({ max: 100 })
  .withMessage('이름은 100자를 초과할 수 없습니다')
  .matches(/^[가-힣a-zA-Z\s]+$/)
  .withMessage('이름에 허용되지 않는 문자가 포함되어 있습니다');

// ID parameter validation
export const validateIdParam = param('id')
  .isInt({ min: 1 })
  .withMessage('유효한 ID를 입력해주세요')
  .toInt();

// UUID parameter validation
export const validateUuidParam = param('id')
  .isUUID()
  .withMessage('유효한 ID 형식이 아닙니다');

// Positive integer validation
export const validatePositiveInt = (field: string) =>
  body(field)
    .optional()
    .isInt({ min: 0 })
    .withMessage(`${field}은(는) 0 이상의 정수여야 합니다`)
    .toInt();

// Required positive integer validation
export const validateRequiredPositiveInt = (field: string) =>
  body(field)
    .isInt({ min: 0 })
    .withMessage(`${field}은(는) 0 이상의 정수여야 합니다`)
    .toInt();

// Date validation (ISO8601)
export const validateDate = (field: string) =>
  body(field)
    .optional()
    .isISO8601()
    .withMessage(`${field}은(는) 유효한 날짜 형식이어야 합니다`);

// Required date validation
export const validateRequiredDate = (field: string) =>
  body(field)
    .isISO8601()
    .withMessage(`${field}은(는) 유효한 날짜 형식이어야 합니다`);

// String length validation
export const validateStringLength = (field: string, min: number, max: number) =>
  body(field)
    .trim()
    .isLength({ min, max })
    .withMessage(`${field}은(는) ${min}자 이상 ${max}자 이하여야 합니다`);

// Optional string with max length
export const validateOptionalString = (field: string, maxLength: number) =>
  body(field)
    .optional()
    .trim()
    .isLength({ max: maxLength })
    .withMessage(`${field}은(는) ${maxLength}자를 초과할 수 없습니다`);

// Required non-empty string
export const validateRequiredString = (field: string, maxLength: number = 255) =>
  body(field)
    .trim()
    .notEmpty()
    .withMessage(`${field}은(는) 필수입니다`)
    .isLength({ max: maxLength })
    .withMessage(`${field}은(는) ${maxLength}자를 초과할 수 없습니다`);

// Boolean validation
export const validateBoolean = (field: string) =>
  body(field)
    .optional()
    .isBoolean()
    .withMessage(`${field}은(는) true 또는 false여야 합니다`);

// Enum validation
export const validateEnum = (field: string, values: string[]) =>
  body(field)
    .isIn(values)
    .withMessage(`${field}은(는) ${values.join(', ')} 중 하나여야 합니다`);

// Optional enum validation
export const validateOptionalEnum = (field: string, values: string[]) =>
  body(field)
    .optional()
    .isIn(values)
    .withMessage(`${field}은(는) ${values.join(', ')} 중 하나여야 합니다`);

// URL validation
export const validateUrl = (field: string) =>
  body(field)
    .optional()
    .isURL()
    .withMessage(`${field}은(는) 유효한 URL이어야 합니다`)
    .isLength({ max: 2048 })
    .withMessage(`${field}은(는) 2048자를 초과할 수 없습니다`);

// Array validation
export const validateArray = (field: string) =>
  body(field)
    .optional()
    .isArray()
    .withMessage(`${field}은(는) 배열이어야 합니다`);

// Pagination query validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page는 1 이상의 정수여야 합니다')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit는 1 이상 100 이하의 정수여야 합니다')
    .toInt(),
];

// ============================================
// Route-specific Validators
// ============================================

// Auth validators
export const registerValidation = [
  validateEmail,
  validatePassword,
  validateName,
];

export const loginValidation = [
  body('email').isEmail().withMessage('유효한 이메일 주소를 입력해주세요').normalizeEmail(),
  body('password').notEmpty().withMessage('비밀번호를 입력해주세요'),
];

export const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('현재 비밀번호를 입력해주세요'),
  validateNewPassword,
];

export const forgotPasswordValidation = [
  body('email').isEmail().withMessage('유효한 이메일 주소를 입력해주세요').normalizeEmail(),
];

export const resetPasswordValidation = [
  body('email').isEmail().withMessage('유효한 이메일 주소를 입력해주세요').normalizeEmail(),
  body('token').notEmpty().withMessage('인증 토큰이 필요합니다').isLength({ min: 6, max: 10 }),
  validateNewPassword,
];

// Venue validators
export const createVenueValidation = [
  validateRequiredString('name', 200),
  validateOptionalString('type', 50),
  validatePositiveInt('price'),
  validatePositiveInt('capacity'),
  body('rating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('별점은 0-5 사이여야 합니다'),
  validateOptionalString('location', 500),
  validateOptionalString('contact', 100),
  validateOptionalString('notes', 2000),
];

export const updateVenueValidation = [
  validateIdParam,
  validateOptionalString('name', 200),
  validateOptionalString('type', 50),
  validatePositiveInt('price'),
  validatePositiveInt('capacity'),
  body('rating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('별점은 0-5 사이여야 합니다'),
];

// Expense validators
export const createExpenseValidation = [
  validateRequiredString('title', 200),
  validateRequiredPositiveInt('amount'),
  validateRequiredDate('date'),
  validateEnum('payer', ['groom', 'bride']),
  body('category_id').optional().isInt({ min: 1 }).toInt(),
  validateOptionalString('payment_method', 50),
  validateOptionalString('vendor', 200),
  validateOptionalString('notes', 1000),
];

export const updateExpenseValidation = [
  validateIdParam,
  validateOptionalString('title', 200),
  validatePositiveInt('amount'),
  validateDate('date'),
  validateOptionalEnum('payer', ['groom', 'bride']),
  body('category_id').optional().isInt({ min: 1 }).toInt(),
];

// Budget validators
export const updateBudgetValidation = [
  validatePositiveInt('total_budget'),
  body('groom_ratio')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('신랑 비율은 0-100 사이여야 합니다'),
  body('bride_ratio')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('신부 비율은 0-100 사이여야 합니다'),
];

export const createCategoryValidation = [
  validateRequiredString('name', 100),
  validatePositiveInt('budget_amount'),
  validatePositiveInt('order'),
];

// Checklist validators
export const createChecklistCategoryValidation = [
  validateRequiredString('name', 100),
  validatePositiveInt('order'),
  validateOptionalString('color', 20),
];

export const createChecklistItemValidation = [
  validateRequiredString('title', 200),
  body('category_id').optional().isInt({ min: 1 }).toInt(),
  validateDate('due_date'),
  validateOptionalString('memo', 1000),
  validatePositiveInt('priority'),
  validateBoolean('completed'),
];

export const updateChecklistItemValidation = [
  validateIdParam,
  validateOptionalString('title', 200),
  body('category_id').optional().isInt({ min: 1 }).toInt(),
  validateDate('due_date'),
  validateOptionalString('memo', 1000),
  validatePositiveInt('priority'),
  validateBoolean('completed'),
];

// Event validators
export const createEventValidation = [
  validateRequiredString('title', 200),
  validateRequiredDate('date'),
  validateOptionalString('time', 10),
  validateOptionalString('location', 500),
  validateOptionalString('memo', 2000),
  validateOptionalEnum('category', ['venue', 'dress', 'photo', 'honeymoon', 'etc']),
  validateBoolean('is_important'),
];

export const updateEventValidation = [
  validateIdParam,
  validateOptionalString('title', 200),
  validateDate('date'),
  validateOptionalString('time', 10),
  validateOptionalString('location', 500),
  validateOptionalString('memo', 2000),
  validateOptionalEnum('category', ['venue', 'dress', 'photo', 'honeymoon', 'etc']),
  validateBoolean('is_important'),
];

// Notification validators
export const updateNotificationPreferencesValidation = [
  validateBoolean('dday_enabled'),
  validateBoolean('dday_daily'),
  validateBoolean('schedule_enabled'),
  validateBoolean('checklist_enabled'),
  validateBoolean('budget_enabled'),
  validateBoolean('couple_enabled'),
  validateBoolean('announcement_enabled'),
  validateBoolean('push_enabled'),
  body('preferred_time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .withMessage('시간 형식이 올바르지 않습니다 (HH:MM 또는 HH:MM:SS)'),
];

// Photo reference validators
// 카테고리: outdoor(야외), indoor(실내), pose(포즈), props(소품), dress(드레스), suit(수트), makeup(메이크업), etc(기타)
export const createPhotoReferenceValidation = [
  body('image_url')
    .notEmpty()
    .withMessage('이미지 URL은 필수입니다')
    .isLength({ max: 2000000 })
    .withMessage('이미지 데이터가 너무 큽니다 (최대 2MB)'),
  validateOptionalEnum('category', ['outdoor', 'indoor', 'pose', 'props', 'dress', 'suit', 'makeup', 'etc']),
  validateOptionalString('title', 200),
  validateOptionalString('memo', 1000),
  validateArray('tags'),
  validateUrl('source_url'),
  validateBoolean('is_favorite'),
];

export const updatePhotoReferenceValidation = [
  validateIdParam,
  validateOptionalEnum('category', ['outdoor', 'indoor', 'pose', 'props', 'dress', 'suit', 'makeup', 'etc']),
  validateOptionalString('title', 200),
  validateOptionalString('memo', 1000),
  validateArray('tags'),
  validateUrl('source_url'),
  validateBoolean('is_favorite'),
];

// Admin validators
export const createAnnouncementValidation = [
  validateRequiredString('title', 255),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('내용은 필수입니다')
    .isLength({ max: 10000 })
    .withMessage('내용은 10000자를 초과할 수 없습니다'),
  validateOptionalEnum('type', ['notice', 'update', 'event', 'maintenance']),
  body('priority')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('우선순위는 0-10 사이여야 합니다'),
  validateBoolean('is_active'),
  validateDate('start_date'),
  validateDate('end_date'),
];

export const updateAnnouncementValidation = [
  validateIdParam,
  validateOptionalString('title', 255),
  body('content')
    .optional()
    .trim()
    .isLength({ max: 10000 })
    .withMessage('내용은 10000자를 초과할 수 없습니다'),
  validateOptionalEnum('type', ['notice', 'update', 'event', 'maintenance']),
  body('priority')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('우선순위는 0-10 사이여야 합니다'),
  validateBoolean('is_active'),
  validateDate('start_date'),
  validateDate('end_date'),
];

// Couple validators
export const joinCoupleValidation = [
  body('inviteCode')
    .trim()
    .notEmpty()
    .withMessage('초대 코드는 필수입니다')
    .isLength({ min: 6, max: 10 })
    .withMessage('초대 코드 형식이 올바르지 않습니다')
    .isAlphanumeric()
    .withMessage('초대 코드는 영문자와 숫자만 포함해야 합니다'),
];

// Push subscription validators
export const pushSubscriptionValidation = [
  body('subscription')
    .notEmpty()
    .withMessage('구독 정보가 필요합니다'),
  body('subscription.endpoint')
    .notEmpty()
    .withMessage('endpoint가 필요합니다')
    .isURL()
    .withMessage('유효한 endpoint URL이 아닙니다'),
  body('subscription.keys')
    .notEmpty()
    .withMessage('keys가 필요합니다'),
  body('subscription.keys.p256dh')
    .notEmpty()
    .withMessage('p256dh 키가 필요합니다'),
  body('subscription.keys.auth')
    .notEmpty()
    .withMessage('auth 키가 필요합니다'),
];

// Couple profile validators
export const updateCoupleProfileValidation = [
  validateOptionalString('groom_name', 100),
  validateOptionalString('bride_name', 100),
  validateOptionalString('groom_contact', 50),
  validateOptionalString('bride_contact', 50),
  validateDate('groom_birth_date'),
  validateDate('bride_birth_date'),
  validateDate('first_met_date'),
  validateDate('wedding_date'),
  validateOptionalString('couple_nickname', 100),
];
