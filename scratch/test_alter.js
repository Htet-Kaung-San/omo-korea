const supabase = require("../supabaseClient");

async function testAlter() {
  console.log("Attempting to add column via exec_sql RPC...");
  const { data: r1, error: e1 } = await supabase.rpc("exec_sql", {
    query:
      "ALTER TABLE post ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0",
  });
  console.log("exec_sql response:", r1, e1);

  const { data: r2, error: e2 } = await supabase.rpc("run_sql", {
    sql: "ALTER TABLE post ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0",
  });
  console.log("run_sql response:", r2, e2);
}

testAlter();
