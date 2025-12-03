export interface ChecklistCategory {
  id: string;
  couple_id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  couple_id: string;
  category_id: string | null;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  title: string;
  description: string | null;
  due_date: string | null;
  due_period: DuePeriod | null;
  is_completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  assigned_to: 'groom' | 'bride' | 'both';
  priority: 'high' | 'medium' | 'low';
  linked_expense_id: string | null;
  linked_venue_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type DuePeriod = 'D-180' | 'D-150' | 'D-120' | 'D-90' | 'D-60' | 'D-30' | 'D-14' | 'D-7' | 'D-1' | 'D-DAY' | 'AFTER';

export interface ChecklistStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  due_today: number;
  due_this_week: number;
  completionRate: number;
}

export interface ChecklistFilters {
  category_id?: string;
  is_completed?: boolean;
  due_period?: DuePeriod;
  assigned_to?: 'groom' | 'bride' | 'both';
}
