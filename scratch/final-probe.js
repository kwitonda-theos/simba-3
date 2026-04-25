import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function probe() {
  console.log('🧪 Final probing attempt...');
  
  // 1. Try with just 'id'
  const { error: error1 } = await supabase.from('profiles').insert({ id: '00000000-0000-0000-0000-000000000000' });
  if (error1 && error1.code === '23503') console.log('✅ id is a valid column.');
  
  // 2. Try with 'full_name'
  const { error: error2 } = await supabase.from('profiles').insert({ id: '00000000-0000-0000-0000-000000000000', full_name: 'Test' });
  if (error2 && error2.code === '23503') {
     console.log('✅ full_name is a valid column.');
  } else {
     console.log(`❌ full_name failed: ${error2?.message} (${error2?.code})`);
  }

  // 3. Try with 'role'
  const { error: error3 } = await supabase.from('profiles').insert({ id: '00000000-0000-0000-0000-000000000000', role: 'customer' });
  if (error3 && error3.code === '23503') {
     console.log('✅ role is a valid column.');
  } else {
     console.log(`❌ role failed: ${error3?.message} (${error3?.code})`);
  }

  // 4. Try with 'name' instead of 'full_name'
  const { error: error4 } = await supabase.from('profiles').insert({ id: '00000000-0000-0000-0000-000000000000', name: 'Test' });
  if (error4 && error4.code === '23503') {
     console.log('✅ name is a valid column.');
  } else {
     console.log(`❌ name column check: ${error4?.message} (${error4?.code})`);
  }
}

probe();
