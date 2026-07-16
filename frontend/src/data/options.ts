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
      { name: "Department of Japanese Language and Literature", majors: ["Japanese Language", "Japanese Literature"] },
      { name: "Department of French Language and Literature", majors: ["French Language and Literature"] },
      { name: "Department of Russian Language and Literature", majors: ["Russian Language and Literature"] },
      { name: "Department of Korean Literature in Classical Chinese", majors: ["Korean Literature in Classical Chinese"] },
      { name: "Department of Chinese Language and Literature", majors: ["Chinese Language and Literature"] },
      { name: "Department of English Language and Literature", majors: ["English Language and Literature"] },
      { name: "Department of German Language and Literature", majors: ["German Language and Literature"] },
      { name: "Department of History", majors: ["History"] },
      { name: "Department of Philosophy", majors: ["Philosophy"] },
      { name: "Department of Archaeology", majors: ["Archaeology"] },
      { name: "Department of Language and Information", majors: ["Language and Information"] }
    ]
  },
  {
    name: "College of Social Sciences",
    departments: [
      { name: "Department of Public Administration", majors: ["Public Administration"] },
      { name: "Department of Social Welfare", majors: ["Social Welfare Policy", "Social Welfare Practice"] },
      { name: "Department of Political Science and Diplomacy", majors: ["Political Science and Diplomacy"] },
      { name: "Department of Sociology", majors: ["Sociology"] },
      { name: "Department of Psychology", majors: ["Psychology"] },
      { name: "Department of Library, Archive and Information Studies", majors: ["Library, Archive and Information Studies"] },
      { name: "Department of Media and Communication", majors: ["Media and Communication"] }
    ]
  },
  {
    name: "College of Natural Sciences",
    departments: [
      { name: "Department of Mathematics", majors: ["Mathematics"] },
      { name: "Department of Statistics", majors: ["Statistics"] },
      { name: "Department of Microbiology", majors: ["Microbiology"] },
      { name: "Department of Biological Sciences", majors: ["Biological Sciences"] },
      { name: "Department of Atmospheric Sciences", majors: ["Atmospheric Sciences"] },
      { name: "Department of Physics", majors: ["Physics"] },
      { name: "Department of Chemistry", majors: ["Chemistry"] },
      { name: "Department of Molecular Biology", majors: ["Molecular Biology"] },
      { name: "Department of Geological Sciences", majors: ["Geological Sciences"] },
      { name: "Department of Oceanography", majors: ["Oceanography"] }
    ]
  },
  {
    name: "College of Engineering",
    departments: [
      {
        name: "School of Mechanical Engineering",
        majors: [
          "Energy Systems Major",
          "Mechanical Systems Design Major",
          "Precision Manufacturing Systems Major",
          "Control, Automation and Systems Major",
          "Nuclear Systems Major",
          "Intelligent Manufacturing Systems Major"
        ]
      },
      { name: "Department of Aerospace Engineering", majors: ["Aerospace Engineering"] },
      { name: "Department of Polymer Science and Engineering", majors: ["Polymer Science and Engineering"] },
      {
        name: "School of Chemical, Biomolecular and Environmental Engineering",
        majors: ["Chemical and Biomolecular Engineering", "Environmental Engineering"]
      },
      { name: "Department of Naval Architecture and Ocean Engineering", majors: ["Naval Architecture and Ocean Engineering"] },
      { name: "School of Materials Science and Engineering", majors: ["Materials Science and Engineering"] },
      { name: "Department of Industrial Engineering", majors: ["Industrial Engineering", "Industrial AI Convergence"] },
      { name: "Department of Organic Material Science and Engineering", majors: ["Organic Material Science and Engineering"] }
    ]
  },
  {
    name: "College of Education",
    departments: [
      { name: "Department of German Language Education", majors: ["German Language Education"] },
      { name: "Department of Korean Language Education", majors: ["Korean Language Education"] },
      { name: "Department of English Language Education", majors: ["English Language Education"] },
      { name: "Department of French Language Education", majors: ["French Language Education"] },
      { name: "Department of Early Childhood Education", majors: ["Early Childhood Education"] },
      { name: "Department of Social Studies Education", majors: ["Social Studies Education"] },
      { name: "Department of Education", majors: ["Education"] },
      { name: "Department of Special Education", majors: ["Special Education"] },
      { name: "Department of History Education", majors: ["History Education"] },
      { name: "Department of Geography Education", majors: ["Geography Education"] },
      { name: "Department of Ethics Education", majors: ["Ethics Education"] },
      { name: "Department of Physics Education", majors: ["Physics Education"] },
      { name: "Department of Biology Education", majors: ["Biology Education"] },
      { name: "Department of Physical Education", majors: ["Physical Education"] },
      { name: "Department of Mathematics Education", majors: ["Mathematics Education"] },
      { name: "Department of Chemistry Education", majors: ["Chemistry Education"] },
      { name: "Department of Earth Science Education", majors: ["Earth Science Education"] }
    ]
  },
  {
    name: "College of Pharmacy",
    departments: [
      { name: "School of Pharmacy", majors: ["Pharmacy"] }
    ]
  },
  {
    name: "School of Medicine",
    departments: [
      { name: "Department of Medicine", majors: ["Medicine"] },
      { name: "Department of Preliminary Medicine", majors: ["Preliminary Medicine"] }
    ]
  },
  {
    name: "College of Arts",
    departments: [
      { name: "Department of Music", majors: ["Vocal Music", "Piano", "Composition", "Orchestra Music and Percussion"] },
      { name: "Department of Plastic Arts", majors: ["Wooden Furniture Painting", "Ceramics", "Textiles and Metal"] },
      { name: "Department of Dance", majors: ["Korean Dance", "Ballet", "Modern Dance"] },
      { name: "Department of Art, Culture and Image", majors: ["Art, Culture and Image"] },
      { name: "Department of Fine Arts", majors: ["Carving and Modeling", "Korean Painting", "Western Painting"] },
      { name: "Department of Korean Music", majors: ["String and Vocal", "Wind and Percussion", "Theory and Composition"] },
      { name: "Department of Design", majors: ["Visual Design", "Animation", "Image Information"] }
    ]
  },
  {
    name: "College of Nanoscience and Nanotechnology",
    departments: [
      { name: "Department of Nanomechatronics Engineering", majors: ["Nanomechatronics Engineering"] },
      { name: "Department of Nanoenergy Engineering", majors: ["Nanoenergy Engineering"] },
      { name: "Department of Optics and Mechatronics Engineering", majors: ["Optics and Mechatronics Engineering"] }
    ]
  },
  {
    name: "College of Natural Resource and Life Sciences",
    departments: [
      { name: "Department of Plant Bioscience", majors: ["Plant Bioscience"] },
      { name: "Department of Animal Science", majors: ["Animal Science"] },
      { name: "Department of Life Science and Environmental Biochemistry", majors: ["Life Science and Environmental Biochemistry"] },
      { name: "Department of Bioenvironmental Energy", majors: ["Bioenvironmental Energy"] },
      { name: "Department of Landscape Architecture", majors: ["Landscape Architecture"] },
      { name: "Department of Horticultural Bioscience", majors: ["Horticultural Bioscience"] },
      { name: "Department of Food Science and Technology", majors: ["Food Science and Technology"] },
      { name: "Department of Biomaterials Science", majors: ["Biomaterials Science"] },
      { name: "Department of Bio-Industrial Machinery Engineering", majors: ["Bio-Industrial Machinery Engineering"] },
      { name: "Department of Applied IT Engineering", majors: ["Applied IT Engineering"] }
    ]
  },
  {
    name: "College of Nursing",
    departments: [
      { name: "Department of Nursing", majors: ["Nursing"] }
    ]
  },
  {
    name: "College of Business",
    departments: [
      { name: "Department of Business Administration", majors: ["Business Administration"] }
    ]
  },
  {
    name: "College of Economics and International Trade",
    departments: [
      { name: "School of International Trade", majors: ["International Trade"] },
      { name: "Department of Tourism and Convention", majors: ["Tourism and Convention"] },
      { name: "School of Public Policy and Management", majors: ["Public Policy and Management"] },
      { name: "School of Economics", majors: ["Economics"] },
      { name: "School of Global Studies", majors: ["Global Studies"] }
    ]
  },
  {
    name: "College of Human Ecology",
    departments: [
      { name: "Child Development and Family Studies", majors: ["Child Development and Family Studies"] },
      { name: "Food Science and Nutrition", majors: ["Food Science and Nutrition"] },
      { name: "Sport Science", majors: ["Sport Science"] },
      { name: "Clothing and Textiles", majors: ["Clothing and Textiles"] },
      { name: "Interior and Environmental Design", majors: ["Interior and Environmental Design"] }
    ]
  },
  {
    name: "College of Information and BioMedical Engineering",
    departments: [
      { name: "School of Computer Science and Engineering", majors: ["Computer Engineering", "Artificial Intelligence", "Design Technology"] },
      { name: "School of BioMedical Convergence Engineering", majors: ["BioMedical Engineering", "SW Convergence", "Data Science", "Advanced Bioengineering", "Convergence Major of Medical Artificial Intelligence"] }
    ]
  },
  {
    name: "University College",
    departments: [
      { name: "School of Transdisciplinary Engineering", majors: ["Advanced Energy Major", "Advanced Nano-device Manufacturing Major", "Optics and Mechatronics Engineering Major"] },
      { name: "School of Applied Life and Convergence Science", majors: ["Applied Life and Convergence Science"] },
      { name: "School of Liberal Studies", majors: ["Liberal Studies"] }
    ]
  }
];

export const MAJOR_OPTIONS = ACADEMIC_HIERARCHY.reduce<string[]>((acc, college) => {
  college.departments.forEach(dept => {
    acc.push(...dept.majors);
  });
  return acc;
}, []);

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
