require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const WebSocket = require("ws");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("placeholder")) {
  throw new Error(
    "Missing SUPABASE_URL / SUPABASE_KEY in backend/.env. Local mock DB is disabled — configure real Supabase credentials.",
  );
}

// Dedicated client for Supabase Auth calls (sign-in, admin user management).
//
// This is deliberately separate from ../supabaseClient. Calling
// signInWithPassword on a shared client stores the signed-in user's session on
// that client and swaps the Authorization header used for subsequent PostgREST
// queries. On a server handling concurrent logins that means one student's
// request can end up running under another student's identity. Disabling
// session persistence keeps every call stateless and leaves the data client
// permanently on the service-role key.
const supabaseAuth = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    transport: WebSocket,
  },
});

module.exports = supabaseAuth;
