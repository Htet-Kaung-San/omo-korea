/** Static UI options — backend may replace with API-driven lists later */

export interface DepartmentItem {
  name: string;
  majors: string[];
}

export interface CollegeItem {
  name: string;
  departments: DepartmentItem[];
}

export const ACADEMIC_HIERARCHY: CollegeItem[] = [
  {
    name: "College of Humanities",
    departments: [
      { name: "Department of Korean Language and Literature", majors: ["Korean Language and Literature"] },
      { name: "Department of Japanese Language and Literature", majors: ["Japanese Language and Literature"] },
      { name: "Department of French Language and Literature", majors: ["French Language and Literature"] },
      { name: "Department of Russian Language and Literature", majors: ["Russian Language and Literature"] },
      { name: "Department of Chinese Language and Literature", majors: ["Chinese Language and Literature"] },
      { name: "Department of English Language and Literature", majors: ["English Language and Literature"] },
      { name: "Department of German Language and Literature", majors: ["German Language and Literature"] },
      { name: "Department of Korean Literature in Classical Chinese", majors: ["Korean Literature in Classical Chinese"] },
      { name: "Department of Language and Information", majors: ["Language and Information"] },
      { name: "Department of History", majors: ["History"] },
      { name: "Department of Philosophy", majors: ["Philosophy"] },
      { name: "Department of Archaeology", majors: ["Archaeology"] },
    ],
  },
  {
    name: "College of Social Sciences",
    departments: [
      { name: "Department of Public Administration", majors: ["Public Administration"] },
      { name: "Department of Political Science and Diplomacy", majors: ["Political Science and Diplomacy"] },
      { name: "Department of Social Welfare", majors: ["Social Welfare"] },
      { name: "Department of Sociology", majors: ["Sociology"] },
      { name: "Department of Psychology", majors: ["Psychology"] },
      { name: "Department of Library and Information Science", majors: ["Library and Information Science"] },
      { name: "Department of Media and Communication", majors: ["Media and Communication"] },
    ],
  },
  {
    name: "College of Natural Sciences",
    departments: [
      { name: "Department of Mathematics", majors: ["Mathematics"] },
      { name: "Department of Statistics", majors: ["Statistics"] },
      { name: "Department of Physics", majors: ["Physics"] },
      { name: "Department of Chemistry", majors: ["Chemistry"] },
      { name: "Department of Biological Sciences", majors: ["Biological Sciences"] },
      { name: "Department of Microbiology", majors: ["Microbiology"] },
      { name: "Department of Molecular Biology", majors: ["Molecular Biology"] },
      { name: "Department of Geological and Environmental Sciences", majors: ["Geological and Environmental Sciences"] },
      { name: "Department of Atmospheric and Environmental Sciences", majors: ["Atmospheric and Environmental Sciences"] },
      { name: "Department of Oceanography", majors: ["Oceanography"] },
    ],
  },
  {
    name: "College of Engineering",
    departments: [
      { name: "Department of Mechanical Engineering", majors: ["Mechanical Engineering"] },
      { name: "Department of Polymer Engineering", majors: ["Polymer Engineering"] },
      { name: "Department of Organic Materials Systems Engineering", majors: ["Organic Materials Systems Engineering"] },
      { name: "Department of Chemical and Biomolecular Engineering", majors: ["Chemical and Biomolecular Engineering"] },
      { name: "Department of Environmental Engineering", majors: ["Environmental Engineering"] },
      {
        name: "Department of Electrical and Electronic Engineering",
        majors: [
          "Electrical and Electronic Engineering - Electronics Engineering major",
          "Electrical and Electronic Engineering - Electrical Engineering major",
          "Electrical and Electronic Engineering - Semiconductor Engineering major",
        ],
      },
      { name: "Department of Naval Architecture and Ocean Engineering", majors: ["Naval Architecture and Ocean Engineering"] },
      { name: "Department of Materials Engineering", majors: ["Materials Engineering"] },
      { name: "Department of Industrial Engineering", majors: ["Industrial Engineering"] },
      { name: "Department of Aerospace Engineering", majors: ["Aerospace Engineering"] },
      { name: "Department of Architectural Engineering", majors: ["Architectural Engineering"] },
      { name: "Department of Architecture", majors: ["Architecture"] },
      { name: "Department of Urban Engineering", majors: ["Urban Engineering"] },
      { name: "Department of Civil and Environmental Engineering", majors: ["Civil and Environmental Engineering"] },
      { name: "Future Urban Architecture and Environmental Convergence major", majors: ["Future Urban Architecture and Environmental Convergence major"] },
      { name: "Advanced IT Autonomous major", majors: ["Advanced IT Autonomous major"] },
      { name: "Advanced Mobility Autonomous major", majors: ["Advanced Mobility Autonomous major"] },
      { name: "Advanced Materials Autonomous major", majors: ["Advanced Materials Autonomous major"] },
      { name: "Smart City major", majors: ["Smart City major"] },
    ],
  },
  {
    name: "College of Education",
    departments: [
      { name: "Department of Korean Language Education", majors: ["Korean Language Education"] },
      { name: "Department of English Language Education", majors: ["English Language Education"] },
      { name: "Department of German Language Education", majors: ["German Language Education"] },
      { name: "Department of French Language Education", majors: ["French Language Education"] },
      { name: "Department of Education", majors: ["Education"] },
      { name: "Department of Early Childhood Education", majors: ["Early Childhood Education"] },
      { name: "Department of Special Education", majors: ["Special Education"] },
      { name: "Department of General Social Studies Education", majors: ["General Social Studies Education"] },
      { name: "Department of History Education", majors: ["History Education"] },
      { name: "Department of Geography Education", majors: ["Geography Education"] },
      { name: "Department of Ethics Education", majors: ["Ethics Education"] },
      { name: "Department of Mathematics Education", majors: ["Mathematics Education"] },
      { name: "Department of Physics Education", majors: ["Physics Education"] },
      { name: "Department of Chemistry Education", majors: ["Chemistry Education"] },
      { name: "Department of Biology Education", majors: ["Biology Education"] },
      { name: "Department of Earth Science Education", majors: ["Earth Science Education"] },
      { name: "Department of Physical Education", majors: ["Physical Education"] },
    ],
  },
  {
    name: "College of Economics and International Trade",
    departments: [
      { name: "Department of International Trade", majors: ["International Trade"] },
      { name: "Department of Economics", majors: ["Economics"] },
      { name: "Department of Tourism and Convention", majors: ["Tourism and Convention"] },
      { name: "Department of International Studies", majors: ["International Studies"] },
      { name: "Department of Public Policy", majors: ["Public Policy"] },
    ],
  },
  {
    name: "College of Business",
    departments: [
      { name: "Department of Business Administration", majors: ["Business Administration"] },
    ],
  },
  {
    name: "College of Pharmacy",
    departments: [
      {
        name: "Department of Pharmacy",
        majors: [
          "Pharmacy - Pharmacy major",
          "Pharmacy - Pharmaceutical Sciences major",
        ],
      },
    ],
  },
  {
    name: "College of Human Ecology",
    departments: [
      { name: "Department of Child Development and Family Studies", majors: ["Child Development and Family Studies"] },
      { name: "Department of Clothing and Textiles", majors: ["Clothing and Textiles"] },
      { name: "Department of Food and Nutrition", majors: ["Food and Nutrition"] },
      { name: "Department of Interior and Environmental Design", majors: ["Interior and Environmental Design"] },
      { name: "Department of Sports Science", majors: ["Sports Science"] },
    ],
  },
  {
    name: "College of Arts",
    departments: [
      { name: "Department of Music", majors: ["Music"] },
      { name: "Department of Korean Traditional Music", majors: ["Korean Traditional Music"] },
      { name: "Department of Fine Arts", majors: ["Fine Arts"] },
      { name: "Department of Formative Arts", majors: ["Formative Arts"] },
      { name: "Department of Design", majors: ["Design"] },
      { name: "Department of Dance", majors: ["Dance"] },
      { name: "Department of Arts, Culture and Image", majors: ["Arts, Culture and Image"] },
    ],
  },
  {
    name: "College of Nanoscience and Nanotechnology",
    departments: [
      { name: "Department of Nanomechatronics Engineering", majors: ["Nanomechatronics Engineering"] },
      { name: "Department of Nanoenergy Engineering", majors: ["Nanoenergy Engineering"] },
      { name: "Department of Optics and Mechatronics Engineering", majors: ["Optics and Mechatronics Engineering"] },
    ],
  },
  {
    name: "College of Natural Resource and Life Sciences",
    departments: [
      { name: "Department of Plant Bioscience", majors: ["Plant Bioscience"] },
      { name: "Department of Horticultural Bioscience", majors: ["Horticultural Bioscience"] },
      { name: "Department of Animal Science and Life Resources", majors: ["Animal Science and Life Resources"] },
      { name: "Department of Food Science and Technology", majors: ["Food Science and Technology"] },
      { name: "Department of Life and Environmental Chemistry", majors: ["Life and Environmental Chemistry"] },
      { name: "Department of Biomaterials Science", majors: ["Biomaterials Science"] },
      { name: "Department of Bio-Industrial Machinery Engineering", majors: ["Bio-Industrial Machinery Engineering"] },
      { name: "Department of Landscape Architecture", majors: ["Landscape Architecture"] },
      { name: "Department of Food and Resource Economics", majors: ["Food and Resource Economics"] },
      { name: "Department of Applied IT Engineering", majors: ["Applied IT Engineering"] },
      { name: "Department of Bioenvironmental Energy", majors: ["Bioenvironmental Energy"] },
    ],
  },
  {
    name: "College of Nursing",
    departments: [
      { name: "Department of Nursing", majors: ["Nursing"] },
    ],
  },
  {
    name: "School of Medicine",
    departments: [
      { name: "Department of Preliminary Medicine", majors: ["Preliminary Medicine"] },
      { name: "Department of Medicine", majors: ["Medicine"] },
    ],
  },
  {
    name: "College of Information and BioMedical Engineering",
    departments: [
      {
        name: "Department of Information and Computer Engineering",
        majors: [
          "Information and Computer Engineering - Computer Engineering major",
          "Information and Computer Engineering - Artificial Intelligence major",
          "Information and Computer Engineering - Design Technology major",
        ],
      },
      { name: "Department of BioMedical Convergence Engineering", majors: ["BioMedical Convergence Engineering"] },
    ],
  },
  {
    name: "University College",
    departments: [
      { name: "Department of Liberal Studies", majors: ["Liberal Studies"] },
      {
        name: "Advanced Convergence",
        majors: [
          "Advanced Convergence - Future Energy major",
          "Advanced Convergence - Advanced Nano-device Manufacturing major",
          "Advanced Convergence - Optics and Mechatronics Engineering major",
          "Advanced Convergence - AI Convergence Computational Science major",
        ],
      },
      {
        name: "Applied Life and Convergence Science",
        majors: [
          "Applied Life and Convergence Science - Green Bio Science major",
          "Applied Life and Convergence Science - Life Resource Systems Engineering major",
        ],
      },
      { name: "Department of Global Liberal Studies", majors: ["Global Liberal Studies"] },
    ],
  },
];

