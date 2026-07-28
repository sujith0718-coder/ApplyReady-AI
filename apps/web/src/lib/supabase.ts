import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) throw new Error('Missing Supabase env vars');

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});

export const DEMO_OPPORTUNITY_ID = 'a0000000-0000-0000-0000-000000000001';
