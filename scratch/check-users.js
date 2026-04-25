import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkExistingUsers() {
  console.log('👥 Listing users to see successful signups...');
  
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('❌ Error listing users:', error.message);
    return;
  }

  console.log(`✅ Found ${users.length} users in auth.users.`);
  
  for (const user of users) {
    console.log(`\nUser: ${user.email} (${user.id})`);
    console.log('Metadata:', JSON.stringify(user.user_metadata, null, 2));
    
    const { data: profile, error: profError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
      
    if (profError) {
      console.error(`❌ Error fetching profile for ${user.id}:`, profError.message);
    } else if (profile) {
      console.log('Profile:', JSON.stringify(profile, null, 2));
    } else {
      console.log('⚠️ No profile found for this user.');
    }
  }
}

checkExistingUsers();
