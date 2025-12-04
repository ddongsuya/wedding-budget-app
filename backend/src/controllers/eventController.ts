import { Request, Response } from 'express';
import { pool } from '../config/database';

// 이벤트 목록 (필터 지원)
export const getEvents = async (req: Request, res: Response) => {
  try {
    const coupleId = (req as any).user.coupleId;
    const { start_date, end_date, category, assigned_to } = req.query;

    let query = `
      SELECT e.*,
             v.name as venue_name,
             ci.title as checklist_title
      FROM events e
      LEFT JOIN venues v ON e.linked_venue_id = v.id
      LEFT JOIN checklist_items ci ON e.linked_checklist_id = ci.id
      WHERE e.couple_id = $1
    `;
    const params: any[] = [coupleId];
    let paramIndex = 2;

    if (start_date) {
      query += ` AND e.start_date >= $${paramIndex++}`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND e.start_date <= $${paramIndex++}`;
      params.push(end_date);
    }

    if (category) {
      query += ` AND e.category = $${paramIndex++}`;
      params.push(category);
    }

    if (assigned_to) {
      query += ` AND e.assigned_to = $${paramIndex++}`;
      params.push(assigned_to);
    }

    query += ` ORDER BY e.start_date ASC, e.start_time ASC NULLS LAST`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ success: false, message: '조회 실패' });
  }
};

// 단일 이벤트 조회
export const getEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const coupleId = (req as any).user.coupleId;

    const result = await pool.query(
      `SELECT e.*, v.name as venue_name, ci.title as checklist_title
       FROM events e
       LEFT JOIN venues v ON e.linked_venue_id = v.id
       LEFT JOIN checklist_items ci ON e.linked_checklist_id = ci.id
       WHERE e.id = $1 AND e.couple_id = $2`,
      [id, coupleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '이벤트를 찾을 수 없습니다' });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ success: false, message: '조회 실패' });
  }
};

// 월별 이벤트
export const getEventsByMonth = async (req: Request, res: Response) => {
  try {
    const coupleId = (req as any).user.coupleId;
    const { year, month } = req.params;

    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const endDate = `${year}-${month.padStart(2, '0')}-${lastDay}`;

    const result = await pool.query(
      `SELECT e.*, v.name as venue_name
       FROM events e
       LEFT JOIN venues v ON e.linked_venue_id = v.id
       WHERE e.couple_id = $1
         AND e.start_date >= $2
         AND e.start_date <= $3
       ORDER BY e.start_date ASC, e.start_time ASC NULLS LAST`,
      [coupleId, startDate, endDate]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get events by month error:', error);
    res.status(500).json({ success: false, message: '조회 실패' });
  }
};

// 다가오는 일정
export const getUpcomingEvents = async (req: Request, res: Response) => {
  try {
    const coupleId = (req as any).user.coupleId;
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT e.*, v.name as venue_name
       FROM events e
       LEFT JOIN venues v ON e.linked_venue_id = v.id
       WHERE e.couple_id = $1
         AND e.start_date >= $2
         AND e.start_date <= $3
       ORDER BY e.start_date ASC, e.start_time ASC NULLS LAST
       LIMIT 10`,
      [coupleId, today, nextWeek]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({ success: false, message: '조회 실패' });
  }
};

// 이벤트 생성
export const createEvent = async (req: Request, res: Response) => {
  try {
    const coupleId = (req as any).user.coupleId;
    const userId = (req as any).user.id;

    if (!coupleId) {
      return res.status(400).json({ success: false, message: '커플 연결이 필요합니다' });
    }

    const {
      title,
      description,
      start_date,
      start_time,
      end_date,
      end_time,
      is_all_day,
      category,
      color,
      icon,
      location,
      location_url,
      reminder_minutes,
      linked_venue_id,
      linked_checklist_id,
      assigned_to,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO events
        (couple_id, title, description, start_date, start_time, end_date, end_time,
        is_all_day, category, color, icon, location, location_url, reminder_minutes,
        linked_venue_id, linked_checklist_id, assigned_to, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING *`,
      [coupleId, title, description, start_date, start_time, end_date, end_time,
       is_all_day || false, category, color || '#FDA4AF', icon, location, location_url,
       reminder_minutes, linked_venue_id, linked_checklist_id, assigned_to || 'both', userId]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ success: false, message: '생성 실패' });
  }
};

// 이벤트 수정
export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const coupleId = (req as any).user.coupleId;
    const updates = req.body;

    const fields = Object.keys(updates);
    const values = Object.values(updates);

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: '수정할 내용이 없습니다' });
    }

    const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');

    const result = await pool.query(
      `UPDATE events
       SET ${setClause}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${fields.length + 1} AND couple_id = $${fields.length + 2}
       RETURNING *`,
      [...values, id, coupleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '이벤트를 찾을 수 없습니다' });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ success: false, message: '수정 실패' });
  }
};

// 이벤트 삭제
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const coupleId = (req as any).user.coupleId;

    const result = await pool.query(
      'DELETE FROM events WHERE id = $1 AND couple_id = $2 RETURNING id',
      [id, coupleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '이벤트를 찾을 수 없습니다' });
    }

    res.json({
      success: true,
      message: '삭제되었습니다',
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ success: false, message: '삭제 실패' });
  }
};

// 카테고리별 조회
export const getEventsByCategory = async (req: Request, res: Response) => {
  try {
    const coupleId = (req as any).user.coupleId;
    const { category } = req.params;

    const result = await pool.query(
      `SELECT e.*, v.name as venue_name
       FROM events e
       LEFT JOIN venues v ON e.linked_venue_id = v.id
       WHERE e.couple_id = $1 AND e.category = $2
       ORDER BY e.start_date ASC`,
      [coupleId, category]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get events by category error:', error);
    res.status(500).json({ success: false, message: '조회 실패' });
  }
};
