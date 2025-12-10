import { Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../types';

export const getBudgetSettings = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    const result = await pool.query(
      'SELECT * FROM budget_settings WHERE couple_id = $1',
      [coupleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Budget settings not found' });
    }

    // 숫자 타입 보장
    const budget = {
      ...result.rows[0],
      total_budget: Number(result.rows[0].total_budget) || 0,
      groom_ratio: Number(result.rows[0].groom_ratio) || 50,
      bride_ratio: Number(result.rows[0].bride_ratio) || 50,
    };

    res.json({ budget });
  } catch (error) {
    console.error('Get budget settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateBudgetSettings = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    const { total_budget, groom_ratio, bride_ratio } = req.body;

    // 비율 검증
    if (groom_ratio !== undefined && bride_ratio !== undefined) {
      if (groom_ratio + bride_ratio !== 100) {
        return res.status(400).json({ error: 'Ratios must sum to 100' });
      }
    }

    const result = await pool.query(
      `UPDATE budget_settings SET
        total_budget = COALESCE($2, total_budget),
        groom_ratio = COALESCE($3, groom_ratio),
        bride_ratio = COALESCE($4, bride_ratio),
        updated_at = CURRENT_TIMESTAMP
      WHERE couple_id = $1
      RETURNING *`,
      [coupleId, total_budget, groom_ratio, bride_ratio]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Budget settings not found' });
    }

    res.json({ budget: result.rows[0] });
  } catch (error) {
    console.error('Update budget settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    const result = await pool.query(
      `SELECT c.*, 
        COALESCE(SUM(e.amount), 0)::numeric as spent_amount
       FROM budget_categories c
       LEFT JOIN expenses e ON c.id = e.category_id
       WHERE c.couple_id = $1
       GROUP BY c.id
       ORDER BY c."order", c.created_at`,
      [coupleId]
    );

    // 숫자 타입 보장
    const categories = result.rows.map(row => ({
      ...row,
      budget_amount: Number(row.budget_amount) || 0,
      spent_amount: Number(row.spent_amount) || 0,
    }));

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    const { name, icon, parent_id, budget_amount, color, order } = req.body;

    const result = await pool.query(
      `INSERT INTO budget_categories (
        couple_id, name, icon, parent_id, budget_amount, color, "order"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [coupleId, name, icon, parent_id, budget_amount || 0, color, order || 0]
    );

    res.status(201).json({ category: result.rows[0] });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;
    const { id } = req.params;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    const { name, icon, budget_amount, color, order } = req.body;

    const result = await pool.query(
      `UPDATE budget_categories SET
        name = COALESCE($3, name),
        icon = COALESCE($4, icon),
        budget_amount = COALESCE($5, budget_amount),
        color = COALESCE($6, color),
        "order" = COALESCE($7, "order"),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND couple_id = $2
      RETURNING *`,
      [id, coupleId, name, icon, budget_amount, color, order]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ category: result.rows[0] });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;
    const { id } = req.params;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    // 해당 카테고리의 지출 내역이 있는지 확인
    const expenseCheck = await pool.query(
      'SELECT COUNT(*) FROM expenses WHERE category_id = $1',
      [id]
    );

    const expenseCount = parseInt(expenseCheck.rows[0].count);

    // 지출 내역이 있으면 카테고리만 삭제하고 지출은 유지 (category_id를 null로)
    if (expenseCount > 0) {
      await pool.query(
        'UPDATE expenses SET category_id = NULL WHERE category_id = $1',
        [id]
      );
    }

    const result = await pool.query(
      'DELETE FROM budget_categories WHERE id = $1 AND couple_id = $2 RETURNING *',
      [id, coupleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ 
      success: true, 
      message: '카테고리가 삭제되었습니다',
      expensesUpdated: expenseCount 
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
