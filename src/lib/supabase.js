import { createClient } from '@supabase/supabase-js';

// Support both Vite (import.meta.env) and Node.js (process.env)
const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) 
  || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) 
  || '';

const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) 
  || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) 
  || '';

// Mocking if keys are missing to avoid crash in development
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase keys missing. Authentication will use mock fallback.');
}

// Ensure supabaseUrl is a valid URL string or a placeholder to prevent createClient from throwing
const validUrl = supabaseUrl && supabaseUrl.startsWith('http') ? supabaseUrl : 'https://placeholder.supabase.co';
const validKey = supabaseAnonKey || 'placeholder-key';

export const supabase = createClient(validUrl, validKey);
