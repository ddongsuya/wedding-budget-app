import { Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../types';
import { sanitizeUser } from '../utils/sanitize';

// 초대 코드 생성 함수 (6자리 대문자+숫자)
const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 헷갈리는 문자 제외 (0,O,1,I)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// 커플 정보 조회
export const getCoupleInfo = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // 사용자의 couple_id 조회
    const userResult = await pool.query(
      'SELECT couple_id, role FROM users WHERE id = $1',
      [userId]
    );

    const coupleId = userResult.rows[0]?.couple_id;

    // 커플 연결 안 된 경우
    if (!coupleId) {
      return res.json({
        success: true,
        data: null,
        message: '아직 커플이 연결되지 않았습니다',
      });
    }

    // 커플 정보 조회
    const coupleResult = await pool.query(
      `SELECT c.*,
              (SELECT COUNT(*) FROM users WHERE couple_id = c.id) as member_count
       FROM couples c
       WHERE c.id = $1`,
      [coupleId]
    );

    if (coupleResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '커플 정보를 찾을 수 없습니다',
      });
    }

    // 파트너 정보 조회
    const partnerResult = await pool.query(
      `SELECT id, name, email, role, created_at
       FROM users
       WHERE couple_id = $1 AND id != $2`,
      [coupleId, userId]
    );

    // Sanitize partner data (Requirements 9.3)
    const sanitizedPartner = partnerResult.rows[0] ? sanitizeUser(partnerResult.rows[0]) : null;

    res.json({
      success: true,
      data: {
        couple: coupleResult.rows[0],
        partner: sanitizedPartner,
        isConnected: partnerResult.rows.length > 0,
      },
    });
  } catch (error) {
    console.error('Get couple info error:', error);
    res.status(500).json({ success: false, message: '조회 실패' });
  }
};

// 커플 생성 (초대 코드 발급)
export const createCouple = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // 이미 커플에 속해 있는지 확인
    const userResult = await pool.query(
      'SELECT couple_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows[0]?.couple_id) {
      return res.status(400).json({
        success: false,
        message: '이미 커플에 연결되어 있습니다',
      });
    }

    // 고유한 초대 코드 생성
    let inviteCode: string;
    let isUnique = false;

    while (!isUnique) {
      inviteCode = generateInviteCode();
      const existing = await pool.query(
        'SELECT id FROM couples WHERE invite_code = $1',
        [inviteCode]
      );
      isUnique = existing.rows.length === 0;
    }

    // 커플 생성
    const coupleResult = await pool.query(
      `INSERT INTO couples (invite_code)
       VALUES ($1)
       RETURNING *`,
      [inviteCode!]
    );

    const coupleId = coupleResult.rows[0].id;

    // 사용자를 커플에 연결 (owner 역할)
    await pool.query(
      `UPDATE users
       SET couple_id = $1, role = 'owner', updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [coupleId, userId]
    );

    // 예산 설정 초기화
    await pool.query(
      'INSERT INTO budget_settings (couple_id) VALUES ($1) ON CONFLICT (couple_id) DO NOTHING',
      [coupleId]
    );

    res.status(201).json({
      success: true,
      data: {
        couple: coupleResult.rows[0],
        inviteCode: inviteCode!,
      },
      message: '커플이 생성되었습니다. 초대 코드를 파트너에게 공유하세요!',
    });
  } catch (error) {
    console.error('Create couple error:', error);
    res.status(500).json({ success: false, message: '커플 생성 실패' });
  }
};

// 초대 코드로 커플 연결
export const joinCouple = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({
        success: false,
        message: '초대 코드를 입력해주세요',
      });
    }

    // 이미 커플에 속해 있는지 확인
    const userResult = await pool.query(
      'SELECT couple_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows[0]?.couple_id) {
      return res.status(400).json({
        success: false,
        message: '이미 커플에 연결되어 있습니다. 먼저 연결을 해제해주세요.',
      });
    }

    // 초대 코드로 커플 찾기
    const coupleResult = await pool.query(
      'SELECT * FROM couples WHERE invite_code = $1',
      [inviteCode.toUpperCase()]
    );

    if (coupleResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '유효하지 않은 초대 코드입니다',
      });
    }

    const couple = coupleResult.rows[0];

    // 이미 2명이 연결되어 있는지 확인
    const memberCount = await pool.query(
      'SELECT COUNT(*) FROM users WHERE couple_id = $1',
      [couple.id]
    );

    if (parseInt(memberCount.rows[0].count) >= 2) {
      return res.status(400).json({
        success: false,
        message: '이 커플은 이미 2명이 연결되어 있습니다',
      });
    }

    // 자기 자신의 코드인지 확인
    const isOwnCode = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND couple_id = $2',
      [userId, couple.id]
    );

    if (isOwnCode.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: '자신의 초대 코드는 사용할 수 없습니다',
      });
    }

    // 사용자를 커플에 연결 (member 역할)
    await pool.query(
      `UPDATE users
       SET couple_id = $1, role = 'member', updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [couple.id, userId]
    );

    // 파트너 정보 조회
    const partnerResult = await pool.query(
      `SELECT id, name, email FROM users WHERE couple_id = $1 AND id != $2`,
      [couple.id, userId]
    );

    // Sanitize partner data (Requirements 9.3)
    const sanitizedPartner = partnerResult.rows[0] ? sanitizeUser(partnerResult.rows[0]) : null;

    res.json({
      success: true,
      data: {
        couple,
        partner: sanitizedPartner,
      },
      message: '커플 연결이 완료되었습니다! 💕',
    });
  } catch (error) {
    console.error('Join couple error:', error);
    res.status(500).json({ success: false, message: '커플 연결 실패' });
  }
};

