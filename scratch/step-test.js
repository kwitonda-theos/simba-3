import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testStepByStep() {
  const email = `manual_${Date.now()}@example.com`;
  console.log(`🧪 Step 1: Creating user for ${email}...`);
  
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password: 'Password123!',
    email_confirm: true,
    user_metadata: { full_name: 'Manual Test' }
  });

  if (userError) {
     console.error('❌ User creation failed:', userError.message);
     return;
  }
  
  const userId = userData.user.id;
  console.log(`✅ User created: ${userId}`);

  console.log('🧪 Step 2: Manually inserting profile with customer role...');
  const { error: profError } = await supabase.from('profiles').insert({
    id: userId,
    full_name: 'Manual Test',
    role: 'customer'
  });

  if (profError) {
    console.log('❌ Customer profile insert failed:', profError.message);
  } else {
    console.log('✅ Customer profile insert worked!');
  }

  console.log('🧪 Step 3: Updating profile to branch_manager...');
  const { error: roleError } = await supabase.from('profiles').update({
    role: 'branch_manager'
  }).eq('id', userId);

  if (roleError) {
    console.log('❌ Role update failed:', roleError.message);
  } else {
    console.log('✅ Role update worked!');
  }

  // Cleanup
  await supabase.auth.admin.deleteUser(userId);
}

testStepByStep();
