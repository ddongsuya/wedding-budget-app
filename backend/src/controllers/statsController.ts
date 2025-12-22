import { Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../types';

/**
 * Get budget summary with optimized single query for expense aggregations
 * Requirements: 3.3 - N+1 쿼리 문제 해결, JOIN 쿼리 최적화
 */
export const getSummary = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    // 최적화: 예산 설정과 지출 통계를 단일 쿼리로 조회
    const summaryResult = await pool.query(
      `WITH expense_stats AS (
        SELECT 
          COALESCE(SUM(amount), 0) as total_spent,
          COALESCE(SUM(CASE WHEN payer = 'groom' THEN amount ELSE 0 END), 0) as groom_spent,
          COALESCE(SUM(CASE WHEN payer = 'bride' THEN amount ELSE 0 END), 0) as bride_spent
        FROM expenses
        WHERE couple_id = $1
      )
      SELECT 
        bs.total_budget,
        bs.groom_ratio,
        bs.bride_ratio,
        es.total_spent,
        es.groom_spent,
        es.bride_spent
      FROM budget_settings bs
      CROSS JOIN expense_stats es
      WHERE bs.couple_id = $1`,
      [coupleId]
    );

    // 예산 설정이 없는 경우 기본값 사용
    const stats = summaryResult.rows[0] || {
      total_budget: 0,
      groom_ratio: 50,
      bride_ratio: 50,
      total_spent: 0,
      groom_spent: 0,
      bride_spent: 0,
    };

    const totalBudget = Number(stats.total_budget) || 0;
    const groomRatio = Number(stats.groom_ratio) || 50;
    const brideRatio = Number(stats.bride_ratio) || 50;
    const totalSpent = Number(stats.total_spent) || 0;
    const groomSpent = Number(stats.groom_spent) || 0;
    const brideSpent = Number(stats.bride_spent) || 0;

    // 카테고리별 지출 (상위 5개) - 별도 쿼리 유지 (복잡한 집계)
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
        totalBudget,
        totalSpent,
        remaining: totalBudget - totalSpent,
        percentageUsed: totalBudget > 0 
          ? ((totalSpent / totalBudget) * 100).toFixed(2)
          : 0,
        groomBudget: (totalBudget * groomRatio) / 100,
        groomSpent,
        brideBudget: (totalBudget * brideRatio) / 100,
        brideSpent,
        topCategories: categoryResult.rows,
      },
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get expenses by category with optimized JOIN query
 * Requirements: 3.3 - JOIN 쿼리 최적화
 */
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

/**
 * Get expenses by month with aggregation
 * Requirements: 3.3 - 쿼리 최적화
 */
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

/**
 * Get expenses by payer with optimized single query
 * Requirements: 3.3 - N+1 쿼리 문제 해결, JOIN 쿼리 최적화
 */
export const getByPayer = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    // 최적화: 예산 설정과 분담자별 지출을 단일 쿼리로 조회
    const result = await pool.query(
      `WITH payer_stats AS (
        SELECT 
          payer,
          COALESCE(SUM(amount), 0) as total_amount,
          COUNT(id) as expense_count,
          COALESCE(AVG(amount), 0) as avg_amount
        FROM expenses
        WHERE couple_id = $1
        GROUP BY payer
      ),
      budget AS (
        SELECT 
          COALESCE(total_budget, 0) as total_budget,
          COALESCE(groom_ratio, 50) as groom_ratio,
          COALESCE(bride_ratio, 50) as bride_ratio
        FROM budget_settings
        WHERE couple_id = $1
      )
      SELECT 
        b.total_budget,
        b.groom_ratio,
        b.bride_ratio,
        COALESCE(g.total_amount, 0) as groom_total,
        COALESCE(g.expense_count, 0) as groom_count,
        COALESCE(g.avg_amount, 0) as groom_avg,
        COALESCE(br.total_amount, 0) as bride_total,
        COALESCE(br.expense_count, 0) as bride_count,
        COALESCE(br.avg_amount, 0) as bride_avg
      FROM budget b
      LEFT JOIN payer_stats g ON g.payer = 'groom'
      LEFT JOIN payer_stats br ON br.payer = 'bride'`,
      [coupleId]
    );

    const stats = result.rows[0] || {
      total_budget: 0,
      groom_ratio: 50,
      bride_ratio: 50,
      groom_total: 0,
      groom_count: 0,
      groom_avg: 0,
      bride_total: 0,
      bride_count: 0,
      bride_avg: 0,
    };

    const totalBudget = Number(stats.total_budget) || 0;
    const groomRatio = Number(stats.groom_ratio) || 50;
    const brideRatio = Number(stats.bride_ratio) || 50;
    const groomBudget = (totalBudget * groomRatio) / 100;
    const brideBudget = (totalBudget * brideRatio) / 100;
    const groomTotal = Number(stats.groom_total) || 0;
    const brideTotal = Number(stats.bride_total) || 0;

    res.json({
      payers: [
        {
          payer: 'groom',
          total_amount: groomTotal,
          expense_count: Number(stats.groom_count) || 0,
          avg_amount: Number(stats.groom_avg) || 0,
          budget: groomBudget,
          remaining: groomBudget - groomTotal,
          percentage_used: groomBudget > 0 
            ? ((groomTotal / groomBudget) * 100).toFixed(2)
            : 0,
        },
        {
          payer: 'bride',
          total_amount: brideTotal,
          expense_count: Number(stats.bride_count) || 0,
          avg_amount: Number(stats.bride_avg) || 0,
          budget: brideBudget,
          remaining: brideBudget - brideTotal,
          percentage_used: brideBudget > 0 
            ? ((brideTotal / brideBudget) * 100).toFixed(2)
            : 0,
        },
      ],
    });
  } catch (error) {
    console.error('Get by payer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
