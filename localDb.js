const fs = require("fs");
const path = require("path");

const DB_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DB_DIR, "local_db.json");

// Initialize database with default mock data
const initialData = {
  majors: [
    {
      major_id: 1,
      major_name: "Computer Science & Engineering",
      department: "College of Engineering",
    },
    {
      major_id: 2,
      major_name: "Electrical Engineering",
      department: "College of Engineering",
    },
    {
      major_id: 3,
      major_name: "Business Administration",
      department: "College of Business",
    },
    {
      major_id: 4,
      major_name: "Korean Language & Literature",
      department: "College of Humanities",
    },
  ],
  students: [
    {
      student_id: "202455393",
      name: "Minh Nguyen",
      nationality: "Vietnam",
      major_id: 1,
      student_type: "Current",
      visa_status: "D-2",
      password: "password",
    },
    {
      student_id: "202612345",
      name: "Jun-young Park",
      nationality: "China",
      major_id: 3,
      student_type: "Freshman",
      visa_status: "D-4",
      password: "password",
    },
    {
      student_id: "202012345",
      name: "Sarah Connor",
      nationality: "USA",
      major_id: 2,
      student_type: "Current",
      visa_status: "D-2",
      password: "password",
    },
  ],
  checklist_items: [
    // 202455393 (Current Student / Non-freshman)
    {
      checklist_id: "c1",
      student_id: "202455393",
      title: "Submit graduation thesis outline",
      description: "Submit outline to academic office",
      status: "Pending",
    },
    {
      checklist_id: "c2",
      student_id: "202455393",
      title: "TOPIK Level 4 certificate",
      description: "Language requirement",
      status: "Pending",
    },
    {
      checklist_id: "c3",
      student_id: "202455393",
      title: "Completed credit audit",
      description: "Check required major/elective credits",
      status: "Completed",
    },
    // 202612345 (Freshman / Prep Student)
    {
      checklist_id: "f1",
      student_id: "202612345",
      title: "Apply for Alien Registration Card (ARC)",
      description: "Visit immigration office within 90 days",
      status: "Pending",
    },
    {
      checklist_id: "f2",
      student_id: "202612345",
      title: "Open local bank account",
      description: "For scholarship and living expenses",
      status: "Pending",
    },
    {
      checklist_id: "f3",
      student_id: "202612345",
      title: "Buy PNU SIM card",
      description: "Get local phone number for verification",
      status: "Completed",
    },
    // 202012345 (Current Student)
    {
      checklist_id: "c20",
      student_id: "202012345",
      title: "Submit graduation thesis outline",
      description: "Submit outline to academic office",
      status: "Pending",
    },
    {
      checklist_id: "c21",
      student_id: "202012345",
      title: "TOPIK Level 4 certificate",
      description: "Language requirement",
      status: "Completed",
    },
  ],
  scholarships: [
    {
      scholarship_id: 1,
      name: "GKS Scholarship",
      amount: "Full Tuition + Monthly allowance",
      deadline: "2026-09-01",
      description: "Global Korea Scholarship for international students.",
    },
    {
      scholarship_id: 2,
      name: "TOPIK Excellence Scholarship",
      amount: "50% Tuition reduction",
      deadline: "2026-08-15",
      description: "Based on TOPIK score level 5 or 6.",
    },
    {
      scholarship_id: 3,
      name: "PNU International Merit Scholarship",
      amount: "30% - 100% Tuition waiver",
      deadline: "2026-10-10",
      description: "Academic excellence scholarship based on GPA.",
    },
  ],
  scholarship_applications: [],
  boards: [
    { board_id: 1, category: "VISA", name: "Visa & ARC" },
    { board_id: 2, category: "HOUSING", name: "Dorm & Housing" },
    { board_id: 3, category: "CAMPUS_LIFE", name: "Campus Life & Events" },
    { board_id: 4, category: "ACADEMICS", name: "Academics & Courses" },
  ],
  posts: [
    {
      post_id: 1,
      board_id: 1,
      student_id: "202455393",
      title: "ARC Application processing times",
      content:
        "Hey guys! Does anyone know how long the ARC card processing takes right now at the Busan Immigration Office? I went last week.",
      likes_count: 5,
      liked_by: ["202012345"],
      reported: false,
      created_at: "2026-06-25T10:15:30Z",
    },
    {
      post_id: 2,
      board_id: 2,
      student_id: "202012345",
      title: "Looking for a roommate (Woongbi Hall)",
      content:
        "Hi! I am currently residing in Woongbi Hall and looking for a roommate for the upcoming fall semester. Please DM me if interested!",
      likes_count: 2,
      liked_by: [],
      reported: false,
      created_at: "2026-06-26T14:32:00Z",
    },
  ],
  facilities: [
    {
      facility_id: 1,
      name: "PNU Main Library (중앙도서관)",
      type: "Library",
      latitude: 35.2335,
      longitude: 129.0792,
      hours: "06:00 - 23:00",
      details:
        "Main campus study resources. Features extensive reading rooms on the 3rd floor.",
      floors:
        "1F: Main Study Lounge & Check-in; 2F: Book Stacks & Reference; 3F: Silent Study Desks & Computers",
    },
    {
      facility_id: 2,
      name: "Geumjeong Hall Cafeteria (금정회관)",
      type: "Cafeteria",
      latitude: 35.2312,
      longitude: 129.0811,
      hours: "08:00 - 19:00",
      details:
        "Popular student dining hall located next to CSE classrooms. Serves local Korean set meals.",
      floors:
        "1F: Student Cafeteria (Korean Menu); 2F: Convenience Store & Café",
    },
    {
      facility_id: 3,
      name: "Moonchang Hall Cafeteria (문창회관)",
      type: "Cafeteria",
      latitude: 35.2348,
      longitude: 129.078,
      hours: "11:00 - 18:30",
      details:
        "North campus cafeteria featuring Western-style options and sandwich counters.",
      floors:
        "1F: International Buffet & Western Corner; 2F: Student Lounge & Copy Center",
    },
    {
      facility_id: 4,
      name: "University Headquarters (대학본부)",
      type: "Administrative",
      latitude: 35.2301,
      longitude: 129.0825,
      hours: "09:00 - 18:00",
      details:
        "Office of International Affairs (OIA) is on the 2nd floor for Visa & ARC documentation.",
      floors:
        "1F: Student Service Center; 2F: Office of International Affairs (OIA); 3F: President's Office",
    },
    {
      facility_id: 5,
      name: "Woongbee Hall Dormitory (웅비관)",
      type: "Dormitory",
      latitude: 35.2365,
      longitude: 129.0755,
      hours: "24 Hours",
      details:
        "Freshman international dorms located near the Geumjeongsan mountain edge.",
      floors:
        "1F: Lobby & Security Desk; 2F-8F: Student Dormitory Rooms; B1: Gym, Laundry & Kitchen",
    },
  ],
  notices: [
    {
      notice_id: 1,
      title: "Guidelines for Alien Registration Card (ARC) Application",
      content:
        "All incoming international students must apply for ARC within 90 days. Please submit passport photo and registration document.",
      language: "English",
      posted_date: "2026-06-20",
    },
    {
      notice_id: 2,
      title: "2026 Fall Semester Course Registration Schedule",
      content:
        "Course registration for the Fall semester starts on August 10th. Please verify your course list and requirements in advance.",
      language: "English",
      posted_date: "2026-06-22",
    },
    {
      notice_id: 3,
      title: "외국인 유학생 의료보험 의무 가입 안내",
      content:
        "국민건강보험 의무 가입에 관한 상세 안내사항을 공지합니다. 매달 보험료 납부 상태를 확인하세요.",
      language: "Korean",
      posted_date: "2026-06-23",
    },
  ],
  notifications: [
    {
      notification_id: 1,
      student_id: "202455393",
      type: "DEADLINE",
      content: "Your graduation thesis outline is due in 3 days!",
      scheduled_time: "2026-06-29T10:00:00Z",
    },
    {
      notification_id: 2,
      student_id: "202455393",
      type: "ALERT",
      content: "Your bank account NH checking limit has been verified.",
      scheduled_time: "2026-06-28T09:30:00Z",
    },
  ],
  courses: [
    {
      course_id: 1,
      course_name: "Introduction to Computer Science (컴퓨터공학개론)",
      credit: 3,
      major_id: 1,
      category: "REQUIRED",
    },
    {
      course_id: 2,
      course_name: "Data Structures (자료구조)",
      credit: 3,
      major_id: 1,
      category: "REQUIRED",
    },
    {
      course_id: 3,
      course_name: "System Programming (시스템프로그래밍)",
      credit: 3,
      major_id: 1,
      category: "REQUIRED",
    },
    {
      course_id: 4,
      course_name: "Operating Systems (운영체제)",
      credit: 3,
      major_id: 1,
      category: "REQUIRED",
    },
    {
      course_id: 5,
      course_name: "Database Systems (데이터베이스)",
      credit: 3,
      major_id: 1,
      category: "ELECTIVE",
    },
    {
      course_id: 6,
      course_name: "Artificial Intelligence (인공지능)",
      credit: 3,
      major_id: 1,
      category: "ELECTIVE",
    },
    {
      course_id: 7,
      course_name: "Computer Networks (컴퓨터네트워크)",
      credit: 3,
      major_id: 1,
      category: "ELECTIVE",
    },
    {
      course_id: 8,
      course_name: "Basic Circuit Theory (회로이론)",
      credit: 3,
      major_id: 2,
      category: "REQUIRED",
    },
    {
      course_id: 9,
      course_name: "Digital Logic Design (디지털논리설계)",
      credit: 3,
      major_id: 2,
      category: "REQUIRED",
    },
    {
      course_id: 10,
      course_name: "Elementary Korean 1 (초급 한국어 1)",
      credit: 3,
      major_id: 1,
      category: "GEN_ED",
    },
  ],
  enrollments: [
    {
      enrollment_id: 1,
      student_id: "202455393",
      course_id: 1,
      semester: "2026-Fall",
      status: "Enrolled",
    },
    {
      enrollment_id: 2,
      student_id: "202455393",
      course_id: 2,
      semester: "2026-Fall",
      status: "Enrolled",
    },
  ],
  comments: [
    {
      comment_id: 1,
      post_id: 1,
      student_id: "202012345",
      content:
        "Usually takes about 3 to 4 weeks during peak semesters. I recommend booking the appointment early!",
      created_at: "2026-06-25T11:00:00Z",
    },
    {
      comment_id: 2,
      post_id: 1,
      student_id: "202455393",
      content: "Ah, I see! Thank you for the info.",
      created_at: "2026-06-25T11:20:00Z",
    },
  ],
};

function readDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    let modified = false;
    for (const key of Object.keys(initialData)) {
      if (!data[key]) {
        data[key] = initialData[key];
        modified = true;
      }
    }
    if (modified) {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    }
    return data;
  } catch (e) {
    console.error("Error reading local JSON database:", e);
    return initialData;
  }
}

function writeDb(data) {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    console.error("Error writing local JSON database:", e);
    return false;
  }
}

const localDb = {
  get(table) {
    const db = readDb();
    return db[table] || [];
  },

  save(table, records) {
    const db = readDb();
    db[table] = records;
    writeDb(db);
  },

  findOne(table, predicate) {
    const records = this.get(table);
    return records.find(predicate) || null;
  },

  findMany(table, predicate) {
    const records = this.get(table);
    return predicate ? records.filter(predicate) : records;
  },

  insert(table, record) {
    const records = this.get(table);
    const newRecord = { ...record };
    if (table === "posts") {
      if (!newRecord.post_id) {
        const maxId = records.reduce(
          (max, r) => Math.max(max, Number(r.post_id) || 0),
          0,
        );
        newRecord.post_id = maxId + 1;
      }
      newRecord.likes_count = newRecord.likes_count ?? 0;
      newRecord.liked_by = newRecord.liked_by ?? [];
      newRecord.reported = newRecord.reported ?? false;
      newRecord.created_at = newRecord.created_at ?? new Date().toISOString();
    } else if (table === "boards") {
      const maxId = records.reduce(
        (max, r) => Math.max(max, Number(r.board_id) || 0),
        0,
      );
      newRecord.board_id = maxId + 1;
    } else if (table === "scholarship_applications") {
      const maxId = records.reduce(
        (max, r) => Math.max(max, Number(r.application_id) || 0),
        0,
      );
      newRecord.application_id = maxId + 1;
      newRecord.applied_at = new Date().toISOString();
    } else if (table === "enrollments") {
      const maxId = records.reduce(
        (max, r) => Math.max(max, Number(r.enrollment_id) || 0),
        0,
      );
      newRecord.enrollment_id = maxId + 1;
    } else if (table === "notifications") {
      const maxId = records.reduce(
        (max, r) => Math.max(max, Number(r.notification_id) || 0),
        0,
      );
      newRecord.notification_id = maxId + 1;
      newRecord.scheduled_time =
        newRecord.scheduled_time || new Date().toISOString();
    } else if (table === "notices") {
      const maxId = records.reduce(
        (max, r) => Math.max(max, Number(r.notice_id) || 0),
        0,
      );
      newRecord.notice_id = maxId + 1;
      newRecord.posted_date =
        newRecord.posted_date || new Date().toISOString().split("T")[0];
    } else if (table === "comments") {
      const maxId = records.reduce(
        (max, r) => Math.max(max, Number(r.comment_id) || 0),
        0,
      );
      newRecord.comment_id = maxId + 1;
      newRecord.created_at = new Date().toISOString();
    }
    records.push(newRecord);
    this.save(table, records);
    return newRecord;
  },

  update(table, predicate, updates) {
    const records = this.get(table);
    let updated = null;
    const nextRecords = records.map((r) => {
      if (predicate(r)) {
        updated = { ...r, ...updates };
        return updated;
      }
      return r;
    });
    if (updated) {
      this.save(table, nextRecords);
    }
    return updated;
  },

  delete(table, predicate) {
    const records = this.get(table);
    const remaining = records.filter((r) => !predicate(r));
    this.save(table, remaining);
    return true;
  },
};

module.exports = localDb;
