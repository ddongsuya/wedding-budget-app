/**
 * Tests for Input Validation Middleware
 * 
 * **Feature: project-optimization, Property 7: Input Validation Rejection**
 * **Validates: Requirements 8.1**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import express, { Express, Request, Response } from 'express';
import request from 'supertest';
import { body } from 'express-validator';
import {
  validate,
  validateEmail,
  validatePassword,
  validateRequiredString,
  registerValidation,
  createExpenseValidation,
} from './validation';

describe('Input Validation Tests', () => {
  describe('Email Validation', () => {
    let app: Express;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.post('/test-email', [validateEmail, validate], (_req: Request, res: Response) => {
        res.json({ success: true, email: _req.body.email });
      });
    });

    it('should reject invalid email formats with 400 status', async () => {
      const invalidEmails = ['notanemail', '@nodomain.com', 'spaces in@email.com', ''];

      for (const email of invalidEmails) {
        const response = await request(app).post('/test-email').send({ email });
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should accept valid email formats', async () => {
      const validEmails = ['test@example.com', 'user.name@domain.co.kr', 'user+tag@example.org'];

      for (const email of validEmails) {
        const response = await request(app).post('/test-email').send({ email });
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
    });
  });


  describe('Password Validation', () => {
    let app: Express;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.post('/test-password', [validatePassword, validate], (_req: Request, res: Response) => {
        res.json({ success: true });
      });
    });

    it('should reject passwords shorter than 8 characters', async () => {
      const shortPasswords = ['1234567', 'short', 'abc', ''];

      for (const password of shortPasswords) {
        const response = await request(app).post('/test-password').send({ password });
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      }
    });

    it('should accept valid passwords (8+ characters)', async () => {
      const validPasswords = ['12345678', 'password123', 'securePassword!@#'];

      for (const password of validPasswords) {
        const response = await request(app).post('/test-password').send({ password });
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
    });
  });

  describe('Required String Validation', () => {
    let app: Express;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.post('/test-string', [validateRequiredString('name', 100), validate], (_req: Request, res: Response) => {
        res.json({ success: true, name: _req.body.name });
      });
    });

    it('should reject empty strings', async () => {
      const response = await request(app).post('/test-string').send({ name: '' });
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject strings exceeding max length', async () => {
      const longString = 'a'.repeat(101);
      const response = await request(app).post('/test-string').send({ name: longString });
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should accept valid strings', async () => {
      const validStrings = ['John', 'Test Name', 'Valid String'];

      for (const name of validStrings) {
        const response = await request(app).post('/test-string').send({ name });
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
    });
  });

  describe('Integer Validation', () => {
    let app: Express;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.post('/test-int', [
        body('amount').isInt({ min: 0 }).withMessage('amount must be a non-negative integer'),
        validate
      ], (_req: Request, res: Response) => {
        res.json({ success: true, amount: _req.body.amount });
      });
    });

    it('should reject negative integers', async () => {
      const response = await request(app).post('/test-int').send({ amount: -1 });
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject non-integer strings', async () => {
      const response = await request(app).post('/test-int').send({ amount: 'abc' });
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should accept non-negative integers', async () => {
      const validValues = [0, 1, 100, 1000];

      for (const amount of validValues) {
        const response = await request(app).post('/test-int').send({ amount });
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
    });
  });


  describe('Date Validation', () => {
    let app: Express;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.post('/test-date', [
        body('date').isISO8601().withMessage('date must be a valid ISO8601 date'),
        validate
      ], (_req: Request, res: Response) => {
        res.json({ success: true, date: _req.body.date });
      });
    });

    it('should reject invalid date formats', async () => {
      const invalidDates = ['not-a-date', '2024-13-01', '2024-01-32', ''];

      for (const date of invalidDates) {
        const response = await request(app).post('/test-date').send({ date });
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      }
    });

    it('should accept valid ISO8601 dates', async () => {
      const validDates = ['2024-01-01', '2024-12-31', '2024-06-15T10:30:00Z'];

      for (const date of validDates) {
        const response = await request(app).post('/test-date').send({ date });
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
    });
  });

  describe('Enum Validation', () => {
    let app: Express;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.post('/test-enum', [
        body('payer').isIn(['groom', 'bride']).withMessage('payer must be groom or bride'),
        validate
      ], (_req: Request, res: Response) => {
        res.json({ success: true, payer: _req.body.payer });
      });
    });

    it('should reject values not in enum', async () => {
      const invalidValues = ['invalid', 'other', 'unknown'];

      for (const payer of invalidValues) {
        const response = await request(app).post('/test-enum').send({ payer });
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      }
    });

    it('should accept valid enum values', async () => {
      const validValues = ['groom', 'bride'];

      for (const payer of validValues) {
        const response = await request(app).post('/test-enum').send({ payer });
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
    });
  });

  describe('Registration Validation', () => {
    let app: Express;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.post('/register', registerValidation, validate, (_req: Request, res: Response) => {
        res.json({ success: true });
      });
    });

    it('should reject registration with missing fields', async () => {
      const incompleteData = [
        { email: 'test@test.com', password: 'password123' },
        { email: 'test@test.com', name: 'Test User' },
        { password: 'password123', name: 'Test User' },
        {},
      ];

      for (const data of incompleteData) {
        const response = await request(app).post('/register').send(data);
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should accept valid registration data', async () => {
      const response = await request(app).post('/register').send({
        email: 'test@test.com',
        password: 'password123',
        name: 'Test User',
      });
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Expense Creation Validation', () => {
    let app: Express;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.post('/expense', createExpenseValidation, validate, (_req: Request, res: Response) => {
        res.json({ success: true });
      });
    });

    it('should reject expense with invalid payer', async () => {
      const response = await request(app).post('/expense').send({
        title: 'Test Expense',
        amount: 10000,
        date: '2024-01-01',
        payer: 'invalid',
      });
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject expense with negative amount', async () => {
      const response = await request(app).post('/expense').send({
        title: 'Test Expense',
        amount: -100,
        date: '2024-01-01',
        payer: 'groom',
      });
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should accept valid expense data', async () => {
      const response = await request(app).post('/expense').send({
        title: 'Test Expense',
        amount: 10000,
        date: '2024-01-01',
        payer: 'groom',
      });
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Validation Error Response Format', () => {
    let app: Express;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.post('/test', [
        body('email').isEmail().withMessage('유효한 이메일을 입력해주세요'),
        body('name').notEmpty().withMessage('이름은 필수입니다'),
        validate
      ], (_req: Request, res: Response) => {
        res.json({ success: true });
      });
    });

    it('should return consistent error response format', async () => {
      const response = await request(app).post('/test').send({ email: 'invalid', name: '' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
      
      response.body.errors.forEach((error: { field: string; message: string }) => {
        expect(error).toHaveProperty('field');
        expect(error).toHaveProperty('message');
      });
    });
  });
});
