import { Response } from 'express';
import { pool, withTransaction } from '../config/database';
import { AuthRequest } from '../types';

/**
 * GET /api/backup/export
 * 사용자의 전체 데이터를 JSON으로 내보내기
 */
export const exportData = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    // 모든 데이터를 병렬로 조회
    const [
      budgetResult,
      categoriesResult,
      expensesResult,
      checklistCategoriesResult,
      checklistItemsResult,
      eventsResult,
      venuesResult,
      venueContractsResult,
      photoReferencesResult,
    ] = await Promise.all([
      pool.query('SELECT * FROM budget_settings WHERE couple_id = $1', [coupleId]),
      pool.query('SELECT * FROM budget_categories WHERE couple_id = $1 ORDER BY "order", created_at', [coupleId]),
      pool.query('SELECT * FROM expenses WHERE couple_id = $1 ORDER BY date DESC', [coupleId]),
      pool.query('SELECT * FROM checklist_categories WHERE couple_id = $1 ORDER BY sort_order', [coupleId]),
      pool.query('SELECT * FROM checklist_items WHERE couple_id = $1 ORDER BY sort_order', [coupleId]),
      pool.query('SELECT * FROM events WHERE couple_id = $1 ORDER BY start_date', [coupleId]),
      pool.query('SELECT * FROM venues WHERE couple_id = $1 ORDER BY created_at', [coupleId]),
      pool.query('SELECT vc.* FROM venue_contracts vc INNER JOIN venues v ON vc.venue_id = v.id WHERE vc.couple_id = $1', [coupleId]),
      pool.query('SELECT * FROM photo_references WHERE couple_id = $1 ORDER BY sort_order, created_at', [coupleId]),
    ]);

    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: {
        budget: budgetResult.rows[0] || null,
        categories: categoriesResult.rows,
        expenses: expensesResult.rows,
        checklistCategories: checklistCategoriesResult.rows,
        checklistItems: checklistItemsResult.rows,
        events: eventsResult.rows,
        venues: venuesResult.rows,
        venueContracts: venueContractsResult.rows,
        photoReferences: photoReferencesResult.rows,
      },
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=wedding-backup-${new Date().toISOString().slice(0, 10)}.json`);
    res.json(backupData);
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ error: '데이터 내보내기에 실패했습니다' });
  }
};


/**
 * POST /api/backup/import
 * JSON 데이터 가져오기 (트랜잭션 기반)
 */
export const importData = async (req: AuthRequest, res: Response) => {
  try {
    const coupleId = req.user!.coupleId;

    if (!coupleId) {
      return res.status(404).json({ error: 'No couple found' });
    }

    const { version, data } = req.body;

    if (!version || !data) {
      return res.status(400).json({ error: '유효하지 않은 백업 파일입니다' });
    }

    await withTransaction(async (client) => {
      // 1. 기존 데이터 삭제 (의존성 순서: 자식 → 부모)
      await client.query('DELETE FROM venue_contracts WHERE couple_id = $1', [coupleId]);
      await client.query('DELETE FROM photo_references WHERE couple_id = $1', [coupleId]);
      await client.query('DELETE FROM events WHERE couple_id = $1', [coupleId]);
      await client.query('DELETE FROM checklist_items WHERE couple_id = $1', [coupleId]);
      await client.query('DELETE FROM checklist_categories WHERE couple_id = $1', [coupleId]);
      await client.query('DELETE FROM expenses WHERE couple_id = $1', [coupleId]);
      await client.query('DELETE FROM budget_categories WHERE couple_id = $1', [coupleId]);

      // 2. 예산 설정 복원
      if (data.budget) {
        await client.query(
          `UPDATE budget_settings SET
            total_budget = $2,
            groom_ratio = $3,
            bride_ratio = $4,
            updated_at = CURRENT_TIMESTAMP
          WHERE couple_id = $1`,
          [coupleId, data.budget.total_budget || 0, data.budget.groom_ratio || 50, data.budget.bride_ratio || 50]
        );
      }

      // 3. 예산 카테고리 복원
      if (data.categories?.length) {
        for (const cat of data.categories) {
          await client.query(
            `INSERT INTO budget_categories (couple_id, name, icon, parent_id, budget_amount, color, "order")
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [coupleId, cat.name, cat.icon, cat.parent_id, cat.budget_amount || 0, cat.color, cat.order || 0]
          );
        }
      }

      // 카테고리 이름 → 새 ID 매핑 (지출 복원 시 사용)
      const newCategoriesResult = await client.query(
        'SELECT id, name FROM budget_categories WHERE couple_id = $1',
        [coupleId]
      );
      const categoryMap = new Map<string, number>();
      for (const row of newCategoriesResult.rows) {
        categoryMap.set(row.name, row.id);
      }

      // 4. 지출 복원
      if (data.expenses?.length) {
        for (const exp of data.expenses) {
          // 카테고리 이름으로 매핑 (원본 카테고리 이름이 있으면)
          const categoryId = exp.category_name
            ? categoryMap.get(exp.category_name) || null
            : null;

          await client.query(
            `INSERT INTO expenses (couple_id, category_id, title, amount, date, payer, payment_method, vendor, notes, status, due_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              coupleId, categoryId, exp.title, exp.amount, exp.date,
              exp.payer, exp.payment_method, exp.vendor, exp.notes,
              exp.status || 'completed', exp.due_date || null,
            ]
          );
        }
      }

      // 5. 체크리스트 카테고리 복원
      const checklistCategoryMap = new Map<string, string>();
      if (data.checklistCategories?.length) {
        for (const cat of data.checklistCategories) {
          const result = await client.query(
            `INSERT INTO checklist_categories (couple_id, name, icon, color, sort_order)
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [coupleId, cat.name, cat.icon, cat.color, cat.sort_order || 0]
          );
          checklistCategoryMap.set(cat.id, result.rows[0].id);
        }
      }

      // 6. 체크리스트 항목 복원
      if (data.checklistItems?.length) {
        for (const item of data.checklistItems) {
          const newCategoryId = item.category_id
            ? checklistCategoryMap.get(item.category_id) || null
            : null;

          await client.query(
            `INSERT INTO checklist_items (couple_id, category_id, title, description, due_date, due_period, is_completed, completed_at, assigned_to, priority, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              coupleId, newCategoryId, item.title, item.description,
              item.due_date, item.due_period, item.is_completed || false,
              item.completed_at, item.assigned_to || 'both',
              item.priority || 'medium', item.sort_order || 0,
            ]
          );
        }
      }

      // 7. 식장 복원
      const venueMap = new Map<number | string, number>();
      if (data.venues?.length) {
        for (const venue of data.venues) {
          const result = await client.query(
            `INSERT INTO venues (couple_id, name, type, address, phone, price, rating, status, visit_date, notes, pros, cons, images, exclusion_reason)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
            [
              coupleId, venue.name, venue.type, venue.address, venue.phone,
              venue.price || 0, venue.rating, venue.status || 'considering',
              venue.visit_date, venue.notes, venue.pros, venue.cons,
              venue.images, venue.exclusion_reason,
            ]
          );
          venueMap.set(venue.id, result.rows[0].id);
        }
      }

      // 8. 식장 계약 복원
      if (data.venueContracts?.length) {
        for (const contract of data.venueContracts) {
          const newVenueId = venueMap.get(contract.venue_id);
          if (!newVenueId) continue;

          await client.query(
            `INSERT INTO venue_contracts (venue_id, couple_id, event_datetime, event_location, guaranteed_guests, deposit_amount, deposit_paid, total_contract_amount, total_paid_amount, contract_memo)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              newVenueId, coupleId, contract.event_datetime,
              contract.event_location, contract.guaranteed_guests || 0,
              contract.deposit_amount || 0, contract.deposit_paid || false,
              contract.total_contract_amount || 0, contract.total_paid_amount || 0,
              contract.contract_memo,
            ]
          );
        }
      }

      // 9. 일정 복원
      if (data.events?.length) {
        for (const event of data.events) {
          await client.query(
            `INSERT INTO events (couple_id, title, description, start_date, start_time, end_date, end_time, is_all_day, category, color, icon, location, location_url, reminder_minutes, assigned_to)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
            [
              coupleId, event.title, event.description, event.start_date,
              event.start_time, event.end_date, event.end_time,
              event.is_all_day || false, event.category, event.color,
              event.icon, event.location, event.location_url,
              event.reminder_minutes, event.assigned_to || 'both',
            ]
          );
        }
      }

      // 10. 포토 레퍼런스 복원
      if (data.photoReferences?.length) {
        for (const photo of data.photoReferences) {
          await client.query(
            `INSERT INTO photo_references (couple_id, image_url, category, title, memo, tags, source_url, is_favorite, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              coupleId, photo.image_url, photo.category || 'etc',
              photo.title || '', photo.memo || '', photo.tags || '{}',
              photo.source_url, photo.is_favorite || false, photo.sort_order || 0,
            ]
          );
        }
      }
    });

    res.json({ success: true, message: '데이터를 성공적으로 가져왔습니다' });
  } catch (error) {
    console.error('Import data error:', error);
    res.status(500).json({ error: '데이터 가져오기에 실패했습니다' });
  }
};
