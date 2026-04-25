import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debugSignup() {
  const email = `test_${Date.now()}@example.com`;
  const password = 'Password123!';
  
  console.log(`🧪 Attempting debug signup for ${email}...`);

  // We use the same payload the AuthContext uses
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
    console.log('Error Status:', error.status);
    console.log('Full Error Object:', JSON.stringify(error, null, 2));
  } else {
    console.log('✅ Signup worked via script! User ID:', data.user.id);
    // Cleanup
    await supabase.auth.admin.deleteUser(data.user.id);
  }
}

debugSignup();
