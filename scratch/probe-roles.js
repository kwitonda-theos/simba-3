import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function probeRoles() {
  console.log('🧪 Probing role variants...');
  
  const roles = ['customer', 'branch_manager', 'branch-manager', 'manager', 'admin'];
  
  for (const role of roles) {
    const { error } = await supabase
      .from('profiles')
      .insert({ 
        id: '00000000-0000-0000-0000-000000000000',
        full_name: 'Role Test',
        role: role
      });

    if (error && error.code === '22P02') {
       console.log(`❌ Role '${role}' is NOT valid (Invalid text representation / Enum mismatch).`);
    } else if (error && error.code === '23503') {
       console.log(`✅ Role '${role}' is VALID (Column exists and accepted value).`);
    } else {
       console.log(`❓ Role '${role}' returned error: ${error?.code} - ${error?.message}`);
    }
  }
}

probeRoles();
