/**
 * Run the is_admin column migration on the real Supabase database.
 */
const supabase = require('../supabaseClient');

async function migrate() {
  console.log('Adding is_admin column to student table...');

  // Try to update a student's is_admin to test if column exists
  const { error: testError } = await supabase
    .from('student')
    .select('is_admin')
    .limit(1);

  if (testError && testError.message.includes('is_admin')) {
    console.log('Column does not exist yet. Running migration via raw SQL...');
    // We need to add it via Supabase Dashboard SQL editor or use RPC
    // For now, let's try setting a default value
    console.error('Please run this SQL in your Supabase Dashboard SQL editor:');
    console.error('ALTER TABLE student ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;');
    process.exit(1);
  }

  console.log('✓ is_admin column exists or was already added.');

  // Now list all students with their is_admin status
  const { data, error } = await supabase
    .from('student')
    .select('student_id, name, is_admin');

  if (error) {
    console.error('Error listing students:', error.message);
    return;
  }

  console.log('Current admin status:');
  data.forEach(s => {
    console.log(`  ${s.student_id} (${s.name}): is_admin = ${s.is_admin}`);
  });
}

migrate();
