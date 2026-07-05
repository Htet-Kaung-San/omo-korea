/**
 * Promote a student to admin in the real Supabase database.
 * Usage: node scratch/promote_admin.js <student_id>
 * Example: node scratch/promote_admin.js 202455474
 */
const supabase = require('../supabaseClient');

async function promoteAdmin() {
  const studentId = process.argv[2];
  if (!studentId) {
    console.error('Usage: node scratch/promote_admin.js <student_id>');
    process.exit(1);
  }

  console.log(`Promoting student ${studentId} to admin...`);

  const { data, error } = await supabase
    .from('student')
    .update({ is_admin: true })
    .eq('student_id', studentId)
    .select('student_id, name, is_admin')
    .single();

  if (error) {
    console.error('Error promoting student:', error.message);
    process.exit(1);
  }

  console.log('✓ Successfully promoted to admin:', data);
}

promoteAdmin();
