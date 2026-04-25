import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testTwoStep() {
  const email = `twostep_${Date.now()}@test.com`;
  console.log(`🧪 Attempting signup for ${email}...`);

  // Step 1: Sign up (trigger will fail but user might be created if trigger is AFTER INSERT)
  // Actually, if trigger is BEFORE or AFTER and fails, the whole transaction rolls back.
  // UNLESS the trigger is not the one causing the error.
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'Password123!',
    options: {
      data: { full_name: 'Two Step' }
    }
  });

  if (error) {
    console.log('❌ Signup Step 1 failed:', error.message);
  } else {
    console.log('✅ Signup Step 1 worked! ID:', data.user.id);
  }
}

testTwoStep();
