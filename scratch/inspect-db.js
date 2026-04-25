import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function inspectSchema() {
  console.log('🔍 Starting Database Inspection...');

  // 1. Check Profiles table structure
  console.log('\n--- Profiles Table Columns ---');
  const { data: columns, error: colError } = await supabase.rpc('get_table_columns', { table_name: 'profiles' });
  
  if (colError) {
    // If RPC doesn't exist, try a direct query to information_schema via SQL if possible
    // But since we can't do arbitrary SQL via JS client easily without a function, 
    // let's try to just select one row or check common columns.
    console.log('RPC get_table_columns failed, attempting direct metadata query...');
    const { data: infoSchema, error: infoError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (infoError) {
      console.error('❌ Error accessing profiles table:', infoError.message);
    } else {
      console.log('✅ Successfully accessed profiles table.');
      if (infoSchema.length > 0) {
        console.log('Sample columns found:', Object.keys(infoSchema[0]).join(', '));
      } else {
        console.log('Profiles table is empty, but it exists.');
      }
    }
  }

  // 2. Check for branches table
  console.log('\n--- Branches Table ---');
  const { data: branches, error: branchError } = await supabase.from('branches').select('*').limit(5);
  if (branchError) {
    console.error('❌ Error accessing branches table:', branchError.message);
  } else {
    console.log(`✅ Found ${branches.length} branches.`);
    if (branches.length > 0) {
       console.log('Sample branch fields:', Object.keys(branches[0]).join(', '));
    }
  }

  // 3. Try to find the exact trigger error by looking at the most recent logs if possible
  // Since we can't see server logs, let's try to "dry run" an insert if we can find the profile fields.
}

inspectSchema();
