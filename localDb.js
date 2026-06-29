const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'local_db.json');

// Initialize database with default mock data
const initialData = {
  majors: [
    { major_id: 1, major_name: 'Computer Science & Engineering', department: 'College of Engineering' },
    { major_id: 2, major_name: 'Electrical Engineering', department: 'College of Engineering' },
    { major_id: 3, major_name: 'Business Administration', department: 'College of Business' },
    { major_id: 4, major_name: 'Korean Language & Literature', department: 'College of Humanities' }
  ],
  students: [
    {
      student_id: '202455393',
      name: 'Minh Nguyen',
      nationality: 'Vietnam',
      major_id: 1,
      student_type: 'Current',
      visa_status: 'D-2',
      password: 'password'
    },
    {
      student_id: '202612345',
      name: 'Jun-young Park',
      nationality: 'China',
      major_id: 3,
      student_type: 'Freshman',
      visa_status: 'D-4',
      password: 'password'
    },
    {
      student_id: '202012345',
      name: 'Sarah Connor',
      nationality: 'USA',
      major_id: 2,
      student_type: 'Current',
      visa_status: 'D-2',
      password: 'password'
    }
  ],
  checklist_items: [
    // 202455393 (Current Student / Non-freshman)
    { checklist_id: 'c1', student_id: '202455393', title: 'Submit graduation thesis outline', description: 'Submit outline to academic office', status: 'Pending' },
    { checklist_id: 'c2', student_id: '202455393', title: 'TOPIK Level 4 certificate', description: 'Language requirement', status: 'Pending' },
    { checklist_id: 'c3', student_id: '202455393', title: 'Completed credit audit', description: 'Check required major/elective credits', status: 'Completed' },
    // 202612345 (Freshman / Prep Student)
    { checklist_id: 'f1', student_id: '202612345', title: 'Apply for Alien Registration Card (ARC)', description: 'Visit immigration office within 90 days', status: 'Pending' },
    { checklist_id: 'f2', student_id: '202612345', title: 'Open local bank account', description: 'For scholarship and living expenses', status: 'Pending' },
    { checklist_id: 'f3', student_id: '202612345', title: 'Buy PNU SIM card', description: 'Get local phone number for verification', status: 'Completed' },
    // 202012345 (Current Student)
    { checklist_id: 'c20', student_id: '202012345', title: 'Submit graduation thesis outline', description: 'Submit outline to academic office', status: 'Pending' },
    { checklist_id: 'c21', student_id: '202012345', title: 'TOPIK Level 4 certificate', description: 'Language requirement', status: 'Completed' }
  ],
  scholarships: [
    { scholarship_id: 1, name: 'GKS Scholarship', amount: 'Full Tuition + Monthly allowance', deadline: '2026-09-01', description: 'Global Korea Scholarship for international students.' },
    { scholarship_id: 2, name: 'TOPIK Excellence Scholarship', amount: '50% Tuition reduction', deadline: '2026-08-15', description: 'Based on TOPIK score level 5 or 6.' },
    { scholarship_id: 3, name: 'PNU International Merit Scholarship', amount: '30% - 100% Tuition waiver', deadline: '2026-10-10', description: 'Academic excellence scholarship based on GPA.' }
  ],
  scholarship_applications: [],
  boards: [
    { board_id: 1, category: 'VISA', name: 'Visa & ARC' },
    { board_id: 2, category: 'HOUSING', name: 'Dorm & Housing' },
    { board_id: 3, category: 'CAMPUS_LIFE', name: 'Campus Life & Events' },
    { board_id: 4, category: 'ACADEMICS', name: 'Academics & Courses' }
  ],
  posts: [
    {
      post_id: 1,
      board_id: 1,
      student_id: '202455393',
      title: 'ARC Application processing times',
      content: 'Hey guys! Does anyone know how long the ARC card processing takes right now at the Busan Immigration Office? I went last week.',
      created_at: '2026-06-25T10:15:30Z'
    },
    {
      post_id: 2,
      board_id: 2,
      student_id: '202012345',
      title: 'Looking for a roommate (Woongbi Hall)',
      content: 'Hi! I am currently residing in Woongbi Hall and looking for a roommate for the upcoming fall semester. Please DM me if interested!',
      created_at: '2026-06-26T14:32:00Z'
    }
  ]
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
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
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
    console.error('Error reading local JSON database:', e);
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
    console.error('Error writing local JSON database:', e);
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
    if (table === 'posts') {
      const maxId = records.reduce((max, r) => Math.max(max, Number(r.post_id) || 0), 0);
      newRecord.post_id = maxId + 1;
      newRecord.created_at = new Date().toISOString();
    } else if (table === 'boards') {
      const maxId = records.reduce((max, r) => Math.max(max, Number(r.board_id) || 0), 0);
      newRecord.board_id = maxId + 1;
    } else if (table === 'scholarship_applications') {
      const maxId = records.reduce((max, r) => Math.max(max, Number(r.application_id) || 0), 0);
      newRecord.application_id = maxId + 1;
      newRecord.applied_at = new Date().toISOString();
    }
    records.push(newRecord);
    this.save(table, records);
    return newRecord;
  },

  update(table, predicate, updates) {
    const records = this.get(table);
    let updated = null;
    const nextRecords = records.map(r => {
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
    const remaining = records.filter(r => !predicate(r));
    this.save(table, remaining);
    return true;
  }
};

module.exports = localDb;

