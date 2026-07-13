const supabase = require("../supabaseClient");

async function checkColumns() {
  console.log("Fetching a single post from the live database...");
  const { data, error } = await supabase.from("post").select("*").limit(1);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Post columns:", Object.keys(data[0] || {}));
    console.log("Full data:", data);
  }
}

checkColumns();
