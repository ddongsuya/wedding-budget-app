import { Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../types';
import { notifyVenueChange } from '../services/coupleNotificationService';

export const getVenues = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    const {
      page = '1',
      limit = '10',
      sort = 'created_at',
      order = 'DESC',
      type,
      status,
      minPrice,
      maxPrice,
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const allowedSorts = ['created_at', 'name', 'price', 'rating', 'visit_date'];
    const sortField = allowedSorts.includes(sort as string) ? sort : 'created_at';
    const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';

    let query = 'SELECT * FROM venues WHERE couple_id = $1';
    const params: any[] = [coupleId];
    let paramIndex = 2;

    if (type) {
      query += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (minPrice) {
      query += ` AND price >= $${paramIndex}`;
      params.push(parseInt(minPrice as string));
      paramIndex++;
    }

    if (maxPrice) {
      query += ` AND price <= $${paramIndex}`;
      params.push(parseInt(maxPrice as string));
      paramIndex++;
    }

    // 총 개수 조회
    const countResult = await pool.query(
      query.replace('SELECT *', 'SELECT COUNT(*)'),
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // 데이터 조회
    query += ` ORDER BY ${sortField} ${sortOrder} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit as string), offset);

    const result = await pool.query(query, params);

    res.json({
      venues: result.rows,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get venues error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createVenue = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    const {
      name,
      type,
      location,
      contact,
      price,
      capacity,
      visit_date,
      rating,
      pros,
      cons,
      notes,
      images,
      status,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO venues (
        couple_id, name, type, location, contact, price, capacity,
        visit_date, rating, pros, cons, notes, images, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        coupleId,
        name,
        type,
        location,
        contact,
        price,
        capacity,
        visit_date,
        rating,
        pros,
        cons,
        notes,
        images || [],
        status || 'considering',
      ]
    );

    // 파트너에게 알림 전송
    try {
      await notifyVenueChange(String(req.user!.id), String(coupleId), 'add', name);
    } catch (notifyError) {
      console.error('Notification error:', notifyError);
    }

    res.status(201).json({ venue: result.rows[0] });
  } catch (error) {
    console.error('Create venue error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getVenue = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;
    const { id } = req.params;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    const result = await pool.query(
      'SELECT * FROM venues WHERE id = $1 AND couple_id = $2',
      [id, coupleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    res.json({ venue: result.rows[0] });
  } catch (error) {
    console.error('Get venue error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateVenue = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;
    const { id } = req.params;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    const {
      name,
      type,
      location,
      contact,
      price,
      capacity,
      visit_date,
      rating,
      pros,
      cons,
      notes,
      images,
      status,
    } = req.body;

    const result = await pool.query(
      `UPDATE venues SET
        name = COALESCE($3, name),
        type = COALESCE($4, type),
        location = COALESCE($5, location),
        contact = COALESCE($6, contact),
        price = COALESCE($7, price),
        capacity = COALESCE($8, capacity),
        visit_date = COALESCE($9, visit_date),
        rating = COALESCE($10, rating),
        pros = COALESCE($11, pros),
        cons = COALESCE($12, cons),
        notes = COALESCE($13, notes),
        images = COALESCE($14, images),
        status = COALESCE($15, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND couple_id = $2
      RETURNING *`,
      [
        id,
        coupleId,
        name,
        type,
        location,
        contact,
        price,
        capacity,
        visit_date,
        rating,
        pros,
        cons,
        notes,
        images,
        status,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    // 파트너에게 알림 전송
    try {
      await notifyVenueChange(String(req.user!.id), String(coupleId), 'update', name || result.rows[0].name);
    } catch (notifyError) {
      console.error('Notification error:', notifyError);
    }

    res.json({ venue: result.rows[0] });
  } catch (error) {
    console.error('Update venue error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteVenue = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;
    const { id } = req.params;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    // 삭제 전에 식장 정보 조회
    const venueResult = await pool.query(
      'SELECT name FROM venues WHERE id = $1 AND couple_id = $2',
      [id, coupleId]
    );

    const result = await pool.query(
      'DELETE FROM venues WHERE id = $1 AND couple_id = $2 RETURNING id',
      [id, coupleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    // 파트너에게 알림 전송
    try {
      await notifyVenueChange(String(req.user!.id), String(coupleId), 'delete', venueResult.rows[0]?.name);
    } catch (notifyError) {
      console.error('Notification error:', notifyError);
    }

    res.json({ message: 'Venue deleted successfully' });
  } catch (error) {
    console.error('Delete venue error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
