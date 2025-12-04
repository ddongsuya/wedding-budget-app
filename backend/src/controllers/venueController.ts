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
      // 추가 비용 필드
      meal_cost_per_person,
      parking_spaces,
      sdm_included,
      studio_fee,
      dress_fee,
      makeup_fee,
      bouquet_included,
      bouquet_fee,
      rehearsal_makeup_included,
      rehearsal_makeup_fee,
      extra_fitting_fee,
      wedding_robe_fee,
      outdoor_venue_fee,
      fresh_flower_fee,
    } = req.body;

    // images 배열을 PostgreSQL 형식으로 변환
    const imagesArray = Array.isArray(images) ? images : [];

    const result = await pool.query(
      `INSERT INTO venues (
        couple_id, name, type, location, contact, price, capacity,
        visit_date, rating, pros, cons, notes, images, status,
        meal_cost_per_person, parking_spaces, sdm_included, studio_fee, dress_fee, makeup_fee,
        bouquet_included, bouquet_fee, rehearsal_makeup_included, rehearsal_makeup_fee,
        extra_fitting_fee, wedding_robe_fee, outdoor_venue_fee, fresh_flower_fee
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
      RETURNING *`,
      [
        coupleId,
        name,
        type || null,
        location || null,
        contact || null,
        price || 0,
        capacity || 0,
        visit_date || null,
        rating ? Math.round(rating) : null,
        pros || null,
        cons || null,
        notes || null,
        imagesArray,
        status || 'considering',
        meal_cost_per_person || 0,
        parking_spaces || 0,
        sdm_included || false,
        studio_fee || 0,
        dress_fee || 0,
        makeup_fee || 0,
        bouquet_included || false,
        bouquet_fee || 0,
        rehearsal_makeup_included || false,
        rehearsal_makeup_fee || 0,
        extra_fitting_fee || 0,
        wedding_robe_fee || 0,
        outdoor_venue_fee || 0,
        fresh_flower_fee || 0,
      ]
    );

    // 파트너에게 알림 전송
    try {
      await notifyVenueChange(String(req.user!.id), String(coupleId), 'add', name);
    } catch (notifyError) {
      console.error('Notification error:', notifyError);
    }

    res.status(201).json({ venue: result.rows[0] });
  } catch (error: any) {
    console.error('Create venue error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      detail: error.detail
    });
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
      meal_cost_per_person,
      parking_spaces,
      sdm_included,
      studio_fee,
      dress_fee,
      makeup_fee,
      bouquet_included,
      bouquet_fee,
      rehearsal_makeup_included,
      rehearsal_makeup_fee,
      extra_fitting_fee,
      wedding_robe_fee,
      outdoor_venue_fee,
      fresh_flower_fee,
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
        meal_cost_per_person = COALESCE($16, meal_cost_per_person),
        parking_spaces = COALESCE($17, parking_spaces),
        sdm_included = COALESCE($18, sdm_included),
        studio_fee = COALESCE($19, studio_fee),
        dress_fee = COALESCE($20, dress_fee),
        makeup_fee = COALESCE($21, makeup_fee),
        bouquet_included = COALESCE($22, bouquet_included),
        bouquet_fee = COALESCE($23, bouquet_fee),
        rehearsal_makeup_included = COALESCE($24, rehearsal_makeup_included),
        rehearsal_makeup_fee = COALESCE($25, rehearsal_makeup_fee),
        extra_fitting_fee = COALESCE($26, extra_fitting_fee),
        wedding_robe_fee = COALESCE($27, wedding_robe_fee),
        outdoor_venue_fee = COALESCE($28, outdoor_venue_fee),
        fresh_flower_fee = COALESCE($29, fresh_flower_fee),
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
        meal_cost_per_person,
        parking_spaces,
        sdm_included,
        studio_fee,
        dress_fee,
        makeup_fee,
        bouquet_included,
        bouquet_fee,
        rehearsal_makeup_included,
        rehearsal_makeup_fee,
        extra_fitting_fee,
        wedding_robe_fee,
        outdoor_venue_fee,
        fresh_flower_fee,
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
