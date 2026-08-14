/**
 * Seed all PNU undergraduate majors into the Supabase `major` table.
 * Updated to match the College -> Department -> Major hierarchy
 * from Database_modification.md.
 *
 * Schema: major(major_id PK, major_name VARCHAR, department VARCHAR, college_id INTEGER)
 * Note: "department" column stores the College name (e.g. "College of Engineering")
 *       for backward compatibility with Supabase join queries.
 *
 * Usage: node scratch/seed_majors.js
 */
const supabase = require('../supabaseClient');

const PNU_MAJORS = [
  // College of Humanities (college_id = 10)
  { major_name: "Korean Language and Literature", department: "College of Humanities" },
  { major_name: "Japanese Language and Literature", department: "College of Humanities" },
  { major_name: "French Language and Literature", department: "College of Humanities" },
  { major_name: "Russian Language and Literature", department: "College of Humanities" },
  { major_name: "Chinese Language and Literature", department: "College of Humanities" },
  { major_name: "English Language and Literature", department: "College of Humanities" },
  { major_name: "German Language and Literature", department: "College of Humanities" },
  { major_name: "Korean Literature in Classical Chinese", department: "College of Humanities" },
  { major_name: "Language and Information", department: "College of Humanities" },
  { major_name: "History", department: "College of Humanities" },
  { major_name: "Philosophy", department: "College of Humanities" },
  { major_name: "Archaeology", department: "College of Humanities" },

  // College of Social Sciences (college_id = 5)
  { major_name: "Public Administration", department: "College of Social Sciences" },
  { major_name: "Political Science and Diplomacy", department: "College of Social Sciences" },
  { major_name: "Social Welfare", department: "College of Social Sciences" },
  { major_name: "Sociology", department: "College of Social Sciences" },
  { major_name: "Psychology", department: "College of Social Sciences" },
  { major_name: "Library and Information Science", department: "College of Social Sciences" },
  { major_name: "Media and Communication", department: "College of Social Sciences" },

  // College of Natural Sciences (college_id = 9)
  { major_name: "Mathematics", department: "College of Natural Sciences" },
  { major_name: "Statistics", department: "College of Natural Sciences" },
  { major_name: "Physics", department: "College of Natural Sciences" },
  { major_name: "Chemistry", department: "College of Natural Sciences" },
  { major_name: "Biological Sciences", department: "College of Natural Sciences" },
  { major_name: "Microbiology", department: "College of Natural Sciences" },
  { major_name: "Molecular Biology", department: "College of Natural Sciences" },
  { major_name: "Geological and Environmental Sciences", department: "College of Natural Sciences" },
  { major_name: "Atmospheric and Environmental Sciences", department: "College of Natural Sciences" },
  { major_name: "Oceanography", department: "College of Natural Sciences" },

  // College of Engineering (college_id = 2)
  { major_name: "Mechanical Engineering", department: "College of Engineering" },
  { major_name: "Polymer Engineering", department: "College of Engineering" },
  { major_name: "Organic Materials Systems Engineering", department: "College of Engineering" },
  { major_name: "Chemical and Biomolecular Engineering", department: "College of Engineering" },
  { major_name: "Environmental Engineering", department: "College of Engineering" },
  // Electrical and Electronic Engineering (multi-major)
  { major_name: "Electrical and Electronic Engineering - Electronics Engineering major", department: "College of Engineering" },
  { major_name: "Electrical and Electronic Engineering - Electrical Engineering major", department: "College of Engineering" },
  { major_name: "Electrical and Electronic Engineering - Semiconductor Engineering major", department: "College of Engineering" },
  { major_name: "Naval Architecture and Ocean Engineering", department: "College of Engineering" },
  { major_name: "Materials Engineering", department: "College of Engineering" },
  { major_name: "Industrial Engineering", department: "College of Engineering" },
  { major_name: "Aerospace Engineering", department: "College of Engineering" },
  { major_name: "Architectural Engineering", department: "College of Engineering" },
  { major_name: "Architecture", department: "College of Engineering" },
  { major_name: "Urban Engineering", department: "College of Engineering" },
  { major_name: "Civil and Environmental Engineering", department: "College of Engineering" },
  { major_name: "Future Urban Architecture and Environmental Convergence major", department: "College of Engineering" },
  { major_name: "Advanced IT Autonomous major", department: "College of Engineering" },
  { major_name: "Advanced Mobility Autonomous major", department: "College of Engineering" },
  { major_name: "Advanced Materials Autonomous major", department: "College of Engineering" },
  { major_name: "Smart City major", department: "College of Engineering" },

  // College of Education (college_id = 7)
  { major_name: "Korean Language Education", department: "College of Education" },
  { major_name: "English Language Education", department: "College of Education" },
  { major_name: "German Language Education", department: "College of Education" },
  { major_name: "French Language Education", department: "College of Education" },
  { major_name: "Education", department: "College of Education" },
  { major_name: "Early Childhood Education", department: "College of Education" },
  { major_name: "Special Education", department: "College of Education" },
  { major_name: "General Social Studies Education", department: "College of Education" },
  { major_name: "History Education", department: "College of Education" },
  { major_name: "Geography Education", department: "College of Education" },
  { major_name: "Ethics Education", department: "College of Education" },
  { major_name: "Mathematics Education", department: "College of Education" },
  { major_name: "Physics Education", department: "College of Education" },
  { major_name: "Chemistry Education", department: "College of Education" },
  { major_name: "Biology Education", department: "College of Education" },
  { major_name: "Earth Science Education", department: "College of Education" },
  { major_name: "Physical Education", department: "College of Education" },

  // College of Economics and International Trade (college_id = 12)
  { major_name: "International Trade", department: "College of Economics and International Trade" },
  { major_name: "Economics", department: "College of Economics and International Trade" },
  { major_name: "Tourism and Convention", department: "College of Economics and International Trade" },
  { major_name: "International Studies", department: "College of Economics and International Trade" },
  { major_name: "Public Policy", department: "College of Economics and International Trade" },

  // College of Business (college_id = 4)
  { major_name: "Business Administration", department: "College of Business" },

  // College of Pharmacy (college_id = 14) — multi-major
  { major_name: "Pharmacy - Pharmacy major", department: "College of Pharmacy" },
  { major_name: "Pharmacy - Pharmaceutical Sciences major", department: "College of Pharmacy" },

  // College of Human Ecology (college_id = 11)
  { major_name: "Child Development and Family Studies", department: "College of Human Ecology" },
  { major_name: "Clothing and Textiles", department: "College of Human Ecology" },
  { major_name: "Food and Nutrition", department: "College of Human Ecology" },
  { major_name: "Interior and Environmental Design", department: "College of Human Ecology" },
  { major_name: "Sports Science", department: "College of Human Ecology" },

  // College of Arts (college_id = 8)
  { major_name: "Music", department: "College of Arts" },
  { major_name: "Korean Traditional Music", department: "College of Arts" },
  { major_name: "Fine Arts", department: "College of Arts" },
  { major_name: "Formative Arts", department: "College of Arts" },
  { major_name: "Design", department: "College of Arts" },
  { major_name: "Dance", department: "College of Arts" },
  { major_name: "Arts, Culture and Image", department: "College of Arts" },

  // College of Nanoscience and Nanotechnology (college_id = 6)
  { major_name: "Nanomechatronics Engineering", department: "College of Nanoscience and Nanotechnology" },
  { major_name: "Nanoenergy Engineering", department: "College of Nanoscience and Nanotechnology" },
  { major_name: "Optics and Mechatronics Engineering", department: "College of Nanoscience and Nanotechnology" },

  // College of Natural Resource and Life Sciences (college_id = 15)
  { major_name: "Plant Bioscience", department: "College of Natural Resource and Life Sciences" },
  { major_name: "Horticultural Bioscience", department: "College of Natural Resource and Life Sciences" },
  { major_name: "Animal Science and Life Resources", department: "College of Natural Resource and Life Sciences" },
  { major_name: "Food Science and Technology", department: "College of Natural Resource and Life Sciences" },
  { major_name: "Life and Environmental Chemistry", department: "College of Natural Resource and Life Sciences" },
  { major_name: "Biomaterials Science", department: "College of Natural Resource and Life Sciences" },
  { major_name: "Bio-Industrial Machinery Engineering", department: "College of Natural Resource and Life Sciences" },
  { major_name: "Landscape Architecture", department: "College of Natural Resource and Life Sciences" },
  { major_name: "Food and Resource Economics", department: "College of Natural Resource and Life Sciences" },
  { major_name: "Applied IT Engineering", department: "College of Natural Resource and Life Sciences" },
  { major_name: "Bioenvironmental Energy", department: "College of Natural Resource and Life Sciences" },

  // College of Nursing (college_id = 1)
  { major_name: "Nursing", department: "College of Nursing" },

  // School of Medicine (college_id = 13)
  { major_name: "Preliminary Medicine", department: "School of Medicine" },
  { major_name: "Medicine", department: "School of Medicine" },

  // College of Information and BioMedical Engineering (college_id = 3) — multi-major
  { major_name: "Information and Computer Engineering - Computer Engineering major", department: "College of Information and BioMedical Engineering" },
  { major_name: "Information and Computer Engineering - Artificial Intelligence major", department: "College of Information and BioMedical Engineering" },
  { major_name: "Information and Computer Engineering - Design Technology major", department: "College of Information and BioMedical Engineering" },
  { major_name: "BioMedical Convergence Engineering", department: "College of Information and BioMedical Engineering" },

  // University College (college_id = 17)
  { major_name: "Liberal Studies", department: "University College" },
  { major_name: "Advanced Convergence - Future Energy major", department: "University College" },
  { major_name: "Advanced Convergence - Advanced Nano-device Manufacturing major", department: "University College" },
  { major_name: "Advanced Convergence - Optics and Mechatronics Engineering major", department: "University College" },
  { major_name: "Advanced Convergence - AI Convergence Computational Science major", department: "University College" },
  { major_name: "Applied Life and Convergence Science - Green Bio Science major", department: "University College" },
  { major_name: "Applied Life and Convergence Science - Life Resource Systems Engineering major", department: "University College" },
  { major_name: "Global Liberal Studies", department: "University College" },
];

