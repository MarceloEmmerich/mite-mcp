export interface MiteConfig {
  accountName: string;
  apiKey?: string;
  email?: string;
  password?: string;
}

export interface TimeEntry {
  id?: number;
  date_at?: string;
  minutes?: number;
  note?: string;
  user_id?: number;
  user_name?: string;
  project_id?: number;
  project_name?: string;
  customer_id?: number;
  customer_name?: string;
  service_id?: number;
  service_name?: string;
  billable?: boolean;
  locked?: boolean;
  revenue?: number;
  hourly_rate?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id?: number;
  name: string;
  note?: string;
  archived?: boolean;
  hourly_rate?: number;
  hourly_rates_per_service?: Array<{
    service_id: number;
    hourly_rate: number;
  }>;
  created_at?: string;
  updated_at?: string;
}

export interface Project {
  id?: number;
  name: string;
  note?: string;
  customer_id?: number;
  customer_name?: string;
  budget?: number;
  budget_type?: string;
  archived?: boolean;
  hourly_rate?: number;
  hourly_rates_per_service?: Array<{
    service_id: number;
    hourly_rate: number;
  }>;
  created_at?: string;
  updated_at?: string;
}

export interface Service {
  id?: number;
  name: string;
  note?: string;
  hourly_rate?: number;
  billable?: boolean;
  archived?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id?: number;
  name?: string;
  email?: string;
  note?: string;
  archived?: boolean;
  role?: string;
  language?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GroupedTimeEntry {
  minutes: number;
  revenue?: number;
  user_id?: number;
  user_name?: string;
  customer_id?: number;
  customer_name?: string;
  project_id?: number;
  project_name?: string;
  service_id?: number;
  service_name?: string;
  year?: number;
  month?: number;
  week?: number;
  day?: number;
}

export interface MiteApiError {
  error: string;
  message: string;
}

export type GroupBy =
  | 'customer'
  | 'project'
  | 'service'
  | 'user'
  | 'day'
  | 'week'
  | 'month'
  | 'year';
