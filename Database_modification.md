# Database Table Modification

## 1. Existing Major Table

The current **major table** contains the following fields:

- `major_id`
- `major_name`
- `department`
- `department_id`

The existing data is messy and contains many mistakes. The current major table includes entries such as Electrical Engineering, Business Administration, Korean Language & Literature, Mechanical Engineering, Artificial Intelligence, Computer Science and Engineering, and many others.

## 2. Existing Department Table

The current **department table** contains:

- `department_id`
- `college_id`
- `department_name`

The existing department records include:

| department_id | department_name |
|---:|---|
| 1 | College of Nursing |
| 2 | College of Engineering |
| 3 | College of Information and BioMedical Engineering |
| 4 | College of Business |
| 5 | College of Social Sciences |
| 6 | College of Nanoscience and Nanotechnology |
| 7 | College of Education |
| 8 | College of Arts |
| 9 | College of Natural Sciences |
| 10 | College of Humanities |
| 11 | College of Human Ecology |
| 12 | College of Economics and International Trade |
| 13 | School of Medicine |
| 14 | College of Pharmacy |
| 15 | College of Natural Resource and Life Sciences |
| 16 | ICE Department |
| 17 | University College |

## 3. Required New Structure

The goal is to recreate the database tables using the following hierarchy:

```text
College
└── School / Department
    └── Major
```

However, **only some departments are divided into multiple majors**.

For departments that are **not divided into separate majors**, use the department name itself as the major name.

Example:

```text
Department of Mechanical Engineering
└── Mechanical Engineering
```

## 4. Correct College / Department / Major Data

### College of Humanities

Departments:

1. Korean Language and Literature
2. Japanese Language and Literature
3. French Language and Literature
4. Russian Language and Literature
5. Chinese Language and Literature
6. English Language and Literature
7. German Language and Literature
8. Korean Literature in Classical Chinese
9. Language and Information
10. History
11. Philosophy
12. Archaeology

### College of Social Sciences

Departments:

1. Public Administration
2. Political Science and Diplomacy
3. Social Welfare
4. Sociology
5. Psychology
6. Library and Information Science
7. Media and Communication

### College of Natural Sciences

Departments:

1. Mathematics
2. Statistics
3. Physics
4. Chemistry
5. Biological Sciences
6. Microbiology
7. Molecular Biology
8. Geological and Environmental Sciences
9. Atmospheric and Environmental Sciences
10. Oceanography

### College of Engineering

Departments / majors:

1. Mechanical Engineering
2. Polymer Engineering
3. Organic Materials Systems Engineering
4. Chemical and Biomolecular Engineering
5. Environmental Engineering
6. Electrical and Electronic Engineering
   - Electronics Engineering major
   - Electrical Engineering major
   - Semiconductor Engineering major
7. Naval Architecture and Ocean Engineering
8. Materials Engineering
9. Industrial Engineering
10. Aerospace Engineering
11. Architectural Engineering
12. Architecture
13. Urban Engineering
14. Civil and Environmental Engineering
15. Future Urban Architecture and Environmental Convergence major
16. Advanced IT Autonomous major
17. Advanced Mobility Autonomous major
18. Advanced Materials Autonomous major
19. Smart City major

### College of Education

Departments:

1. Korean Language Education
2. English Language Education
3. German Language Education
4. French Language Education
5. Education
6. Early Childhood Education
7. Special Education
8. General Social Studies Education
9. History Education
10. Geography Education
11. Ethics Education
12. Mathematics Education
13. Physics Education
14. Chemistry Education
15. Biology Education
16. Earth Science Education
17. Physical Education

### College of Economics and International Trade

Departments:

1. International Trade
2. Economics
3. Tourism and Convention
4. International Studies
5. Public Policy

### College of Business

Department:

1. Business Administration

### College of Pharmacy

Department / majors:

1. Pharmacy
   - Pharmacy major
   - Pharmaceutical Sciences major

### College of Human Ecology

Departments:

1. Child Development and Family Studies
2. Clothing and Textiles
3. Food and Nutrition
4. Interior and Environmental Design
5. Sports Science

### College of Arts

Departments:

1. Music
2. Korean Traditional Music
3. Fine Arts
4. Formative Arts
5. Design
6. Dance
7. Arts, Culture and Image

### College of Nanoscience and Nanotechnology

Departments:

1. Nanomechatronics Engineering
2. Nanoenergy Engineering
3. Optics and Mechatronics Engineering

### College of Natural Resource and Life Sciences

Departments:

1. Plant Bioscience
2. Horticultural Bioscience
3. Animal Science and Life Resources
4. Food Science and Technology
5. Life and Environmental Chemistry
6. Biomaterials Science
7. Bio-Industrial Machinery Engineering
8. Landscape Architecture
9. Food and Resource Economics
10. Applied IT Engineering
11. Bioenvironmental Energy

### College of Nursing

Department:

1. Nursing

### School of Medicine

Departments:

1. Preliminary Medicine
2. Medicine

### College of Information and BioMedical Engineering

Departments / majors:

1. Information and Computer Engineering
   - Computer Engineering major
   - Artificial Intelligence major
   - Design Technology major
2. BioMedical Convergence Engineering

### University College

Departments / majors:

1. Liberal Studies
2. Advanced Convergence
   - Future Energy major
   - Advanced Nano-device Manufacturing major
   - Optics and Mechatronics Engineering major
   - AI Convergence Computational Science major
3. Applied Life and Convergence Science
   - Green Bio Science major
   - Life Resource Systems Engineering major
4. Global Liberal Studies

## 5. Department Table Modification

Change the existing **department table** into a **college table**.

In other words, the existing department-level records should become college-level records.

## 6. Major Table Modification

Make **each department a major** in the major table.

Use the following format:

```text
major_id = *
major_name = "Mechanical Engineering"
college = "College of Engineering"
```

Do **not** include the words `"Department of"` in `major_name`.

For example:

```text
major_name = "Mechanical Engineering"
```

not:

```text
major_name = "Department of Mechanical Engineering"
```

## 7. Departments with Multiple Majors

When a department contains multiple majors, include both the department and the specific major in `major_name`.

For example:

```text
Computer Science and Engineering - Computer Engineering major
```

The same naming pattern should be used for other departments that contain multiple majors.

## 8. Main Requirements

- Recreate the tables using the corrected college, department, and major hierarchy.
- Replace the existing messy department table with a **college table**.
- Put each department into the **major table** when the department does not have separate majors.
- For departments with multiple majors, create a separate major entry for each major.
- Do not use `"Department of"` in `major_name`.
- For multi-major departments, identify the department and major together, such as:
  `Computer Science and Engineering - Computer Engineering major`.
