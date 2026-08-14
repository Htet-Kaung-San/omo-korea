const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../supabase/graduation_requirement_updates.sql');
let content = fs.readFileSync(filePath, 'utf8');

// Replace (ID, with (ID-13,
content = content.replace(/^\((\d+),/gm, (match, p1) => {
  const newId = parseInt(p1, 10) - 13;
  return `(${newId},`;
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated req_ids to start from 1.');
