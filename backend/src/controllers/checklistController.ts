import { Request, Response } from 'express';
import { pool } from '../config/database';
import { notifyChecklistChange } from '../services/coupleNotificationService';
import { parsePaginationParams, calculateOffset, buildPaginationMeta } from '../utils/pagination';

// 카테고리 목록 조회
export const getCategories = async (req: Request, res: Response) => {
  try {
    const coupleId = (req as any).user.coupleId;

    const result = await pool.query(
      `SELECT * FROM checklist_categories 
       WHERE couple_id = $1 
       ORDER BY sort_order ASC`,
      [coupleId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: '조회 실패' });
  }
};

// 카테고리 생성
export const createCategory = async (req: Request, res: Response) => {
  try {
    const coupleId = (req as any).user.coupleId;
    const { name, icon, color } = req.body;

    const result = await pool.query(
      `INSERT INTO checklist_categories (couple_id, name, icon, color)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [coupleId, name, icon, color]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, message: '생성 실패' });
  }
};

// 카테고리 수정
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const coupleId = (req as any).user.coupleId;
    const { name, icon, color } = req.body;

    const result = await pool.query(
      `UPDATE checklist_categories 
       SET name = $1, icon = $2, color = $3
       WHERE id = $4 AND couple_id = $5
       RETURNING *`,
      [name, icon, color, id, coupleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '카테고리를 찾을 수 없습니다' });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ success: false, message: '수정 실패' });
  }
};

// 카테고리 삭제
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const coupleId = (req as any).user.coupleId;

    const result = await pool.query(
      'DELETE FROM checklist_categories WHERE id = $1 AND couple_id = $2 RETURNING *',
      [id, coupleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '카테고리를 찾을 수 없습니다' });
    }

    res.json({
      success: true,
      message: '삭제되었습니다',
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, message: '삭제 실패' });
  }
};

// 아이템 목록 조회
export const getItems = async (req: Request, res: Response) => {
  try {
    const coupleId = (req as any).user.coupleId;
    const { category_id, is_completed, due_period, assigned_to } = req.query;

    let query = `
      SELECT 
        ci.*,
        cc.name as category_name,
        cc.icon as category_icon,
        cc.color as category_color
      FROM checklist_items ci
      LEFT JOIN checklist_categories cc ON ci.category_id = cc.id
      WHERE ci.couple_id = $1
    `;
    const params: any[] = [coupleId];
    let paramIndex = 2;

    if (category_id) {
      query += ` AND ci.category_id = $${paramIndex++}`;
      params.push(category_id);
    }

    if (is_completed !== undefined) {
      query += ` AND ci.is_completed = $${paramIndex++}`;
      params.push(is_completed === 'true');
    }

    if (due_period) {
      query += ` AND ci.due_period = $${paramIndex++}`;
      params.push(due_period);
    }

    if (assigned_to) {
      query += ` AND ci.assigned_to = $${paramIndex++}`;
      params.push(assigned_to);
    }

    query += ` ORDER BY ci.sort_order ASC, ci.due_date ASC NULLS LAST`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get checklist items error:', error);
    res.status(500).json({ success: false, message: '조회 실패' });
  }
};

// 아이템 단일 조회
export const getItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const coupleId = (req as any).user.couple_id;

    const result = await pool.query(
      `SELECT ci.*, cc.name as category_name, cc.icon as category_icon, cc.color as category_color
       FROM checklist_items ci
       LEFT JOIN checklist_categories cc ON ci.category_id = cc.id
       WHERE ci.id = $1 AND ci.couple_id = $2`,
      [id, coupleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '항목을 찾을 수 없습니다' });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ success: false, message: '조회 실패' });
  }
};

// 아이템 생성
export const createItem = async (req: Request, res: Response) => {
  try {
    const coupleId = (req as any).user.coupleId;
    const userId = (req as any).user.id;
    const {
      category_id,
      title,
      description,
      due_date,
      due_period,
      assigned_to,
      priority,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO checklist_items
        (couple_id, category_id, title, description, due_date, due_period, assigned_to, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [coupleId, category_id, title, description, due_date, due_period, assigned_to || 'both', priority || 'medium']
    );

    // 파트너에게 알림 전송
    try {
      await notifyChecklistChange(String(userId), String(coupleId), 'add', title);
    } catch (notifyError) {
      console.error('Notification error:', notifyError);
    }

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Create checklist item error:', error);
    res.status(500).json({ success: false, message: '생성 실패' });
  }
};

// 아이템 수정
export const updateItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const coupleId = (req as any).user.coupleId;
    const {
      category_id,
      title,
      description,
      due_date,
      due_period,
      assigned_to,
      priority,
    } = req.body;

    const result = await pool.query(
      `UPDATE checklist_items
       SET category_id = $1, title = $2, description = $3, due_date = $4, 
           due_period = $5, assigned_to = $6, priority = $7
       WHERE id = $8 AND couple_id = $9
       RETURNING *`,
      [category_id, title, description, due_date, due_period, assigned_to, priority, id, coupleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '항목을 찾을 수 없습니다' });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ success: false, message: '수정 실패' });
  }
};

// 아이템 삭제
export const deleteItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const coupleId = (req as any).user.coupleId;

    const result = await pool.query(
      'DELETE FROM checklist_items WHERE id = $1 AND couple_id = $2 RETURNING *',
      [id, coupleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '항목을 찾을 수 없습니다' });
    }

    res.json({
      success: true,
      message: '삭제되었습니다',
    });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ success: false, message: '삭제 실패' });
  }
};

// 완료 토글
export const toggleComplete = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const coupleId = (req as any).user.coupleId;
    const userId = (req as any).user.id;

    // 현재 상태 확인
    const current = await pool.query(
      'SELECT is_completed, title FROM checklist_items WHERE id = $1 AND couple_id = $2',
      [id, coupleId]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ success: false, message: '항목을 찾을 수 없습니다' });
    }

    const newCompleted = !current.rows[0].is_completed;

    const result = await pool.query(
      `UPDATE checklist_items
        SET is_completed = $1,
            completed_at = $2,
            completed_by = $3
        WHERE id = $4 AND couple_id = $5
        RETURNING *`,
      [newCompleted, newCompleted ? new Date() : null, newCompleted ? userId : null, id, coupleId]
    );

    // 완료 시 파트너에게 알림 전송
    if (newCompleted) {
      try {
        await notifyChecklistChange(String(userId), String(coupleId), 'update', current.rows[0].title);
      } catch (notifyError) {
        console.error('Notification error:', notifyError);
      }
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Toggle complete error:', error);
    res.status(500).json({ success: false, message: '업데이트 실패' });
  }
};

// 통계
export const getStats = async (req: Request, res: Response) => {
  try {
    const coupleId = (req as any).user.coupleId;

    const result = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_completed = true) as completed,
        COUNT(*) FILTER (WHERE is_completed = false) as pending,
        COUNT(*) FILTER (WHERE is_completed = false AND due_date < CURRENT_DATE) as overdue,
        COUNT(*) FILTER (WHERE is_completed = false AND due_date = CURRENT_DATE) as due_today,
        COUNT(*) FILTER (WHERE is_completed = false AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days') as due_this_week
       FROM checklist_items
       WHERE couple_id = $1`,
      [coupleId]
    );

    const stats = result.rows[0];
    const completionRate = stats.total > 0
      ? Math.round((stats.completed / stats.total) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        ...stats,
        completionRate,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: '통계 조회 실패' });
  }
};

