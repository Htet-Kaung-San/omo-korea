const supabase = require('../supabaseClient');

async function getIds() {
  const { data, error } = await supabase
    .from('major')
    .select('major_id, major_name')
    .in('major_name', [
      'Urban Engineering',
      'Industrial Engineering',
      'Polymer Engineering'
    ]);
    
  if (error) console.error(error);
  else console.log(data);
}
getIds();
