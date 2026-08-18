import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import readline from "readline";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Configure SUPABASE_URL / SUPABASE_KEY in backend/.env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

async function run() {
  const studentId = await question("Enter Student ID (e.g., 202699999): ");
  const name = await question("Enter Name: ");
  const email = await question("Enter Email: ");
  const password = await question("Enter Password: ");

  console.log("\nAdding user to Auth...");
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: password,
    email_confirm: true,
  });

  if (authError) {
    console.error("Auth creation failed:", authError.message);
    process.exit(1);
  }

  console.log("Adding user to student table (major_id will be null for onboarding)...");
  const { error: studentError } = await supabase.from("student").upsert(
    {
      student_id: parseInt(studentId, 10),
      name,
      email,
      is_admin: false,
      password: "[SUPABASE_AUTH]",
      nationality: "South Korea",
      phone: "010-0000-0000",
      language_pref: "ko",
      major_id: null,
      grade: 1,
      student_type: "Current",
      visa_status: "D-2",
      is_in_korea: true,
      intake_term: "March",
      completed_courses: [],
      deletion_requested: false,
    },
    { onConflict: "student_id" }
  );

  if (studentError) {
    console.error("Failed to add to student table:", studentError.message);
  } else {
    console.log(`\nSuccessfully added student ${name} (${studentId}). They will complete major selection upon first login.`);
  }

  rl.close();
}

run();