// 기본 체크리스트 템플릿 초기화
export const initDefaultItems = async (req: Request, res: Response) => {
  try {
    console.log('=== Init Default Items Called ===');
    console.log('User:', (req as any).user);
    const coupleId = (req as any).user.coupleId;
    console.log('Couple ID:', coupleId);
    
    if (!coupleId) {
      console.log('ERROR: No couple ID found');
      return res.status(400).json({
        success: false,
        message: '커플 정보를 찾을 수 없습니다'
      });
    }

    // 이미 아이템이 있는지 확인
    const existing = await pool.query(
      'SELECT COUNT(*) FROM checklist_items WHERE couple_id = $1',
      [coupleId]
    );

    if (parseInt(existing.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: '이미 체크리스트가 존재합니다'
      });
    }

    // 기본 카테고리 생성
    const categories = [
      { name: '예식 준비', icon: '💒', color: '#FDA4AF' },
      { name: '스드메', icon: '👰', color: '#F9A8D4' },
      { name: '예물/예단', icon: '💍', color: '#C4B5FD' },
      { name: '신혼집', icon: '🏠', color: '#93C5FD' },
      { name: '신혼여행', icon: '✈️', color: '#6EE7B7' },
      { name: '기타', icon: '📋', color: '#FCD34D' },
    ];

    const categoryIds: Record<string, string> = {};

    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];
      const result = await pool.query(
        `INSERT INTO checklist_categories (couple_id, name, icon, color, sort_order)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [coupleId, cat.name, cat.icon, cat.color, i]
      );
      categoryIds[cat.name] = result.rows[0].id;
    }

    // 기본 체크리스트 아이템
    const defaultItems = [
      // D-180
      { category: '예식 준비', title: '예산 설정하기', due_period: 'D-180', priority: 'high' },
      { category: '예식 준비', title: '예식 날짜 정하기', due_period: 'D-180', priority: 'high' },
      { category: '예식 준비', title: '식장 투어 일정 잡기', due_period: 'D-180', priority: 'high' },
      { category: '스드메', title: '스드메 업체 리스트업', due_period: 'D-180', priority: 'medium' },
      
      // D-150
      { category: '예식 준비', title: '식장 계약하기', due_period: 'D-150', priority: 'high' },
      { category: '스드메', title: '스튜디오 투어 및 계약', due_period: 'D-150', priority: 'high' },
      { category: '스드메', title: '드레스샵 투어 및 계약', due_period: 'D-150', priority: 'high' },
      { category: '스드메', title: '메이크업샵 투어 및 계약', due_period: 'D-150', priority: 'high' },
      
      // D-120
      { category: '예물/예단', title: '예물 알아보기', due_period: 'D-120', priority: 'medium' },
      { category: '신혼집', title: '신혼집 지역 정하기', due_period: 'D-120', priority: 'medium' },
      { category: '신혼여행', title: '신혼여행지 정하기', due_period: 'D-120', priority: 'low' },
      
      // D-90
      { category: '예물/예단', title: '예물 구매하기', due_period: 'D-90', priority: 'high' },
      { category: '예물/예단', title: '예단 준비하기', due_period: 'D-90', priority: 'medium' },
      { category: '신혼집', title: '신혼집 계약하기', due_period: 'D-90', priority: 'high' },
      { category: '기타', title: '청첩장 디자인 선택', due_period: 'D-90', priority: 'medium' },
      
      // D-60
      { category: '스드메', title: '드레스 1차 피팅', due_period: 'D-60', priority: 'high' },
      { category: '신혼집', title: '혼수 가전 리스트 작성', due_period: 'D-60', priority: 'medium' },
      { category: '신혼집', title: '가구 주문하기', due_period: 'D-60', priority: 'medium' },
      { category: '신혼여행', title: '신혼여행 예약하기', due_period: 'D-60', priority: 'high' },
      
      // D-30
      { category: '예식 준비', title: '하객 명단 정리', due_period: 'D-30', priority: 'high' },
      { category: '기타', title: '청첩장 발송하기', due_period: 'D-30', priority: 'high' },
      { category: '스드메', title: '드레스 2차 피팅', due_period: 'D-30', priority: 'high' },
      { category: '스드메', title: '메이크업 리허설', due_period: 'D-30', priority: 'medium' },
      { category: '신혼집', title: '이사하기', due_period: 'D-30', priority: 'high' },
      
      // D-14
      { category: '예식 준비', title: '식장 최종 미팅', due_period: 'D-14', priority: 'high' },
      { category: '스드메', title: '본식 스냅/영상 미팅', due_period: 'D-14', priority: 'medium' },
      { category: '기타', title: '축의금 봉투/방명록 준비', due_period: 'D-14', priority: 'low' },
      
      // D-7
      { category: '예식 준비', title: '식권/주차권 확인', due_period: 'D-7', priority: 'high' },
      { category: '스드메', title: '드레스 최종 피팅', due_period: 'D-7', priority: 'high' },
      { category: '기타', title: '부모님 의상 준비 확인', due_period: 'D-7', priority: 'medium' },
      { category: '신혼여행', title: '여행 짐 싸기', due_period: 'D-7', priority: 'medium' },
      
      // D-1
      { category: '예식 준비', title: '예식장 물품 전달', due_period: 'D-1', priority: 'high' },
      { category: '기타', title: '축의금 담당자 확인', due_period: 'D-1', priority: 'high' },
    ];

    for (let i = 0; i < defaultItems.length; i++) {
      const item = defaultItems[i];
      await pool.query(
        `INSERT INTO checklist_items
          (couple_id, category_id, title, due_period, priority, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [coupleId, categoryIds[item.category], item.title, item.due_period, item.priority, i]
      );
    }

    res.json({
      success: true,
      message: '기본 체크리스트가 생성되었습니다',
    });
  } catch (error) {
    console.error('Init default items error:', error);
    res.status(500).json({ success: false, message: '초기화 실패' });
  }
};

