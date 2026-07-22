/**
 * Seed map facilities + academic records into REAL Supabase.
 *
 * Prerequisite: run backend/supabase/map_profile_migration.sql in the
 * Supabase SQL Editor once (adds columns + academic tables).
 *
 *   npm run seed:map-profile
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

const facilities = [
  {
    name: "Engineering Building 3",
    type: "Academic",
    latitude: 35.233,
    longitude: 129.0805,
    hours: "08:00 AM - 10:00 PM",
    details: "Home of Computer Science and multimedia labs.",
    floors: "2F: Seminar Room; 3F: CS Dept & Labs",
    subtitle: "Computer Science Dept.",
    phone: "051-510-2200",
    website: "https://cse.pusan.ac.kr",
    image_url: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1200&q=80",
    departments: [
      { name: "Computer Science Department", floor: "3F" },
      { name: "Multimedia Lab", floor: "3F" },
      { name: "Lecture Rooms 301-308", floor: "3F" },
      { name: "Seminar Room", floor: "2F" },
    ],
    amenities: [
      { name: "Computer Labs", floor: "3F" },
      { name: "Seminar Room", floor: "2F" },
      { name: "Student Lounge", floor: "1F" },
    ],
  },
  {
    name: "IT Building",
    type: "Academic",
    latitude: 35.2342,
    longitude: 129.081,
    hours: "08:00 AM - 09:00 PM",
    details: "Information technology classrooms and labs.",
    floors: "1F-4F: IT classrooms and labs",
    subtitle: "IT & Computing",
    phone: "051-510-2210",
    website: "https://www.pusan.ac.kr",
    image_url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
    departments: [
      { name: "IT Help Desk", floor: "1F" },
      { name: "Programming Labs", floor: "2F-3F" },
    ],
    amenities: [
      { name: "Public Computers", floor: "1F" },
      { name: "Printer Room", floor: "1F" },
    ],
  },
  {
    name: "Main Hall",
    type: "Administrative",
    latitude: 35.2325,
    longitude: 129.0788,
    hours: "09:00 AM - 06:00 PM",
    details: "Central campus hall for events and ceremonies.",
    floors: "1F: Lobby; 2F: Auditorium",
    subtitle: "Events & Ceremonies",
    phone: "051-510-1100",
    website: "https://www.pusan.ac.kr",
    image_url: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&q=80",
    departments: [
      { name: "Main Auditorium", floor: "2F" },
      { name: "Reception", floor: "1F" },
    ],
    amenities: [
      { name: "Event Hall", floor: "2F" },
      { name: "Cloakroom", floor: "1F" },
    ],
  },
  {
    name: "Student Center",
    type: "Student Life",
    latitude: 35.232,
    longitude: 129.0798,
    hours: "08:00 AM - 10:00 PM",
    details: "Clubs, student council, and campus activities hub.",
    floors: "1F-3F: Club rooms and offices",
    subtitle: "Clubs & Activities",
    phone: "051-510-1300",
    website: "https://www.pusan.ac.kr",
    image_url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80",
    departments: [
      { name: "Student Council", floor: "2F" },
      { name: "Club Offices", floor: "1F-3F" },
    ],
    amenities: [
      { name: "Meeting Rooms", floor: "2F" },
      { name: "Lounge", floor: "1F" },
    ],
  },
  {
    name: "University Headquarters (대학본부)",
    type: "Administrative",
    latitude: 35.2301,
    longitude: 129.0825,
    hours: "09:00 - 18:00",
    details: "OIA and student services.",
    floors: "1F: Service Center; 2F: OIA",
    subtitle: "Admin & Student Services",
    phone: "051-510-1000",
    website: "https://www.pusan.ac.kr",
    image_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80",
    departments: [
      { name: "Student Service Center", floor: "1F" },
      { name: "Office of International Affairs", floor: "2F" },
    ],
    amenities: [
      { name: "Visa & ARC Desk", floor: "2F" },
      { name: "Information Desk", floor: "1F" },
    ],
  },
];

async function probeSchema() {
  const { data, error } = await supabase.from("facility").select("*").limit(1);
  if (error) throw new Error(`facility probe failed: ${error.message}`);
  const cols = Object.keys(data?.[0] || {});
  const { error: academicError } = await supabase
    .from("academic_record")
    .select("record_id, record_type")
    .limit(1);
  return {
    facilityColumns: cols,
    hasEnrichment: cols.includes("subtitle") && cols.includes("image_url"),
    hasAcademic: !academicError,
    academicError: academicError?.message || null,
  };
}

async function main() {
  const schema = await probeSchema();
  console.log("facility columns:", schema.facilityColumns.join(", ") || "(empty table)");
  console.log("enrichment ready:", schema.hasEnrichment);
  console.log("academic table ready:", schema.hasAcademic);

  if (!schema.hasEnrichment || !schema.hasAcademic) {
    console.error("\nSchema not ready. In Supabase Dashboard → SQL Editor, run:");
    console.error("  backend/supabase/map_profile_migration.sql\n");
    console.error("Then re-run: npm run seed:map-profile");
    if (!schema.hasAcademic) console.error("academic:", schema.academicError);
    process.exit(1);
  }

  console.log("\nUpserting facilities...");
  for (const row of facilities) {
    const { data: existingRow } = await supabase
      .from("facility")
      .select("facility_id")
      .eq("name", row.name)
      .maybeSingle();

    if (existingRow?.facility_id) {
      const { error } = await supabase
        .from("facility")
        .update(row)
        .eq("facility_id", existingRow.facility_id);
      if (error) console.error("FAIL update", row.name, error.message);
      else console.log("updated", row.name);
    } else {
      const { error } = await supabase.from("facility").insert(row);
      if (error) console.error("FAIL insert", row.name, error.message);
      else console.log("inserted", row.name);
    }
  }

  // Enrich library / cafeteria rows already in DB
  const { data: existing } = await supabase.from("facility").select("facility_id, name, type");
  for (const f of existing || []) {
    if (/library/i.test(f.name)) {
      await supabase
        .from("facility")
        .update({
          hours: "06:00 - 23:00",
          subtitle: "Study rooms, Books",
          phone: "051-510-1800",
          website: "https://lib.pusan.ac.kr",
          image_url:
            "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1200&q=80",
          departments: [
            { name: "General Reading Rooms", floor: "1F" },
            { name: "Book Stacks & Reference", floor: "2F" },
            { name: "Silent Study Desks", floor: "3F" },
          ],
          amenities: [
            { name: "Study Rooms", floor: "1F-3F" },
            { name: "Computers", floor: "3F" },
          ],
        })
        .eq("facility_id", f.facility_id);
    }
    if (f.type === "Cafeteria" || /cafeteria|회관/i.test(f.name)) {
      await supabase
        .from("facility")
        .update({
          subtitle: "Food & Drinks",
          phone: "051-510-1200",
          website: "https://www.pusan.ac.kr",
          image_url:
            "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=1200&q=80",
          departments: [{ name: "Dining Hall", floor: "1F" }],
          amenities: [{ name: "Meals", floor: "1F" }],
        })
        .eq("facility_id", f.facility_id);
    }
  }

  const { data: students, error: studentErr } = await supabase
    .from("student")
    .select("student_id")
    .order("student_id", { ascending: true });

  if (studentErr) {
    console.error("student lookup FAIL", studentErr.message);
    process.exit(1);
  }

  if (!students?.length) {
    console.warn("No students in student table — skipping academic records seed");
  } else {
    console.log(`\nUpserting academic records for ${students.length} student(s)...`);
    for (let i = 0; i < students.length; i += 1) {
      const studentId = students[i].student_id;
      const overall = Math.min(3.3 + (i + 1) * 0.12, 4.0);
      const completed = Math.min(60 + (i + 1) * 4, 100);
      const standing = overall >= 3.7 ? "Good" : overall >= 3.5 ? "Satisfactory" : "Warning";

      await supabase.from("academic_record").delete().eq("student_id", studentId);
      const { error: recErr } = await supabase.from("academic_record").insert([
        {
          student_id: studentId,
          record_type: "summary",
          overall_gpa: overall,
          gpa_scale: 4.5,
          standing,
          completed_credits: completed,
          required_credits: 100,
          sort_order: 0,
        },
        {
          student_id: studentId,
          record_type: "semester",
          semester_label: "2024 Spring",
          gpa: Math.min(overall + 0.13, 4.5),
          sort_order: 1,
        },
        {
          student_id: studentId,
          record_type: "semester",
          semester_label: "2023 Fall",
          gpa: Math.max(overall - 0.07, 0),
          sort_order: 2,
        },
        {
          student_id: studentId,
          record_type: "semester",
          semester_label: "2023 Spring",
          gpa: Math.max(overall - 0.22, 0),
          sort_order: 3,
        },
        {
          student_id: studentId,
          record_type: "semester",
          semester_label: "2022 Fall",
          gpa: Math.max(overall - 0.37, 0),
          sort_order: 4,
        },
      ]);
      if (recErr) {
        console.error("academic_record FAIL", studentId, recErr.message);
        process.exit(1);
      }
      console.log("  seeded", studentId);
    }
  }

  const { count } = await supabase
    .from("facility")
    .select("*", { count: "exact", head: true });
  console.log("\nDone. facility count:", count);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
