import { Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../types';

export const getSummary = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    // 예산 설정 조회
    const budgetResult = await pool.query(
      'SELECT * FROM budget_settings WHERE couple_id = $1',
      [coupleId]
    );

    const budget = budgetResult.rows[0] || {
      total_budget: 0,
      groom_ratio: 50,
      bride_ratio: 50,
    };

    // 총 지출 조회
    const totalResult = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total_spent FROM expenses WHERE couple_id = $1',
      [coupleId]
    );

    const totalSpent = parseInt(totalResult.rows[0].total_spent);

    // 신랑/신부별 지출
    const payerResult = await pool.query(
      `SELECT payer, COALESCE(SUM(amount), 0) as amount
       FROM expenses
       WHERE couple_id = $1
       GROUP BY payer`,
      [coupleId]
    );

    const groomSpent = payerResult.rows.find((r) => r.payer === 'groom')?.amount || 0;
    const brideSpent = payerResult.rows.find((r) => r.payer === 'bride')?.amount || 0;

    // 카테고리별 지출 (상위 5개)
    const categoryResult = await pool.query(
      `SELECT c.name, c.icon, c.color, COALESCE(SUM(e.amount), 0) as spent
       FROM budget_categories c
       LEFT JOIN expenses e ON c.id = e.category_id AND e.couple_id = $1
       WHERE c.couple_id = $1
       GROUP BY c.id, c.name, c.icon, c.color
       ORDER BY spent DESC
       LIMIT 5`,
      [coupleId]
    );

    res.json({
      summary: {
        totalBudget: budget.total_budget,
        totalSpent,
        remaining: budget.total_budget - totalSpent,
        percentageUsed: budget.total_budget > 0 
          ? ((totalSpent / budget.total_budget) * 100).toFixed(2)
          : 0,
        groomBudget: (budget.total_budget * budget.groom_ratio) / 100,
        groomSpent: parseInt(groomSpent),
        brideBudget: (budget.total_budget * budget.bride_ratio) / 100,
        brideSpent: parseInt(brideSpent),
        topCategories: categoryResult.rows,
      },
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getByCategory = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    const result = await pool.query(
      `SELECT 
        c.id,
        c.name,
        c.icon,
        c.color,
        c.budget_amount,
        COALESCE(SUM(e.amount), 0) as spent_amount,
        COUNT(e.id) as expense_count,
        CASE 
          WHEN c.budget_amount > 0 THEN (COALESCE(SUM(e.amount), 0)::float / c.budget_amount * 100)
          ELSE 0
        END as percentage_used
       FROM budget_categories c
       LEFT JOIN expenses e ON c.id = e.category_id AND e.couple_id = $1
       WHERE c.couple_id = $1
       GROUP BY c.id, c.name, c.icon, c.color, c.budget_amount
       ORDER BY spent_amount DESC`,
      [coupleId]
    );

    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Get by category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getByMonth = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    const result = await pool.query(
      `SELECT 
        TO_CHAR(date, 'YYYY-MM') as month,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(id) as expense_count,
        COALESCE(SUM(CASE WHEN payer = 'groom' THEN amount ELSE 0 END), 0) as groom_amount,
        COALESCE(SUM(CASE WHEN payer = 'bride' THEN amount ELSE 0 END), 0) as bride_amount
       FROM expenses
       WHERE couple_id = $1
       GROUP BY TO_CHAR(date, 'YYYY-MM')
       ORDER BY month DESC`,
      [coupleId]
    );

    res.json({ months: result.rows });
  } catch (error) {
    console.error('Get by month error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getByPayer = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    // 예산 설정 조회
    const budgetResult = await pool.query(
      'SELECT * FROM budget_settings WHERE couple_id = $1',
      [coupleId]
    );

    const budget = budgetResult.rows[0] || {
      total_budget: 0,
      groom_ratio: 50,
      bride_ratio: 50,
    };

    // 분담자별 지출
    const result = await pool.query(
      `SELECT 
        payer,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(id) as expense_count,
        AVG(amount) as avg_amount
       FROM expenses
       WHERE couple_id = $1
       GROUP BY payer`,
      [coupleId]
    );

    const groomData = result.rows.find((r) => r.payer === 'groom') || {
      payer: 'groom',
      total_amount: 0,
      expense_count: 0,
      avg_amount: 0,
    };

    const brideData = result.rows.find((r) => r.payer === 'bride') || {
      payer: 'bride',
      total_amount: 0,
      expense_count: 0,
      avg_amount: 0,
    };

    const groomBudget = (budget.total_budget * budget.groom_ratio) / 100;
    const brideBudget = (budget.total_budget * budget.bride_ratio) / 100;

    res.json({
      payers: [
        {
          ...groomData,
          total_amount: parseInt(groomData.total_amount),
          budget: groomBudget,
          remaining: groomBudget - parseInt(groomData.total_amount),
          percentage_used: groomBudget > 0 
            ? ((parseInt(groomData.total_amount) / groomBudget) * 100).toFixed(2)
            : 0,
        },
        {
          ...brideData,
          total_amount: parseInt(brideData.total_amount),
          budget: brideBudget,
          remaining: brideBudget - parseInt(brideData.total_amount),
          percentage_used: brideBudget > 0 
            ? ((parseInt(brideData.total_amount) / brideBudget) * 100).toFixed(2)
            : 0,
        },
      ],
    });
  } catch (error) {
    console.error('Get by payer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