export const MAJOR_OPTIONS = ACADEMIC_HIERARCHY.reduce<string[]>((acc, college) => {
  college.departments.forEach(dept => {
    acc.push(...dept.majors);
  });
  return acc;
}, []);

// Flat, de-duplicated, alphabetically sorted list of every major. Backs the
// single Department/Major picker on the profile — the College → Department →
// Major cascade was removed because the three levels were confusing.
export const DEPARTMENT_MAJOR_OPTIONS = Array.from(new Set(MAJOR_OPTIONS)).sort(
  (a, b) => a.localeCompare(b),
);

/** Short major list shown after OTP login before entering the app. */
export const LOGIN_MAJOR_OPTIONS = [
  'Information and Computer Engineering - Computer Engineering major',
  'Information and Computer Engineering - Artificial Intelligence major',
  'Architecture',
  'Aerospace Engineering',
  'Chemical and Biomolecular Engineering',
  'Environmental Engineering',
  'Electrical and Electronic Engineering - Electronics Engineering major',
  'Electrical and Electronic Engineering - Electrical Engineering major',
  'Industrial Engineering',
  'Materials Engineering',
  'Polymer Engineering',
  'Naval Architecture and Ocean Engineering',
  'Urban Engineering',
] as const;

export const NATIONALITY_OPTIONS = [
  "Vietnam",
  "China",
  "Japan",
  "Uzbekistan",
  "Mongolia",
  "Kazakhstan",
  "Russia",
  "Indonesia",
  "United States",
  "Canada",
  "France",
  "Germany",
  "Taiwan",
  "Myanmar",
  "Thailand",
  "Philippines",
  "Malaysia",
  "Nepal",
  "Bangladesh",
  "India",
  "Pakistan",
  "Brazil",
  "Mexico",
  "United Kingdom",
];

export const INTEREST_OPTIONS = [
  "AI",
  "Design",
  "Korean Language",
  "Business",
  "Data Science",
  "Robotics",
  "Sustainability",
];
