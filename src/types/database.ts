export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: 'admin' | 'team' | 'client';
  avatar_url?: string;
  phone?: string;
  active: number;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: number;
  user_id?: number;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  country?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  subscription_status: 'active' | 'paused' | 'cancelled' | 'trial';
  subscription_start?: string;
  subscription_end?: string;
  monthly_fee?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  client_id: number;
  name: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  start_date?: string;
  deadline?: string;
  budget?: number;
  brief?: string;
  assigned_to?: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface Task {
  id: number;
  project_id: number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: number;
  due_date?: string;
  completed_at?: string;
  checklist?: string;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  entity_type: 'project' | 'task' | 'client';
  entity_id: number;
  user_id: number;
  content: string;
  created_at: string;
}

export interface Event {
  id: number;
  title: string;
  description?: string;
  event_type: 'meeting' | 'deadline' | 'reminder' | 'call';
  client_id?: number;
  project_id?: number;
  start_datetime: string;
  end_datetime?: string;
  location?: string;
  attendees?: string;
  reminder_sent: number;
  created_by: number;
  created_at: string;
}

export interface Communication {
  id: number;
  client_id: number;
  user_id: number;
  type: 'email' | 'call' | 'meeting' | 'whatsapp' | 'other';
  subject?: string;
  content?: string;
  communication_date: string;
}

export interface Resource {
  id: number;
  title: string;
  description?: string;
  category: 'template' | 'guide' | 'document' | 'other';
  file_url: string;
  file_type?: string;
  file_size?: number;
  access_level: 'public' | 'team' | 'admin';
  uploaded_by: number;
  created_at: string;
}

export type Bindings = {
  DB: D1Database;
  DOCUMENTS: R2Bucket;
  RESOURCES: R2Bucket;
};
