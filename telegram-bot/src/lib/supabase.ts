import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config(); // Load from local .env file

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
// Note: The bot should ideally use the SERVICE_ROLE_KEY for admin privileges.
// We check for both for backward compatibility.

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