async function seedMajors() {
  console.log(`Seeding ${PNU_MAJORS.length} PNU majors...`);

  // First, check what already exists
  const { data: existing, error: fetchError } = await supabase
    .from('major')
    .select('major_name');

  if (fetchError) {
    console.error('Failed to fetch existing majors:', fetchError.message);
    process.exit(1);
  }

  const existingNames = new Set(existing.map(m => m.major_name));
  console.log(`Existing majors in DB: ${existing.length}`);

  // Filter out already existing ones
  const toInsert = PNU_MAJORS.filter(m => !existingNames.has(m.major_name));
  console.log(`New majors to insert: ${toInsert.length}`);

  if (toInsert.length === 0) {
    console.log('All majors already seeded!');
    return;
  }

  // Insert in batches of 20
  const BATCH_SIZE = 20;
  let inserted = 0;

  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from('major')
      .insert(batch)
      .select();

    if (error) {
      console.error(`Error on batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
    } else {
      inserted += data.length;
      console.log(`  + Batch ${Math.floor(i / BATCH_SIZE) + 1}: inserted ${data.length} records`);
    }
  }

  console.log(`\nDone! Inserted ${inserted} new majors.`);

  // Final count
  const { data: final } = await supabase.from('major').select('major_id');
  console.log(`Total majors in database now: ${final.length}`);
}

seedMajors();
