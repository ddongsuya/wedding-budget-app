import { Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../types';
import { optimizeImage } from '../utils/upload';
import { notifyExpenseChange } from '../services/coupleNotificationService';

export const getExpenses = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    const {
      page = '1',
      limit = '20',
      sort = 'date',
      order = 'DESC',
      category_id,
      payer,
      start_date,
      end_date,
      min_amount,
      max_amount,
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const allowedSorts = ['date', 'amount', 'created_at', 'title'];
    const sortField = allowedSorts.includes(sort as string) ? sort : 'date';
    const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';

    let query = `
      SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM expenses e
      LEFT JOIN budget_categories c ON e.category_id = c.id
      WHERE e.couple_id = $1
    `;
    const params: any[] = [coupleId];
    let paramIndex = 2;

    if (category_id) {
      query += ` AND e.category_id = $${paramIndex}`;
      params.push(parseInt(category_id as string));
      paramIndex++;
    }

    if (payer) {
      query += ` AND e.payer = $${paramIndex}`;
      params.push(payer);
      paramIndex++;
    }

    if (start_date) {
      query += ` AND e.date >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND e.date <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    if (min_amount) {
      query += ` AND e.amount >= $${paramIndex}`;
      params.push(parseInt(min_amount as string));
      paramIndex++;
    }

    if (max_amount) {
      query += ` AND e.amount <= $${paramIndex}`;
      params.push(parseInt(max_amount as string));
      paramIndex++;
    }

    // 총 개수 조회
    const countQuery = query.replace(
      'SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color',
      'SELECT COUNT(*)'
    );
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // 데이터 조회
    query += ` ORDER BY e.${sortField} ${sortOrder} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit as string), offset);

    const result = await pool.query(query, params);

    res.json({
      expenses: result.rows,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createExpense = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    const {
      category_id,
      title,
      amount,
      date,
      payer,
      payment_method,
      vendor,
      notes,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO expenses (
        couple_id, category_id, title, amount, date, payer,
        payment_method, vendor, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        coupleId,
        category_id,
        title,
        amount,
        date,
        payer,
        payment_method,
        vendor,
        notes,
      ]
    );

    // 파트너에게 알림 전송
    try {
      await notifyExpenseChange(String(req.user!.id), String(coupleId), 'add', title);
    } catch (notifyError) {
      console.error('Notification error:', notifyError);
    }

    res.status(201).json({ expense: result.rows[0] });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getExpense = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;
    const { id } = req.params;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    const result = await pool.query(
      `SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM expenses e
       LEFT JOIN budget_categories c ON e.category_id = c.id
       WHERE e.id = $1 AND e.couple_id = $2`,
      [id, coupleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ expense: result.rows[0] });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateExpense = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;
    const { id } = req.params;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    const {
      category_id,
      title,
      amount,
      date,
      payer,
      payment_method,
      vendor,
      notes,
    } = req.body;

    const result = await pool.query(
      `UPDATE expenses SET
        category_id = COALESCE($3, category_id),
        title = COALESCE($4, title),
        amount = COALESCE($5, amount),
        date = COALESCE($6, date),
        payer = COALESCE($7, payer),
        payment_method = COALESCE($8, payment_method),
        vendor = COALESCE($9, vendor),
        notes = COALESCE($10, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND couple_id = $2
      RETURNING *`,
      [
        id,
        coupleId,
        category_id,
        title,
        amount,
        date,
        payer,
        payment_method,
        vendor,
        notes,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // 파트너에게 알림 전송
    try {
      await notifyExpenseChange(String(req.user!.id), String(coupleId), 'update', title || result.rows[0].title);
    } catch (notifyError) {
      console.error('Notification error:', notifyError);
    }

    res.json({ expense: result.rows[0] });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteExpense = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;
    const { id } = req.params;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    // 삭제 전에 지출 정보 조회
    const expenseResult = await pool.query(
      'SELECT title FROM expenses WHERE id = $1 AND couple_id = $2',
      [id, coupleId]
    );

    const result = await pool.query(
      'DELETE FROM expenses WHERE id = $1 AND couple_id = $2 RETURNING id',
      [id, coupleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // 파트너에게 알림 전송
    try {
      await notifyExpenseChange(String(req.user!.id), String(coupleId), 'delete', expenseResult.rows[0]?.title);
    } catch (notifyError) {
      console.error('Notification error:', notifyError);
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const uploadReceipt = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;
    const { id } = req.params;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // 이미지 최적화
    await optimizeImage(req.file.path, 1200, 85);

    const imageUrl = `/uploads/${req.file.filename}`;

    const result = await pool.query(
      `UPDATE expenses SET
        receipt_image = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND couple_id = $2
      RETURNING *`,
      [id, coupleId, imageUrl]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ expense: result.rows[0], imageUrl });
  } catch (error) {
    console.error('Upload receipt error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
