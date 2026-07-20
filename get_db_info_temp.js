const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: './.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data: posts, error: error1 } = await supabase.from('posts').select('id, title, slug, content, tags, status');
  console.log('--- POSTS ---');
  console.log(JSON.stringify(posts, null, 2));
  if (error1) console.error('Error1:', error1);
  
  const { data: channels, error: error2 } = await supabase.from('site_settings').select('*');
  console.log('--- CHANNELS ---');
  console.log(JSON.stringify(channels, null, 2));
  if (error2) console.error('Error2:', error2);
}
main();
