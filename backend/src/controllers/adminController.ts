import { Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../types';

// 관리자 권한 확인 미들웨어
export const checkAdminPermission = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const userId = req.user!.id;
    const result = await pool.query(
      'SELECT is_admin FROM users WHERE id = $1',
      [userId]
    );

    if (!result.rows[0]?.is_admin) {
      return res.status(403).json({
        success: false,
        message: '관리자 권한이 필요합니다',
      });
    }

    next();
  } catch (error) {
    console.error('Admin permission check error:', error);
    res.status(500).json({ success: false, message: '권한 확인 실패' });
  }
};

// 대시보드 통계 조회
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    // 전체 사용자 수
    const totalUsersResult = await pool.query('SELECT COUNT(*) FROM users');
    const totalUsers = parseInt(totalUsersResult.rows[0].count);

    // 활성 사용자 수 (최근 7일 로그인)
    const activeUsersResult = await pool.query(
      `SELECT COUNT(*) FROM users 
       WHERE updated_at > NOW() - INTERVAL '7 days'`
    );
    const activeUsers = parseInt(activeUsersResult.rows[0].count);

    // 오늘 신규 사용자
    const newUsersResult = await pool.query(
      `SELECT COUNT(*) FROM users 
       WHERE DATE(created_at) = CURRENT_DATE`
    );
    const newUsers = parseInt(newUsersResult.rows[0].count);

    // 전체 커플 수
    const totalCouplesResult = await pool.query('SELECT COUNT(*) FROM couples');
    const totalCouples = parseInt(totalCouplesResult.rows[0].count);

    // 연결된 커플 수 (2명이 모두 연결된)
    const connectedCouplesResult = await pool.query(
      `SELECT COUNT(*) FROM couples c
       WHERE (SELECT COUNT(*) FROM users WHERE couple_id = c.id) = 2`
    );
    const connectedCouples = parseInt(connectedCouplesResult.rows[0].count);

    // 최근 7일 가입 추이
    const weeklyStatsResult = await pool.query(
      `SELECT 
         DATE(created_at) as date,
         COUNT(*) as count
       FROM users 
       WHERE created_at > NOW() - INTERVAL '7 days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`
    );

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        newUsers,
        totalCouples,
        connectedCouples,
        weeklyStats: weeklyStatsResult.rows,
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, message: '통계 조회 실패' });
  }
};

// 사용자 목록 조회
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT 
        u.id, u.name, u.email, u.is_admin, u.couple_id, u.role,
        u.created_at, u.updated_at,
        c.invite_code
      FROM users u
      LEFT JOIN couples c ON u.couple_id = c.id
    `;
    const params: any[] = [];

    if (search) {
      query += ` WHERE u.name ILIKE $1 OR u.email ILIKE $1`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    // 전체 개수 조회
    let countQuery = 'SELECT COUNT(*) FROM users u';
    const countParams: any[] = [];
    if (search) {
      countQuery += ` WHERE u.name ILIKE $1 OR u.email ILIKE $1`;
      countParams.push(`%${search}%`);
    }
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        users: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: '사용자 목록 조회 실패' });
  }
};

// 사용자 관리자 권한 토글
export const toggleUserAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { isAdmin } = req.body;

    await pool.query(
      'UPDATE users SET is_admin = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [isAdmin, userId]
    );

    res.json({
      success: true,
      message: `사용자 권한이 ${isAdmin ? '관리자로' : '일반 사용자로'} 변경되었습니다`,
    });
  } catch (error) {
    console.error('Toggle user admin error:', error);
    res.status(500).json({ success: false, message: '권한 변경 실패' });
  }
};

// 공지사항 목록 조회
export const getAnnouncements = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, type = '', active } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT 
        a.*,
        u.name as created_by_name
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (type) {
      conditions.push(`a.type = $${params.length + 1}`);
      params.push(type);
    }

    if (active !== undefined) {
      conditions.push(`a.is_active = $${params.length + 1}`);
      params.push(active === 'true');
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY a.priority DESC, a.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ success: false, message: '공지사항 조회 실패' });
  }
};

// 공지사항 생성
export const createAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title, content, type, priority, startDate, endDate } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: '제목과 내용을 입력해주세요',
      });
    }

    const result = await pool.query(
      `INSERT INTO announcements (title, content, type, priority, start_date, end_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, content, type || 'notice', priority || 0, startDate || new Date(), endDate, userId]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: '공지사항이 생성되었습니다',
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ success: false, message: '공지사항 생성 실패' });
  }
};

// 공지사항 수정
export const updateAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, type, priority, isActive, startDate, endDate } = req.body;

    const result = await pool.query(
      `UPDATE announcements 
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           type = COALESCE($3, type),
           priority = COALESCE($4, priority),
           is_active = COALESCE($5, is_active),
           start_date = COALESCE($6, start_date),
           end_date = $7,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [title, content, type, priority, isActive, startDate, endDate, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '공지사항을 찾을 수 없습니다',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: '공지사항이 수정되었습니다',
    });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ success: false, message: '공지사항 수정 실패' });
  }
};

// 공지사항 삭제
export const deleteAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM announcements WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: '공지사항을 찾을 수 없습니다',
      });
    }

    res.json({
      success: true,
      message: '공지사항이 삭제되었습니다',
    });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ success: false, message: '공지사항 삭제 실패' });
  }
};

// 활성 공지사항 조회 (일반 사용자용)
export const getActiveAnnouncements = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, title, content, type, priority, start_date, end_date
       FROM announcements 
       WHERE is_active = TRUE 
         AND (start_date IS NULL OR start_date <= NOW())
         AND (end_date IS NULL OR end_date >= NOW())
       ORDER BY priority DESC, created_at DESC
       LIMIT 10`
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get active announcements error:', error);
    res.status(500).json({ success: false, message: '공지사항 조회 실패' });
  }
};
