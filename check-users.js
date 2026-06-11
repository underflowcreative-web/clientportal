const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Parse .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase URL or Key in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log('Connecting to Supabase:', supabaseUrl);
  
  // Fetch profiles
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('*');
    
  if (pError) {
    console.error('Error fetching profiles:', pError);
  } else {
    console.log('Profiles in DB:', profiles);
  }
  
  // Check auth users count (if we can, though anon key might not allow it, but let's see)
  try {
    const { data: projects, error: projError } = await supabase
      .from('projects')
      .select('*');
    if (projError) {
      console.error('Error fetching projects:', projError);
    } else {
      console.log('Projects in DB:', projects);
    }
  } catch (e) {
    console.error(e);
  }
}

check();