// 순서 변경 (카테고리)
export const reorderCategories = async (req: Request, res: Response) => {
  try {
    const coupleId = (req as any).user.couple_id;
    const { orders } = req.body; // [{ id, sort_order }]

    for (const order of orders) {
      await pool.query(
        'UPDATE checklist_categories SET sort_order = $1 WHERE id = $2 AND couple_id = $3',
        [order.sort_order, order.id, coupleId]
      );
    }

    res.json({
      success: true,
      message: '순서가 변경되었습니다',
    });
  } catch (error) {
    console.error('Reorder categories error:', error);
    res.status(500).json({ success: false, message: '순서 변경 실패' });
  }
};

// 순서 변경 (아이템)
export const reorderItems = async (req: Request, res: Response) => {
  try {
    const coupleId = (req as any).user.couple_id;
    const { orders } = req.body; // [{ id, sort_order }]

    for (const order of orders) {
      await pool.query(
        'UPDATE checklist_items SET sort_order = $1 WHERE id = $2 AND couple_id = $3',
        [order.sort_order, order.id, coupleId]
      );
    }

    res.json({
      success: true,
      message: '순서가 변경되었습니다',
    });
  } catch (error) {
    console.error('Reorder items error:', error);
    res.status(500).json({ success: false, message: '순서 변경 실패' });
  }
};

// 일괄 완료
export const bulkComplete = async (req: Request, res: Response) => {
  try {
    const coupleId = (req as any).user.couple_id;
    const userId = (req as any).user.id;
    const { ids } = req.body;

    await pool.query(
      `UPDATE checklist_items
       SET is_completed = true, completed_at = CURRENT_TIMESTAMP, completed_by = $1
       WHERE id = ANY($2) AND couple_id = $3`,
      [userId, ids, coupleId]
    );

    res.json({
      success: true,
      message: '일괄 완료되었습니다',
    });
  } catch (error) {
    console.error('Bulk complete error:', error);
    res.status(500).json({ success: false, message: '일괄 완료 실패' });
  }
};

// 일괄 삭제
export const bulkDelete = async (req: Request, res: Response) => {
  try {
    const coupleId = (req as any).user.couple_id;
    const { ids } = req.body;

    await pool.query(
      'DELETE FROM checklist_items WHERE id = ANY($1) AND couple_id = $2',
      [ids, coupleId]
    );

    res.json({
      success: true,
      message: '일괄 삭제되었습니다',
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ success: false, message: '일괄 삭제 실패' });
  }
};
