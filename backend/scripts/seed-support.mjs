/**
 * Seed PNU Contact Support + FAQ into REAL Supabase.
 *
 * Prerequisite: run backend/supabase/support_contacts.sql in the
 * Supabase SQL Editor once (creates tables + initial rows).
 *
 *   npm run seed:support
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("placeholder")) {
  console.error("Configure real SUPABASE_URL / SUPABASE_KEY in backend/.env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const contacts = [
  {
    slug: "oia",
    name: "Office of International Affairs (OIA)",
    place: "University Headquarters 2F",
    hours: "Weekdays 09:00 – 18:00",
    phone: "051-510-1000",
    email: "oia@pusan.ac.kr",
    sort_order: 1,
    is_active: true,
  },
  {
    slug: "one-stop",
    name: "One-Stop Service Center",
    place: "University Headquarters 1F",
    hours: "Weekdays 09:00 – 17:30",
    phone: "051-510-1224",
    email: null,
    sort_order: 2,
    is_active: true,
  },
  {
    slug: "library",
    name: "Central Library Help Desk",
    place: "PNU Main Library 1F",
    hours: "Weekdays 09:00 – 18:00",
    phone: "051-510-1800",
    email: "lib@pusan.ac.kr",
    sort_order: 3,
    is_active: true,
  },
];

const faqs = [
  {
    slug: "login",
    question: "I cannot log in to Hey! PNU. What should I do?",
    answer:
      "Confirm your student ID and password. Use Forgot password on the login screen, or contact OIA if your account was never created.",
    sort_order: 1,
    is_active: true,
  },
  {
    slug: "language",
    question: "How do I change the app language?",
    answer:
      "Open Profile → Settings (gear) → Language, or use the language selector in the top bar.",
    sort_order: 2,
    is_active: true,
  },
  {
    slug: "map",
    question: "Why is the campus map blank?",
    answer:
      "The map needs a valid Naver Maps Client ID and Web Service URL set to http://localhost (no port) for local development.",
    sort_order: 3,
    is_active: true,
  },
  {
    slug: "visa",
    question: "Where can I get help with ARC / visa?",
    answer:
      "Visit Office of International Affairs (Headquarters 2F) or open Emergency / Contact Support in Help & Support.",
    sort_order: 4,
    is_active: true,
  },
];

async function main() {
  const { error: contactError } = await supabase
    .from("pnu_contact")
    .upsert(contacts, { onConflict: "slug" });
  if (contactError) {
    console.error("pnu_contact upsert failed:", contactError.message);
    console.error("Did you run backend/supabase/support_contacts.sql first?");
    process.exit(1);
  }

  const { error: faqError } = await supabase
    .from("faq_item")
    .upsert(faqs, { onConflict: "slug" });
  if (faqError) {
    console.error("faq_item upsert failed:", faqError.message);
    process.exit(1);
  }

  console.log(`Upserted ${contacts.length} PNU contacts and ${faqs.length} FAQ items.`);
}

main();
