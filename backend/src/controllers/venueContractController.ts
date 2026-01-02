import { Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../types';

// 계약 정보 조회
export const getVenueContract = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;
    const { venueId } = req.params;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    const result = await pool.query(
      `SELECT vc.*, v.name as venue_name, v.location as venue_location
       FROM venue_contracts vc
       JOIN venues v ON vc.venue_id = v.id
       WHERE vc.venue_id = $1 AND vc.couple_id = $2`,
      [venueId, coupleId]
    );

    if (result.rows.length === 0) {
      return res.json({ contract: null });
    }

    // 연결된 지출 정보도 조회
    const expensesResult = await pool.query(
      `SELECT vce.*, e.title as expense_title, e.amount as expense_amount, e.date as expense_date
       FROM venue_contract_expenses vce
       LEFT JOIN expenses e ON vce.expense_id = e.id
       WHERE vce.contract_id = $1
       ORDER BY vce.expense_type, vce.created_at`,
      [result.rows[0].id]
    );

    res.json({
      contract: result.rows[0],
      expenses: expensesResult.rows,
    });
  } catch (error) {
    console.error('Get venue contract error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 계약 정보 생성/수정
export const upsertVenueContract = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;
    const { venueId } = req.params;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    // 식장이 해당 커플의 것인지 확인
    const venueCheck = await pool.query(
      'SELECT id FROM venues WHERE id = $1 AND couple_id = $2',
      [venueId, coupleId]
    );

    if (venueCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    const {
      // 행사 관련
      event_datetime,
      event_datetime_memo,
      event_location,
      event_location_memo,
      reception_hall,
      reception_hall_memo,
      guaranteed_guests,
      guaranteed_guests_memo,
      meal_ticket_count,
      meal_ticket_memo,
      groom_name,
      groom_contact,
      bride_name,
      bride_contact,
      couple_info_memo,
      // 식사 관련
      meal_course_name,
      meal_course_price,
      meal_total_price,
      meal_course_memo,
      alcohol_service_included,
      alcohol_service_price,
      alcohol_service_memo,
      // 대관 관련
      hall_rental_fee,
      hall_rental_fee_memo,
      hall_rental_fee_status,
      wedding_supplies,
      wedding_supplies_fee,
      wedding_supplies_memo,
      wedding_supplies_status,
      // 장비
      equipment_lighting,
      equipment_lighting_fee,
      equipment_lighting_memo,
      equipment_video,
      equipment_video_fee,
      equipment_video_memo,
      equipment_bgm,
      equipment_bgm_fee,
      equipment_bgm_memo,
      equipment_confetti,
      equipment_confetti_fee,
      equipment_confetti_memo,
      equipment_status,
      // 폐백
      pyebaek_included,
      pyebaek_fee,
      pyebaek_memo,
      pyebaek_status,
      // 특전
      benefit_hotel_room,
      benefit_hotel_room_memo,
      benefit_meals,
      benefit_meals_memo,
      benefit_wedding_cake,
      benefit_wedding_cake_memo,
      benefit_other,
      // 계약
      deposit_amount,
      deposit_paid,
      deposit_paid_date,
      deposit_memo,
      date_change_condition,
      cancellation_penalty,
      contract_memo,
    } = req.body;

    // 총 계약 금액 계산
    const totalContractAmount = 
      (hall_rental_fee || 0) +
      (wedding_supplies_fee || 0) +
      (equipment_lighting_fee || 0) +
      (equipment_video_fee || 0) +
      (equipment_bgm_fee || 0) +
      (equipment_confetti_fee || 0) +
      (pyebaek_fee || 0) +
      (meal_total_price || 0) +
      (alcohol_service_included ? 0 : (alcohol_service_price || 0));

    // UPSERT 쿼리
    const result = await pool.query(
      `INSERT INTO venue_contracts (
        venue_id, couple_id,
        event_datetime, event_datetime_memo, event_location, event_location_memo,
        reception_hall, reception_hall_memo, guaranteed_guests, guaranteed_guests_memo,
        meal_ticket_count, meal_ticket_memo,
        groom_name, groom_contact, bride_name, bride_contact, couple_info_memo,
        meal_course_name, meal_course_price, meal_total_price, meal_course_memo,
        alcohol_service_included, alcohol_service_price, alcohol_service_memo,
        hall_rental_fee, hall_rental_fee_memo, hall_rental_fee_status,
        wedding_supplies, wedding_supplies_fee, wedding_supplies_memo, wedding_supplies_status,
        equipment_lighting, equipment_lighting_fee, equipment_lighting_memo,
        equipment_video, equipment_video_fee, equipment_video_memo,
        equipment_bgm, equipment_bgm_fee, equipment_bgm_memo,
        equipment_confetti, equipment_confetti_fee, equipment_confetti_memo, equipment_status,
        pyebaek_included, pyebaek_fee, pyebaek_memo, pyebaek_status,
        benefit_hotel_room, benefit_hotel_room_memo, benefit_meals, benefit_meals_memo,
        benefit_wedding_cake, benefit_wedding_cake_memo, benefit_other,
        deposit_amount, deposit_paid, deposit_paid_date, deposit_memo,
        date_change_condition, cancellation_penalty, contract_memo,
        total_contract_amount
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31,
        $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44,
        $45, $46, $47, $48, $49, $50, $51, $52, $53, $54, $55, $56, $57, $58, $59,
        $60, $61, $62, $63
      )
      ON CONFLICT (venue_id) DO UPDATE SET
        event_datetime = EXCLUDED.event_datetime,
        event_datetime_memo = EXCLUDED.event_datetime_memo,
        event_location = EXCLUDED.event_location,
        event_location_memo = EXCLUDED.event_location_memo,
        reception_hall = EXCLUDED.reception_hall,
        reception_hall_memo = EXCLUDED.reception_hall_memo,
        guaranteed_guests = EXCLUDED.guaranteed_guests,
        guaranteed_guests_memo = EXCLUDED.guaranteed_guests_memo,
        meal_ticket_count = EXCLUDED.meal_ticket_count,
        meal_ticket_memo = EXCLUDED.meal_ticket_memo,
        groom_name = EXCLUDED.groom_name,
        groom_contact = EXCLUDED.groom_contact,
        bride_name = EXCLUDED.bride_name,
        bride_contact = EXCLUDED.bride_contact,
        couple_info_memo = EXCLUDED.couple_info_memo,
        meal_course_name = EXCLUDED.meal_course_name,
        meal_course_price = EXCLUDED.meal_course_price,
        meal_total_price = EXCLUDED.meal_total_price,
        meal_course_memo = EXCLUDED.meal_course_memo,
        alcohol_service_included = EXCLUDED.alcohol_service_included,
        alcohol_service_price = EXCLUDED.alcohol_service_price,
        alcohol_service_memo = EXCLUDED.alcohol_service_memo,
        hall_rental_fee = EXCLUDED.hall_rental_fee,
        hall_rental_fee_memo = EXCLUDED.hall_rental_fee_memo,
        hall_rental_fee_status = EXCLUDED.hall_rental_fee_status,
        wedding_supplies = EXCLUDED.wedding_supplies,
        wedding_supplies_fee = EXCLUDED.wedding_supplies_fee,
        wedding_supplies_memo = EXCLUDED.wedding_supplies_memo,
        wedding_supplies_status = EXCLUDED.wedding_supplies_status,
        equipment_lighting = EXCLUDED.equipment_lighting,
        equipment_lighting_fee = EXCLUDED.equipment_lighting_fee,
        equipment_lighting_memo = EXCLUDED.equipment_lighting_memo,
        equipment_video = EXCLUDED.equipment_video,
        equipment_video_fee = EXCLUDED.equipment_video_fee,
        equipment_video_memo = EXCLUDED.equipment_video_memo,
        equipment_bgm = EXCLUDED.equipment_bgm,
        equipment_bgm_fee = EXCLUDED.equipment_bgm_fee,
        equipment_bgm_memo = EXCLUDED.equipment_bgm_memo,
        equipment_confetti = EXCLUDED.equipment_confetti,
        equipment_confetti_fee = EXCLUDED.equipment_confetti_fee,
        equipment_confetti_memo = EXCLUDED.equipment_confetti_memo,
        equipment_status = EXCLUDED.equipment_status,
        pyebaek_included = EXCLUDED.pyebaek_included,
        pyebaek_fee = EXCLUDED.pyebaek_fee,
        pyebaek_memo = EXCLUDED.pyebaek_memo,
        pyebaek_status = EXCLUDED.pyebaek_status,
        benefit_hotel_room = EXCLUDED.benefit_hotel_room,
        benefit_hotel_room_memo = EXCLUDED.benefit_hotel_room_memo,
        benefit_meals = EXCLUDED.benefit_meals,
        benefit_meals_memo = EXCLUDED.benefit_meals_memo,
        benefit_wedding_cake = EXCLUDED.benefit_wedding_cake,
        benefit_wedding_cake_memo = EXCLUDED.benefit_wedding_cake_memo,
        benefit_other = EXCLUDED.benefit_other,
        deposit_amount = EXCLUDED.deposit_amount,
        deposit_paid = EXCLUDED.deposit_paid,
        deposit_paid_date = EXCLUDED.deposit_paid_date,
        deposit_memo = EXCLUDED.deposit_memo,
        date_change_condition = EXCLUDED.date_change_condition,
        cancellation_penalty = EXCLUDED.cancellation_penalty,
        contract_memo = EXCLUDED.contract_memo,
        total_contract_amount = EXCLUDED.total_contract_amount,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        venueId, coupleId,
        event_datetime || null, event_datetime_memo || null, event_location || null, event_location_memo || null,
        reception_hall || null, reception_hall_memo || null, guaranteed_guests || 0, guaranteed_guests_memo || null,
        meal_ticket_count || 0, meal_ticket_memo || null,
        groom_name || null, groom_contact || null, bride_name || null, bride_contact || null, couple_info_memo || null,
        meal_course_name || null, meal_course_price || 0, meal_total_price || 0, meal_course_memo || null,
        alcohol_service_included || false, alcohol_service_price || 0, alcohol_service_memo || null,
        hall_rental_fee || 0, hall_rental_fee_memo || null, hall_rental_fee_status || 'pending',
        wedding_supplies || null, wedding_supplies_fee || 0, wedding_supplies_memo || null, wedding_supplies_status || 'pending',
        equipment_lighting || false, equipment_lighting_fee || 0, equipment_lighting_memo || null,
        equipment_video || false, equipment_video_fee || 0, equipment_video_memo || null,
        equipment_bgm || false, equipment_bgm_fee || 0, equipment_bgm_memo || null,
        equipment_confetti || false, equipment_confetti_fee || 0, equipment_confetti_memo || null, equipment_status || 'pending',
        pyebaek_included || false, pyebaek_fee || 0, pyebaek_memo || null, pyebaek_status || 'pending',
        benefit_hotel_room || false, benefit_hotel_room_memo || null, benefit_meals || false, benefit_meals_memo || null,
        benefit_wedding_cake || false, benefit_wedding_cake_memo || null, benefit_other || null,
        deposit_amount || 0, deposit_paid || false, deposit_paid_date || null, deposit_memo || null,
        date_change_condition || null, cancellation_penalty || null, contract_memo || null,
        totalContractAmount,
      ]
    );

    // 식장 상태를 계약완료로 업데이트
    await pool.query(
      `UPDATE venues SET status = 'contracted', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [venueId]
    );

    res.json({
      success: true,
      contract: result.rows[0],
    });
  } catch (error) {
    console.error('Upsert venue contract error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 계약 삭제
export const deleteVenueContract = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;
    const { venueId } = req.params;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    const result = await pool.query(
      'DELETE FROM venue_contracts WHERE venue_id = $1 AND couple_id = $2 RETURNING id',
      [venueId, coupleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // 식장 상태를 방문완료로 변경
    await pool.query(
      `UPDATE venues SET status = 'visited', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [venueId]
    );

    res.json({ success: true, message: 'Contract deleted successfully' });
  } catch (error) {
    console.error('Delete venue contract error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 계약 지출 항목 추가/수정
export const upsertContractExpense = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;
    const { venueId } = req.params;
    const { expense_type, amount, status, due_date, paid_date, memo, expense_id } = req.body;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    // 계약 확인
    const contractResult = await pool.query(
      'SELECT id FROM venue_contracts WHERE venue_id = $1 AND couple_id = $2',
      [venueId, coupleId]
    );

    if (contractResult.rows.length === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const contractId = contractResult.rows[0].id;

    const result = await pool.query(
      `INSERT INTO venue_contract_expenses (contract_id, expense_type, amount, status, due_date, paid_date, memo, expense_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (contract_id, expense_type) DO UPDATE SET
         amount = EXCLUDED.amount,
         status = EXCLUDED.status,
         due_date = EXCLUDED.due_date,
         paid_date = EXCLUDED.paid_date,
         memo = EXCLUDED.memo,
         expense_id = EXCLUDED.expense_id,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [contractId, expense_type, amount || 0, status || 'pending', due_date || null, paid_date || null, memo || null, expense_id || null]
    );

    // 총 지불 금액 업데이트
    const paidResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total_paid 
       FROM venue_contract_expenses 
       WHERE contract_id = $1 AND status = 'completed'`,
      [contractId]
    );

    await pool.query(
      `UPDATE venue_contracts SET total_paid_amount = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [paidResult.rows[0].total_paid, contractId]
    );

    res.json({
      success: true,
      expense: result.rows[0],
    });
  } catch (error) {
    console.error('Upsert contract expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 계약된 식장 목록 조회 (대시보드용)
export const getContractedVenues = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    const result = await pool.query(
      `SELECT v.id, v.name, v.location, vc.event_datetime, vc.total_contract_amount, vc.total_paid_amount
       FROM venues v
       JOIN venue_contracts vc ON v.id = vc.venue_id
       WHERE v.couple_id = $1 AND v.status = 'contracted'
       ORDER BY vc.event_datetime`,
      [coupleId]
    );

    res.json({ venues: result.rows });
  } catch (error) {
    console.error('Get contracted venues error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