// 초대 코드 재생성
export const regenerateInviteCode = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // 사용자의 couple_id 조회
    const userResult = await pool.query(
      'SELECT couple_id FROM users WHERE id = $1',
      [userId]
    );

    const coupleId = userResult.rows[0]?.couple_id;

    if (!coupleId) {
      return res.status(400).json({
        success: false,
        message: '먼저 커플을 생성해주세요',
      });
    }

    // 새 코드 생성
    let newCode: string;
    let isUnique = false;

    while (!isUnique) {
      newCode = generateInviteCode();
      const existing = await pool.query(
        'SELECT id FROM couples WHERE invite_code = $1',
        [newCode]
      );
      isUnique = existing.rows.length === 0;
    }

    // 코드 업데이트
    await pool.query(
      `UPDATE couples
       SET invite_code = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [newCode!, coupleId]
    );

    res.json({
      success: true,
      data: { inviteCode: newCode! },
      message: '초대 코드가 재생성되었습니다',
    });
  } catch (error) {
    console.error('Regenerate invite code error:', error);
    res.status(500).json({ success: false, message: '코드 재생성 실패' });
  }
};

// 커플 프로필 수정
export const updateCoupleProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { groom_name, bride_name, wedding_date, total_budget } = req.body;

    // 사용자의 couple_id 조회
    const userResult = await pool.query(
      'SELECT couple_id FROM users WHERE id = $1',
      [userId]
    );

    const coupleId = userResult.rows[0]?.couple_id;

    if (!coupleId) {
      return res.status(400).json({
        success: false,
        message: '커플 연결이 필요합니다',
      });
    }

    const result = await pool.query(
      `UPDATE couples
       SET groom_name = COALESCE($1, groom_name),
           bride_name = COALESCE($2, bride_name),
           wedding_date = COALESCE($3, wedding_date),
           total_budget = COALESCE($4, total_budget),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [groom_name, bride_name, wedding_date, total_budget, coupleId]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: '커플 정보가 수정되었습니다',
    });
  } catch (error) {
    console.error('Update couple profile error:', error);
    res.status(500).json({ success: false, message: '수정 실패' });
  }
};

