import { Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest, Notification, NotificationPreference } from '../types';

// 알림 목록 조회 (페이지네이션, 정렬)
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // 알림 목록 조회 (최신순 정렬)
    const result = await pool.query(
      `SELECT id, user_id, type, title, message, data, link, is_read, created_at, read_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    // 전체 개수 조회
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1',
      [userId]
    );

    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        notifications: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: '알림 조회에 실패했습니다' });
  }
};

// 안읽은 알림 개수 조회
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const result = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );

    const count = parseInt(result.rows[0].count);

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ success: false, message: '안읽은 알림 개수 조회에 실패했습니다' });
  }
};


// 알림 읽음 처리
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE notifications
       SET is_read = TRUE, read_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '알림을 찾을 수 없습니다' });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, message: '알림 읽음 처리에 실패했습니다' });
  }
};

// 모든 알림 읽음 처리
export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    await pool.query(
      `UPDATE notifications
       SET is_read = TRUE, read_at = NOW()
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );

    res.json({
      success: true,
      message: '모든 알림을 읽음 처리했습니다',
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ success: false, message: '알림 읽음 처리에 실패했습니다' });
  }
};

// 알림 삭제
export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '알림을 찾을 수 없습니다' });
    }

    res.json({
      success: true,
      message: '알림이 삭제되었습니다',
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: '알림 삭제에 실패했습니다' });
  }
};

// 모든 알림 삭제
export const clearAllNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    await pool.query('DELETE FROM notifications WHERE user_id = $1', [userId]);

    res.json({
      success: true,
      message: '모든 알림이 삭제되었습니다',
    });
  } catch (error) {
    console.error('Clear all notifications error:', error);
    res.status(500).json({ success: false, message: '알림 삭제에 실패했습니다' });
  }
};

// 알림 설정 조회
export const getPreferences = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    let result = await pool.query(
      'SELECT * FROM notification_preferences WHERE user_id = $1',
      [userId]
    );

    // 설정이 없으면 기본값으로 생성
    if (result.rows.length === 0) {
      result = await pool.query(
        `INSERT INTO notification_preferences (user_id)
         VALUES ($1)
         RETURNING *`,
        [userId]
      );
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ success: false, message: '알림 설정 조회에 실패했습니다' });
  }
};

// 알림 설정 업데이트
export const updatePreferences = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const {
      dday_enabled,
      dday_daily,
      schedule_enabled,
      checklist_enabled,
      budget_enabled,
      couple_enabled,
      announcement_enabled,
      push_enabled,
      preferred_time,
    } = req.body;

    // UPSERT: 있으면 업데이트, 없으면 생성
    const result = await pool.query(
      `INSERT INTO notification_preferences (
        user_id, dday_enabled, dday_daily, schedule_enabled, checklist_enabled,
        budget_enabled, couple_enabled, announcement_enabled, push_enabled, preferred_time
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (user_id) DO UPDATE SET
        dday_enabled = COALESCE($2, notification_preferences.dday_enabled),
        dday_daily = COALESCE($3, notification_preferences.dday_daily),
        schedule_enabled = COALESCE($4, notification_preferences.schedule_enabled),
        checklist_enabled = COALESCE($5, notification_preferences.checklist_enabled),
        budget_enabled = COALESCE($6, notification_preferences.budget_enabled),
        couple_enabled = COALESCE($7, notification_preferences.couple_enabled),
        announcement_enabled = COALESCE($8, notification_preferences.announcement_enabled),
        push_enabled = COALESCE($9, notification_preferences.push_enabled),
        preferred_time = COALESCE($10, notification_preferences.preferred_time),
        updated_at = NOW()
      RETURNING *`,
      [
        userId,
        dday_enabled,
        dday_daily,
        schedule_enabled,
        checklist_enabled,
        budget_enabled,
        couple_enabled,
        announcement_enabled,
        push_enabled,
        preferred_time,
      ]
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ success: false, message: '알림 설정 업데이트에 실패했습니다' });
  }
};

// 테스트 알림 생성 (디버깅용)
export const createTestNotification = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { type = 'announcement', title, message } = req.body;

    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, data, link)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        userId,
        type,
        title || '테스트 알림',
        message || '이것은 테스트 알림입니다. 알림 기능이 정상적으로 작동합니다!',
        JSON.stringify({ test: true, timestamp: new Date().toISOString() }),
        '/',
      ]
    );

    res.json({
      success: true,
      message: '테스트 알림이 생성되었습니다',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Create test notification error:', error);
    res.status(500).json({ success: false, message: '테스트 알림 생성에 실패했습니다' });
  }
};

// 알림 직접 생성 (내부 API용)
export const createNotificationDirect = async (
  userId: number,
  type: string,
  title: string,
  message: string,
  data: Record<string, any> = {},
  link?: string
) => {
  try {
    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, data, link)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, type, title, message, JSON.stringify(data), link]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Create notification direct error:', error);
    return null;
  }
};
