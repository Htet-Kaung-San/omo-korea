/**
 * Seed all 124 PNU undergraduate majors into the Supabase `major` table.
 * Sourced from: PNU_Undergraduate_Programs.pdf
 * 
 * Schema: major(major_id SERIAL PK, major_name VARCHAR, department VARCHAR)
 * Note: "department" column stores the College name (e.g. "College of Engineering")
 * 
 * Usage: node scratch/seed_majors.js
 */
const supabase = require('../supabaseClient');

const PNU_MAJORS = [
  // College of Humanities
  { major_name: "Korean Language and Literature", department: "College of Humanities" },
  { major_name: "Japanese Language", department: "College of Humanities" },
  { major_name: "Japanese Literature", department: "College of Humanities" },
  { major_name: "French Language and Literature", department: "College of Humanities" },
  { major_name: "Russian Language and Literature", department: "College of Humanities" },
  { major_name: "Korean Literature in Classical Chinese", department: "College of Humanities" },
  { major_name: "Chinese Language and Literature", department: "College of Humanities" },
  { major_name: "English Language and Literature", department: "College of Humanities" },
  { major_name: "German Language and Literature", department: "College of Humanities" },
  { major_name: "History", department: "College of Humanities" },
  { major_name: "Philosophy", department: "College of Humanities" },
  { major_name: "Archaeology", department: "College of Humanities" },
  { major_name: "Language and Information", department: "College of Humanities" },

  // College of Social Sciences
  { major_name: "Public Administration", department: "College of Social Sciences" },
  { major_name: "Social Welfare Policy", department: "College of Social Sciences" },
  { major_name: "Social Welfare Practice", department: "College of Social Sciences" },
  { major_name: "Political Science and Diplomacy", department: "College of Social Sciences" },
  { major_name: "Sociology", department: "College of Social Sciences" },
  { major_name: "Psychology", department: "College of Social Sciences" },
  { major_name: "Library, Archive and Information Studies", department: "College of Social Sciences" },
  { major_name: "Media and Communication", department: "College of Social Sciences" },

  // College of Natural Sciences
  { major_name: "Mathematics", department: "College of Natural Sciences" },
  { major_name: "Statistics", department: "College of Natural Sciences" },
  { major_name: "Microbiology", department: "College of Natural Sciences" },
  { major_name: "Biological Sciences", department: "College of Natural Sciences" },
  { major_name: "Atmospheric Sciences", department: "College of Natural Sciences" },
  { major_name: "Physics", department: "College of Natural Sciences" },
  { major_name: "Chemistry", department: "College of Natural Sciences" },
  { major_name: "Molecular Biology", department: "College of Natural Sciences" },
  { major_name: "Geological Sciences", department: "College of Natural Sciences" },
  { major_name: "Oceanography", department: "College of Natural Sciences" },

  // College of Engineering
  { major_name: "Energy Systems Major", department: "College of Engineering" },
  { major_name: "Mechanical Systems Design Major", department: "College of Engineering" },
  { major_name: "Precision Manufacturing Systems Major", department: "College of Engineering" },
  { major_name: "Control, Automation and Systems Major", department: "College of Engineering" },
  { major_name: "Nuclear Systems Major", department: "College of Engineering" },
  { major_name: "Intelligent Manufacturing Systems Major", department: "College of Engineering" },
  { major_name: "Aerospace Engineering", department: "College of Engineering" },
  { major_name: "Polymer Science and Engineering", department: "College of Engineering" },
  { major_name: "Chemical and Biomolecular Engineering", department: "College of Engineering" },
  { major_name: "Environmental Engineering", department: "College of Engineering" },
  { major_name: "Naval Architecture and Ocean Engineering", department: "College of Engineering" },
  { major_name: "Materials Science and Engineering", department: "College of Engineering" },
  { major_name: "Industrial Engineering", department: "College of Engineering" },
  { major_name: "Industrial AI Convergence", department: "College of Engineering" },
  { major_name: "Organic Material Science and Engineering", department: "College of Engineering" },

  // College of Education
  { major_name: "German Language Education", department: "College of Education" },
  { major_name: "Korean Language Education", department: "College of Education" },
  { major_name: "English Language Education", department: "College of Education" },
  { major_name: "French Language Education", department: "College of Education" },
  { major_name: "Early Childhood Education", department: "College of Education" },
  { major_name: "Social Studies Education", department: "College of Education" },
  { major_name: "Education", department: "College of Education" },
  { major_name: "Special Education", department: "College of Education" },
  { major_name: "History Education", department: "College of Education" },
  { major_name: "Geography Education", department: "College of Education" },
  { major_name: "Ethics Education", department: "College of Education" },
  { major_name: "Physics Education", department: "College of Education" },
  { major_name: "Biology Education", department: "College of Education" },
  { major_name: "Physical Education", department: "College of Education" },
  { major_name: "Mathematics Education", department: "College of Education" },
  { major_name: "Chemistry Education", department: "College of Education" },
  { major_name: "Earth Science Education", department: "College of Education" },

  // College of Pharmacy
  { major_name: "Pharmacy", department: "College of Pharmacy" },

  // School of Medicine
  { major_name: "Medicine", department: "School of Medicine" },
  { major_name: "Preliminary Medicine", department: "School of Medicine" },

  // College of Arts
  { major_name: "Vocal Music", department: "College of Arts" },
  { major_name: "Piano", department: "College of Arts" },
  { major_name: "Composition", department: "College of Arts" },
  { major_name: "Orchestra Music and Percussion", department: "College of Arts" },
  { major_name: "Wooden Furniture Painting", department: "College of Arts" },
  { major_name: "Ceramics", department: "College of Arts" },
  { major_name: "Textiles and Metal", department: "College of Arts" },
  { major_name: "Korean Dance", department: "College of Arts" },
  { major_name: "Ballet", department: "College of Arts" },
  { major_name: "Modern Dance", department: "College of Arts" },
  { major_name: "Art, Culture and Image", department: "College of Arts" },
  { major_name: "Carving and Modeling", department: "College of Arts" },
  { major_name: "Korean Painting", department: "College of Arts" },
  { major_name: "Western Painting", department: "College of Arts" },
  { major_name: "String and Vocal", department: "College of Arts" },
  { major_name: "Wind and Percussion", department: "College of Arts" },
  { major_name: "Theory and Composition", department: "College of Arts" },
  { major_name: "Visual Design", department: "College of Arts" },
  { major_name: "Animation", department: "College of Arts" },
  { major_name: "Image Information", department: "College of Arts" },

  // College of Nanoscience and Nanotechnology
  { major_name: "Nanomechatronics Engineering", department: "College of Nanoscience and Nanotechnology" },
  { major_name: "Nanoenergy Engineering", department: "College of Nanoscience and Nanotechnology" },
  { major_name: "Optics and Mechatronics Engineering", department: "College of Nanoscience and Nanotechnology" },

  // College of Natural Resource and Life Sciences
  { major_name: "Plant Bioscience", department: "College of Natural Resource and Life Sciences" },
  { major_name: "Animal Science", department: "College of Natural Resource and Life Sciences" },
  { major_name: "Life Science and Environmental Biochemistry", department: "College of Natural Resource and Life Sciences" },
  { major_name: "Bioenvironmental Energy", department: "College of Natural Resource and Life Sciences" },
  { major_name: "Landscape Architecture", department: "College of Natural Resource and Life Sciences" },
  { major_name: "Horticultural Bioscience", department: "College of Natural Resource and Life Sciences" },
  { major_name: "Food Science and Technology", department: "College of Natural Resource and Life Sciences" },
  { major_name: "Biomaterials Science", department: "College of Natural Resource and Life Sciences" },
  { major_name: "Bio-Industrial Machinery Engineering", department: "College of Natural Resource and Life Sciences" },
  { major_name: "Applied IT Engineering", department: "College of Natural Resource and Life Sciences" },

  // College of Nursing
  { major_name: "Nursing", department: "College of Nursing" },

  // College of Business
  { major_name: "Business Administration", department: "College of Business" },

  // College of Economics and International Trade
  { major_name: "International Trade", department: "College of Economics and International Trade" },
  { major_name: "Tourism and Convention", department: "College of Economics and International Trade" },
  { major_name: "Public Policy and Management", department: "College of Economics and International Trade" },
  { major_name: "Economics", department: "College of Economics and International Trade" },
  { major_name: "Global Studies", department: "College of Economics and International Trade" },

  // College of Human Ecology
  { major_name: "Child Development and Family Studies", department: "College of Human Ecology" },
  { major_name: "Food Science and Nutrition", department: "College of Human Ecology" },
  { major_name: "Sport Science", department: "College of Human Ecology" },
  { major_name: "Clothing and Textiles", department: "College of Human Ecology" },
  { major_name: "Interior and Environmental Design", department: "College of Human Ecology" },

  // College of Information and BioMedical Engineering
  { major_name: "Computer Engineering", department: "College of Information and BioMedical Engineering" },
  { major_name: "Artificial Intelligence", department: "College of Information and BioMedical Engineering" },
  { major_name: "Design Technology", department: "College of Information and BioMedical Engineering" },
  { major_name: "BioMedical Engineering", department: "College of Information and BioMedical Engineering" },
  { major_name: "SW Convergence", department: "College of Information and BioMedical Engineering" },
  { major_name: "Data Science", department: "College of Information and BioMedical Engineering" },
  { major_name: "Advanced Bioengineering", department: "College of Information and BioMedical Engineering" },
  { major_name: "Convergence Major of Medical Artificial Intelligence", department: "College of Information and BioMedical Engineering" },

  // University College
  { major_name: "Advanced Energy Major", department: "University College" },
  { major_name: "Advanced Nano-device Manufacturing Major", department: "University College" },
  { major_name: "Optics and Mechatronics Engineering Major", department: "University College" },
  { major_name: "Applied Life and Convergence Science", department: "University College" },
  { major_name: "Liberal Studies", department: "University College" },
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
