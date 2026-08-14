const supabase = require('../supabaseClient');

async function getIds() {
  const { data, error } = await supabase
    .from('major')
    .select('major_id, major_name')
    .in('major_name', [
      'Electrical and Electronic Engineering - Electrical Engineering major',
      'Electrical and Electronic Engineering - Electronics Engineering major',
      'Information and Computer Engineering - Computer Engineering major',
      'Aerospace Engineering',
      'Environmental Engineering',
      'Architecture'
    ]);
    
  if (error) console.error(error);
  else console.log(data);
}
getIds();
