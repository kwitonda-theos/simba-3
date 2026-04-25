import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Test with ANON KEY like the browser does
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function debugSignup() {
  const email = `test_${Date.now()}@example.com`;
  const password = 'Password123!';
  
  console.log(`🧪 Attempting debug signup with ANON KEY for ${email}...`);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Test User',
        role: 'customer',
        primary_branch_id: null
      }
    }
  });

  if (error) {
    console.log('❌ Signup failed!');
    console.log('Error Message:', error.message);
    console.log('Full Error Object:', JSON.stringify(error, null, 2));
  } else {
    console.log('✅ Signup worked via script! User ID:', data.user.id);
  }
}

debugSignup();
