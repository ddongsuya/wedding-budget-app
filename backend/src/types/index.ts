import { Request } from 'express';

export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  couple_id?: number;
  role?: string;
  is_admin: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Couple {
  id: number;
  user1_id: number;
  user2_id: number;
  invite_code: string | null;
  created_at: Date;
}

export interface CoupleProfile {
  id: number;
  couple_id: number;
  groom_name?: string;
  groom_image?: string;
  groom_birth_date?: Date;
  groom_contact?: string;
  bride_name?: string;
  bride_image?: string;
  bride_birth_date?: Date;
  bride_contact?: string;
  couple_photo?: string;
  first_met_date?: Date;
  wedding_date?: Date;
  couple_nickname?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  type: 'new' | 'update' | 'notice' | 'maintenance';
  priority: number;
  is_active: boolean;
  start_date: Date;
  end_date: Date | null;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    coupleId?: number;
    isAdmin?: boolean;
  };
  file?: Express.Multer.File;
}
