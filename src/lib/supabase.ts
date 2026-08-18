import { createClient } from '@supabase/supabase-js';

// Use secret key on server (bypasses RLS), fallback to publishable for build safety
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY!; // ✅ Use secret key

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);