// 커플 연결 해제
export const leaveCouple = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // 사용자의 couple_id 조회
    const userResult = await pool.query(
      'SELECT couple_id FROM users WHERE id = $1',
      [userId]
    );

    const coupleId = userResult.rows[0]?.couple_id;

    if (!coupleId) {
      return res.status(400).json({
        success: false,
        message: '연결된 커플이 없습니다',
      });
    }

    // 연결 해제
    await pool.query(
      `UPDATE users
       SET couple_id = NULL, role = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [userId]
    );

    // 남은 멤버 수 확인
    const remainingMembers = await pool.query(
      'SELECT COUNT(*) FROM users WHERE couple_id = $1',
      [coupleId]
    );

    // 아무도 없으면 커플 데이터 삭제 (선택적)
    if (parseInt(remainingMembers.rows[0].count) === 0) {
      await pool.query('DELETE FROM couples WHERE id = $1', [coupleId]);
    }

    res.json({
      success: true,
      message: '커플 연결이 해제되었습니다',
    });
  } catch (error) {
    console.error('Leave couple error:', error);
    res.status(500).json({ success: false, message: '연결 해제 실패' });
  }
};

// 파트너 최근 활동 조회 (커플 동기화용)
export const getLastActivity = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // 사용자의 couple_id 조회
    const userResult = await pool.query(
      'SELECT couple_id FROM users WHERE id = $1',
      [userId]
    );

    const coupleId = userResult.rows[0]?.couple_id;

    if (!coupleId) {
      return res.json({
        success: true,
        data: null,
        message: '커플 연결이 필요합니다',
      });
    }

    // 파트너 ID 조회
    const partnerResult = await pool.query(
      'SELECT id, name FROM users WHERE couple_id = $1 AND id != $2',
      [coupleId, userId]
    );

    if (partnerResult.rows.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: '파트너가 아직 연결되지 않았습니다',
      });
    }

    const partner = partnerResult.rows[0];

    // 각 테이블에서 커플의 가장 최근 updated_at 조회
    const lastActivityResult = await pool.query(
      `SELECT GREATEST(
        (SELECT MAX(updated_at) FROM expenses WHERE couple_id = $1),
        (SELECT MAX(updated_at) FROM checklist_items WHERE couple_id = $1),
        (SELECT MAX(updated_at) FROM events WHERE couple_id = $1),
        (SELECT MAX(updated_at) FROM venues WHERE couple_id = $1)
      ) as last_activity_at`,
      [coupleId]
    );

    const lastActivityAt = lastActivityResult.rows[0]?.last_activity_at;

    // 최근 파트너 활동 요약 (최근 10개)
    const recentActivitiesResult = await pool.query(
      `(
        SELECT 'expense' as type, title as description, updated_at, 'add' as action
        FROM expenses
        WHERE couple_id = $1
        ORDER BY updated_at DESC LIMIT 5
      )
      UNION ALL
      (
        SELECT 'checklist' as type, title as description, updated_at,
          CASE WHEN is_completed THEN 'complete' ELSE 'update' END as action
        FROM checklist_items
        WHERE couple_id = $1
        ORDER BY updated_at DESC LIMIT 5
      )
      ORDER BY updated_at DESC
      LIMIT 10`,
      [coupleId]
    );

    res.json({
      success: true,
      data: {
        lastActivityAt,
        partnerName: partner.name,
        recentActivities: recentActivitiesResult.rows,
      },
    });
  } catch (error) {
    console.error('Get last activity error:', error);
    res.status(500).json({ success: false, message: '활동 조회 실패' });
  }
};

// 파트너 정보 조회
export const getPartnerInfo = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // 사용자의 couple_id 조회
    const userResult = await pool.query(
      'SELECT couple_id FROM users WHERE id = $1',
      [userId]
    );

    const coupleId = userResult.rows[0]?.couple_id;

    if (!coupleId) {
      return res.json({
        success: true,
        data: null,
      });
    }

    const result = await pool.query(
      `SELECT id, name, email, role, created_at
       FROM users
       WHERE couple_id = $1 AND id != $2`,
      [coupleId, userId]
    );

    // Sanitize partner data (Requirements 9.3)
    const sanitizedPartner = result.rows[0] ? sanitizeUser(result.rows[0]) : null;

    res.json({
      success: true,
      data: sanitizedPartner,
    });
  } catch (error) {
    console.error('Get partner info error:', error);
    res.status(500).json({ success: false, message: '조회 실패' });
  }
};
