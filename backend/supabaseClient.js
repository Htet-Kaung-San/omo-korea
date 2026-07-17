require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("placeholder")) {
  throw new Error(
    "Missing SUPABASE_URL / SUPABASE_KEY in backend/.env. Local mock DB is disabled — configure real Supabase credentials.",
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
