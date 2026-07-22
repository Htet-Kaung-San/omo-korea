/**
 * Seed community_post with many demo posts in REAL Supabase.
 *
 * Prerequisites:
 *   - backend/supabase/community.sql (groups + posts table)
 *   - Students in `student` table with major_id / nationality
 *
 *   npm run seed:community-posts
 *
 * Re-run safe: removes prior rows tagged with #hey_pnu_seed in hashtags.
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const TARGET_POST_COUNT = 220;
const SEED_TAG = "#hey_pnu_seed";
const BATCH_SIZE = 50;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("placeholder")) {
  console.error("Configure real SUPABASE_URL / SUPABASE_KEY in backend/.env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function slugifyLabel(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function departmentSlugFromMajor(majorName) {
  const base = slugifyLabel(majorName);
  return base ? `department-${base}` : "";
}

function countrySlugFromNationality(nationality) {
  const key = String(nationality || "")
    .trim()
    .toLowerCase();
  if (key === "myanmar" || key === "burma") return "country-myanmar";
  if (key === "vietnam" || key === "vietnamese") return "country-vietnam";
  if (key === "china" || key === "chinese" || key === "prc") return "country-china";
  if (key === "mongolia" || key === "mongolian") return "country-mongolia";
  return null;
}

function extractHashtags(content) {
  const matches = String(content).match(/#[\w가-힣]+/g) || [];
  return [...new Set(matches)];
}

function pick(arr, index) {
  return arr[index % arr.length];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgoIso(days) {
  const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  date.setHours(randomInt(8, 22), randomInt(0, 59), randomInt(0, 59), 0);
  return date.toISOString();
}

const DEPARTMENT_TEMPLATES = [
  "Looking for a study partner for Data Structures midterm next week. We can meet at the central library 3F after 6pm. #studygroup #midterm",
  "Does anyone know if Prof. Kim allows late submission for Programming 1 lab reports with a medical note? #courses #help",
  "Sharing my notes from today's OS lecture — ping me if you missed the whiteboard on paging. #notes #campus",
  "Our major club is recruiting volunteers for the open lab tour. Great for freshmen who want lab access tips! #club #volunteer",
  "Anyone interested in forming a hackathon team for the PNU software contest? Need one designer and one backend dev. #hackathon #team",
  "The engineering building printers were down again today. I used the IT building 2F instead — much shorter queue. #campus #tips",
  "Is the discrete math tutoring session still running on Thursdays in Eng Bldg 202? #tutoring #math",
  "Selling a barely used calculus textbook (English edition). DM if interested — half price. #textbook #trade",
  "Lab safety briefing for new semester is mandatory before using the multimedia lab. Don't forget to sign up on the dept board. #lab #safety",
  "Who else is taking Algorithms this fall? The first assignment looks tough. #algorithms #semester",
  "Dept office hours moved to Wed 2–4pm this month. Useful for course substitution questions. #admin #courses",
  "Free pizza at the CSE welcome meeting Friday 5pm, student center room 302. Bring your student ID. #event #freefood",
  "Recommendation: start the term project early. Last semester our team pulled two all-nighters because we started late. #project #advice",
  "Does the department accept internship credit from startups outside Busan? OIA said ask the major advisor first. #internship #credit",
  "Mock interview practice group meeting Saturday 10am at library study room B. All levels welcome. #career #interview",
  "The Wi-Fi in Eng Bldg 3F drops around noon — use mobile hotspot as backup for online exams. #wifi #tip",
  "Looking for a roommate near Jangjeon station starting March. Quiet, non-smoker preferred. #housing #roommate",
  "Anyone have the syllabus for Computer Programming 2? Considering adding it to my electives. #courses #elective",
  "Great seminar today on ML applications — slides should be on the dept website by tomorrow. #seminar #ai",
  "Final exam schedule is out. Check the portal and conflict requests close next Friday. #exam #schedule",
];

const COUNTRY_TEMPLATES = [
  "Myanmar students — OIA is hosting an ARC renewal info session this Wednesday 3pm. Highly recommend! #arc #visa #oia",
  "Sharing a list of Myanmar grocery stores near Seomyeon. Useful for weekend cooking. #food #myanmar #busan",
  "Anyone going to Seoul during Chuseok? Looking for travel buddies to split KTX costs. #travel #chuseok",
  "Chinese students: WeChat group for textbook exchange is active again this semester. #textbook #china",
  "Vietnamese community picnic at Haeundae this Sunday 11am. Bring snacks to share! #vietnam #weekend #picnic",
  "Tip for new arrivals: open a KakaoBank account before visiting the immigration office — saves time. #bank #tip #newstudent",
  "Mongolian students meetup at Geumjeong Hall cafeteria Friday lunch. Practice Korean together. #mongolia #language",
  "Does anyone know a good SIM plan for short-term visitors? Comparing LG U+ vs KT for data. #sim #phone",
  "Country group study session for TOPIK prep every Tue/Thu 7pm, library 2F. #topik #korean #study",
  "Sharing photos from last weekend's international student festival — what a turnout! #festival #friends",
  "Looking for language exchange (English ↔ Korean). I can help with conversation practice after classes. #language #exchange",
  "Reminder: register your address change within 14 days if you moved dorms. Immigration checks sometimes. #housing #arc",
  "Best affordable lunch under 6,000 KRW near north campus? Drop your favorites below. #food #budget",
  "Anyone need a ride to Costco on Saturday morning? Car has two seats left. #costco #ride",
  "Embassy document notarization — here's the checklist that worked for me last month. #embassy #documents",
  "Winter jacket sale at Lotte Mall — good deals for students who just arrived. #shopping #winter",
  "Country meetup board: post your WhatsApp/LINE group links here for easier coordination. #community #chat",
];

const ALL_TEMPLATES = [
  "Welcome new international students! Feel free to ask anything about campus life — we've all been there. #welcome #pnu #intl",
  "Global buddy program sign-ups are open. Paired with a Korean student mentor — super helpful first month. #buddy #mentor",
  "OIA posted updated dorm application deadlines on the portal. Double-check if you're applying for spring. #dorm #housing",
  "Free Korean culture class every Monday 4pm at international lounge. No registration needed. #culture #korean",
  "Who's watching the PNU baseball game this weekend? Let's meet at the stadium gate at 1pm. #sports #weekend",
  "Tip: download the PNU mobile app for cafeteria menus and shuttle times. #app #campuslife",
  "International student association elections next month — nominations open now. #isa #leadership",
  "Library extended hours during finals week start next Monday. #library #finals #study",
  "Sharing my checklist for first-month admin tasks (ARC, bank, phone, dorm). Hope it helps newcomers! #checklist #newstudent",
  "Looking for people to explore Gamcheon Culture Village this Saturday. #busan #trip #friends",
  "Part-time job regulations for D-2 visa — OIA handout summary attached in comments mentally: max 20h/week during semester. #work #visa",
  "Cafeteria at Moonchang Hall has the best international buffet on Wednesdays imo. #food #cafeteria",
  "Anyone else struggling with the humid summer? Fan recommendations welcome. #life #summer",
  "Student health center flu shots available walk-in this week. #health #vaccine",
  "Great turnout at yesterday's career fair — thanks to everyone who shared employer contacts. #career #fair",
  "Reminder to back up your assignment files — campus network glitched during submission hour last term. #it #backup",
  "Forming a weekend hiking group for Geumjeongsan trails. Beginners welcome. #hiking #geumjeongsan",
  "Exchange students: course registration help desk is in HQ 2F all this week. #exchange #registration",
];

async function deletePreviousSeedPosts() {
  const { data, error } = await supabase
    .from("community_post")
    .select("post_id")
    .like("content", `%${SEED_TAG}%`);

  if (error) {
    console.warn("Could not query seed posts for cleanup:", error.message);
    return 0;
  }

  const ids = (data || []).map((row) => row.post_id);
  if (!ids.length) return 0;

  const { error: deleteError } = await supabase.from("community_post").delete().in("post_id", ids);
  if (deleteError) throw deleteError;
  return ids.length;
}

async function ensureDepartmentGroup(majorName) {
  const slug = departmentSlugFromMajor(majorName);
  if (!slug) return null;

  const payload = {
    slug,
    scope: "department",
    name: majorName,
    icon: "🎓",
    match_key: majorName,
    banner_title: majorName,
    banner_body: `Ask questions, find teammates, and share tips in ${majorName}.`,
    is_active: true,
  };

  const { data, error } = await supabase
    .from("community_group")
    .upsert(payload, { onConflict: "slug" })
    .select("group_id, slug, scope")
    .single();

  if (error) throw error;
  return data;
}

async function loadGroupsBySlug() {
  const { data, error } = await supabase
    .from("community_group")
    .select("group_id, slug, scope")
    .eq("is_active", true);

  if (error) throw error;
  return new Map((data || []).map((row) => [row.slug, row]));
}

async function main() {
  const removed = await deletePreviousSeedPosts();
  if (removed) console.log(`Removed ${removed} previous seed post(s).`);

  const { data: students, error: studentError } = await supabase
    .from("student")
    .select("student_id, nationality, major:major_id(major_name)");

  if (studentError) throw studentError;
  if (!students?.length) {
    console.error("No students found — add rows to student table first.");
    process.exit(1);
  }

  const majors = [
    ...new Set(
      students.map((s) => s.major?.major_name).filter(Boolean),
    ),
  ];

  for (const majorName of majors) {
    await ensureDepartmentGroup(majorName);
  }

  let groupsBySlug = await loadGroupsBySlug();
  const allGroup = groupsBySlug.get("all-intl");
  if (!allGroup) {
    console.error("Missing all-intl community group — run community.sql first.");
    process.exit(1);
  }

  const posts = [];
  for (let i = 0; i < TARGET_POST_COUNT; i += 1) {
    const student = students[i % students.length];
    const majorName = student.major?.major_name || "";
    const scopeCycle = i % 5;
    let scope = "all";
    let group = allGroup;

    if (scopeCycle <= 2 && majorName) {
      scope = "department";
      const deptSlug = departmentSlugFromMajor(majorName);
      group = groupsBySlug.get(deptSlug) || null;
      if (!group) {
        const created = await ensureDepartmentGroup(majorName);
        if (created) {
          groupsBySlug.set(created.slug, created);
          group = created;
        }
      }
    } else if (scopeCycle === 3) {
      scope = "country";
      const countrySlug = countrySlugFromNationality(student.nationality);
      group = countrySlug ? groupsBySlug.get(countrySlug) || null : null;
      if (!group) {
        scope = "all";
        group = allGroup;
      }
    }

    if (!group) continue;

    const templates =
      scope === "department"
        ? DEPARTMENT_TEMPLATES
        : scope === "country"
          ? COUNTRY_TEMPLATES
          : ALL_TEMPLATES;

    const body = `${pick(templates, i)} ${SEED_TAG}`;
    const hashtags = extractHashtags(body);

    posts.push({
      group_id: group.group_id,
      scope,
      student_id: student.student_id,
      content: body,
      hashtags,
      likes_count: randomInt(0, 48),
      comments_count: randomInt(0, 14),
      reported: false,
      created_at: daysAgoIso(randomInt(0, 75)),
    });
  }

  let inserted = 0;
  for (let i = 0; i < posts.length; i += BATCH_SIZE) {
    const batch = posts.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("community_post").insert(batch);
    if (error) throw error;
    inserted += batch.length;
  }

  const byScope = posts.reduce(
    (acc, row) => {
      acc[row.scope] = (acc[row.scope] || 0) + 1;
      return acc;
    },
    {},
  );

  console.log(`Inserted ${inserted} community posts.`);
  console.log("By scope:", byScope);
  console.log(`Students used: ${students.length}, majors: ${majors.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
