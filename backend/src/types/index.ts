import { Request } from 'express';

export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  created_at: Date;
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

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    coupleId?: number;
  };
  file?: Express.Multer.File;
}
