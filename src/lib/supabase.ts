import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/['"]/g, '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').replace(/['"]/g, '').trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.');
}

// Ensure the URL is a valid format even if it's a placeholder to prevent createClient from throwing
let finalUrl = supabaseUrl;
if (finalUrl && !finalUrl.startsWith('http')) {
  finalUrl = `https://${finalUrl}`;
}

const validUrl = finalUrl.startsWith('http') ? finalUrl : 'https://placeholder.supabase.co';

export const supabase = createClient(
  validUrl,
  supabaseAnonKey || 'placeholder'
);

/**
 * SQL Schema for Supabase:
 * 
 * create table time_entries (
 *   id uuid default gen_random_uuid() primary key,
 *   user_id uuid references auth.users(id) on delete cascade not null,
 *   task_name text not null,
 *   category text not null,
 *   start_time timestamptz not null,
 *   end_time timestamptz,
 *   duration integer, -- in seconds
 *   created_at timestamptz default now()
 * );
 * 
 * -- Enable RLS
 * alter table time_entries enable row level security;
 * 
 * -- Create policies
 * create policy "Users can manage their own time entries"
 *   on time_entries
 *   for all
 *   using (auth.uid() = user_id);
 */
