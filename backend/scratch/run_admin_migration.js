/**
 * Run the is_admin column migration via Supabase REST API.
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('Running is_admin migration...');

  // Use Supabase's rpc to execute raw SQL
  const { data, error } = await supabase.rpc('exec_sql', {
    query: 'ALTER TABLE student ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;'
  });

  if (error) {
    console.log('RPC exec_sql not available (expected). Trying alternative approach...');

    // Alternative: Try to use the management API or just manually insert the column
    // We can use the Supabase SQL Editor API via the management endpoints
    // For now, use a workaround: update a non-existent column will fail, 
    // so let's try REST API directly
    const fetch = globalThis.fetch || require('node-fetch');

    const sqlQuery = 'ALTER TABLE student ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;';

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ query: sqlQuery }),
    });

    if (!response.ok) {
      console.log('Direct RPC also not available.');
      console.log('');
      console.log('Please run this SQL in your Supabase Dashboard SQL Editor:');
      console.log('');
      console.log('  ALTER TABLE student ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;');
      console.log('  UPDATE student SET is_admin = true WHERE student_id = \'202455474\';');
      console.log('');
      console.log('Dashboard URL: https://supabase.com/dashboard/project/yvjjylvojebxvzwuluck/sql');
      return;
    }

    console.log('✓ Migration executed successfully via REST API.');
  } else {
    console.log('✓ Migration executed successfully via RPC.');
  }
}

runMigration();
