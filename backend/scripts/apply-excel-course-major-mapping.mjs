import 'dotenv/config';
import XLSX from 'xlsx';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import supabase from '../supabaseClient.js';

const here = dirname(fileURLToPath(import.meta.url));
const excelPath = join(here, '../../2. 2026학년도 2학기 학부 개설강좌일람표(26.7.27.9시 기준).xlsx');
const curJsonPath = join(here, '../data/curriculum-courses-2026-1.json');

// Map Korean constructed major name -> DB major_id
const KOREAN_TO_MAJOR_ID = {
  // Humanities (인문대학)
  '국어국문학과': 1,
  '일어일문학과': 2,
  '불어불문학과': 3,
  '노어노문학과': 4,
  '중어중문학과': 5,
  '영어영문학과': 6,
  '독어독문학과': 7,
  '한문학과': 8,
  '언어정보학과': 9,
  '사학과': 10,
  '철학과': 11,
  '고고학과': 12,

  // Social Sciences (사회과학대학)
  '행정학과': 13,
  '정치외교학과': 14,
  '사회복지학과': 15,
  '사회학과': 16,
  '심리학과': 17,
  '문헌정보학과': 18,
  '미디어커뮤니케이션학과': 19,

  // Natural Sciences (자연과학대학)
  '수학과': 20,
  '통계학과': 21,
  '물리학과': 22,
  '화학과': 23,
  '생명과학과': 24,
  '미생물학과': 25,
  '분자생물학과': 26,
  '지질환경과학과': 27,
  '대기환경과학과': 28,
  '해양학과': 29,

  // Engineering (공과대학)
  '기계공학부': 30,
  '기계공학과': 30,
  '고분자공학과': 31,
  '유기소재시스템공학과': 32,
  '화학공학과': 33,
  '화공생명공학과': 33,
  '화공생명·환경공학부 - 화학공학전공': 33,
  '화공생명.환경공학부 - 화학공학전공': 33,
  '화공생명·환경공학부 - 환경공학전공': 34,
  '화공생명.환경공학부 - 환경공학전공': 34,
  '환경공학과': 34,
  '전기전자공학부 - 전자공학전공': 35,
  '전자공학과': 35,
  '전기전자공학부 - 전기공학전공': 36,
  '전기공학과': 36,
  '전기전자공학부 - 반도체공학전공': 37,
  '반도체공학과': 37,
  '반도체융합전공': 37,
  '조선·해양공학과': 38,
  '조선해양공학과': 38,
  '재료공학부': 39,
  '재료공학과': 39,
  '산업공학과': 40,
  '항공우주공학과': 41,
  '건축공학과': 42,
  '건축·도시공학부 - 건축공학전공': 42,
  '건축·도시공학부 - 건축학전공': 43,
  '건축학과': 43,
  '건축·도시공학부 - 도시공학전공': 44,
  '도시공학과': 44,
  '사회기반시스템공학과': 45,
  '사회기반시스템공학부 - 토목공학전공': 45,
  '사회기반시스템공학부 - 건설환경공학전공': 45,

  // Education (사범대학)
  '국어교육과': 51,
  '영어교육과': 52,
  '독어교육과': 53,
  '불어교육과': 54,
  '교육학과': 55,
  '유아교육과': 56,
  '특수교육과': 57,
  '일반사회교육과': 58,
  '통합사회전공': 58,
  '역사교육과': 59,
  '지리교육과': 60,
  '윤리교육과': 61,
  '수학교육과': 62,
  '물리교육과': 63,
  '화학교육과': 64,
  '생물교육과': 65,
  '지구과학교육과': 66,
  '체육교육과': 67,

  // Economics and International Trade (경제통상대학)
  '무역학부': 68,
  '경제학부': 69,
  '경제학과': 69,
  '관광컨벤션학과': 70,
  '국제학부': 71,
  '공공정책학부': 72,

  // Business (경영대학)
  '경영학과': 73,
  '경영학부': 73,
  '핀테크융합전공': 73,

  // Pharmacy (약학대학)
  '약학부 - 약학전공': 74,
  '약학부 - 약학전공(통합6년제)': 74,
  '약학부 - 약학전공(2+4년제)': 74,
  '약학부(통합6년제)': 74,
  '약학부(2+4년제)': 74,
  '약학과': 74,
  '약학부 - 제약학전공': 75,
  '약학부 - 제약학전공(통합6년제)': 75,
  '약학부 - 제약학전공(2+4년제)': 75,
  '제약학과': 75,

  // Human Ecology (생활과학대학)
  '아동가족학과': 76,
  '의류학과': 77,
  '식품영양학과': 78,
  '실내환경디자인학과': 79,
  '스포츠과학과': 80,

  // Arts (예술대학)
  '음악학과': 81,
  '한국음악학과': 82,
  '미술학과': 83,
  '조형학과': 84,
  '디자인학과': 85,
  '무용학과': 86,
  '예술문화영상학과': 87,

  // Nanoscience and Nanotechnology (나노과학기술대학)
  '나노메카트로닉스공학과': 88,
  '나노에너지공학과': 89,
  '광메카트로닉스공학과': 90,

  // Natural Resource and Life Sciences (생명자원과학대학)
  '식물생명과학과': 91,
  '원예생명과학과': 92,
  '원예생명과학과(재직자)': 92,
  '동물생명자원과학과': 93,
  '식품공학과': 94,
  '생명환경화학과': 95,
  '바이오소재과학과': 96,
  '바이오산업기계공학과': 97,
  '조경학과': 98,
  '식품자원경제학과': 99,
  'IT응용공학과': 100,
  '바이오환경에너지학과': 101,
  '그린바이오융합전공': 91,

  // Nursing (간호대학)
  '간호학과': 102,

  // Medicine (의과대학)
  '의예과': 103,
  '의학과': 104,

  // Information and BioMedical Engineering (정보의생명공학대학)
  '정보컴퓨터공학부 - 컴퓨터공학전공': 105,
  '정보컴퓨터공학부 - 인공지능전공': 106,
  '정보컴퓨터공학부 - 디자인테크놀로지전공': 107,
  '정보컴퓨터공학부': 105,
  '인공지능학과': 106,
  '컴퓨터공학과': 105,
  '의생명융합공학부': 108,
  '의생명융합공학부 - 의생명융합공학전공': 108,
  '의생명융합공학부 - 데이터사이언스전공': 108,
  '의생명융합공학부 - 의생명공학전공': 108,
  '의생명공학과': 108,

  // University College / Advanced Convergence (학부대학 / 첨단융합학부)
  '자유전공학부': 109,
  '첨단융합학부 - 미래에너지전공': 110,
  '첨단융합학부 - 첨단반도체공정전공': 111,
  '첨단융합학부 - 광메카트로닉스공학전공': 112,
  '첨단융합학부 - AI융합컴퓨팅전공': 113,
  '첨단융합학부': 113,
  '응용생명융합과학부 - 그린바이오전공': 114,
  '응용생명융합학부': 114,
  '응용생명융합과학부 - 생명자원시스템공학전공': 115,
  '글로벌자유전공학부': 116,
};

function extractKoName(name) {
  if (!name) return '';
  const match = name.match(/\((.*?)\)/);
  if (match) return match[1].trim();
  return name.trim();
}

function normalizeName(str) {
  return str.replace(/\s+/g, '').replace(/[\(\)·\.\-_]/g, '').toLowerCase();
}

async function applyMappings() {
  console.log('=== Step 1: Loading Excel Dataset & Curriculum ===');
  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const excelRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const excelByCourseNumber = new Map();
  const excelByName = new Map();

  for (let i = 6; i < excelRows.length; i++) {
    const row = excelRows[i];
    if (!row || !row[5]) continue;
    const dept = (row[2] || '').toString().trim();
    const adminMajor = (row[3] || '').toString().trim();
    const courseNum = (row[5] || '').toString().trim();
    const courseName = (row[7] || '').toString().trim();

    const constructedKey = dept && dept !== 'undefined' ? `${dept} - ${adminMajor}` : adminMajor;
    const majorId = KOREAN_TO_MAJOR_ID[constructedKey] || KOREAN_TO_MAJOR_ID[adminMajor] || (dept ? KOREAN_TO_MAJOR_ID[dept] : null) || null;

    if (majorId) {
      if (courseNum && !excelByCourseNumber.has(courseNum)) {
        excelByCourseNumber.set(courseNum, { majorId, constructedKey, courseName, courseNum });
      }
      const norm = normalizeName(courseName);
      if (!excelByName.has(norm)) {
        excelByName.set(norm, { majorId, constructedKey, courseName, courseNum });
      }
    }
  }

  // Load curriculum JSON for additional matches
  const curJson = JSON.parse(readFileSync(curJsonPath, 'utf8'));
  const curByName = new Map();
  for (const item of curJson) {
    const norm = normalizeName(item.course_name);
    if (!curByName.has(norm)) {
      curByName.set(norm, item.major_id);
    }
  }

  console.log('=== Step 2: Fetching DB Courses ===');
  const { data: dbCourses, error } = await supabase.from('course').select('*');
  if (error) {
    console.error('Error fetching courses:', error);
    return;
  }

  const nullBefore = dbCourses.filter(c => c.major_id == null).length;
  console.log(`Total courses in DB: ${dbCourses.length}`);
  console.log(`Courses without major_id before backfill: ${nullBefore}`);

  const updates = [];

  for (const c of dbCourses) {
    let resolvedId = null;
    let resolvedCode = c.official_course_number || null;

    // Rule 1: Match by official course code in Excel
    if (c.official_course_number && excelByCourseNumber.has(c.official_course_number)) {
      const match = excelByCourseNumber.get(c.official_course_number);
      resolvedId = match.majorId;
    }

    // Rule 2: Match by Korean course name in Excel
    if (!resolvedId) {
      const ko = extractKoName(c.course_name);
      const norm = normalizeName(ko);
      if (excelByName.has(norm)) {
        const match = excelByName.get(norm);
        resolvedId = match.majorId;
        if (!resolvedCode && match.courseNum) resolvedCode = match.courseNum;
      }
    }

    // Rule 3: Match by Curriculum JSON (using official PNU 2026-1 curriculum mapping)
    if (!resolvedId) {
      const ko = extractKoName(c.course_name);
      const norm = normalizeName(ko);
      if (curByName.has(norm)) {
        resolvedId = curByName.get(norm);
      }
    }

    // Rule 4: Domain keywords for Computer Science & AI
    if (!resolvedId && c.course_name) {
      const lower = c.course_name.toLowerCase();
      if (lower.includes('deep learning') || lower.includes('인공지능') || lower.includes('reinforcement learning') || lower.includes('generative ai')) {
        resolvedId = 106; // AI Major
      } else if (lower.includes('programming') || lower.includes('data structure') || lower.includes('algorithm') || lower.includes('software') || lower.includes('operating system') || lower.includes('database') || lower.includes('network') || lower.includes('computer')) {
        resolvedId = 105; // Computer Engineering Major
      }
    }

    // If a valid major was resolved and needs update
    if (resolvedId && (c.major_id !== resolvedId || (!c.official_course_number && resolvedCode))) {
      updates.push({
        course_id: c.course_id,
        major_id: resolvedId,
        official_course_number: resolvedCode || c.official_course_number || null,
      });
    }
  }

  console.log(`\n=== Step 3: Executing Database Updates ===`);
  console.log(`Total courses to update: ${updates.length}`);

  let successCount = 0;
  let failCount = 0;

  for (const u of updates) {
    const patch = { major_id: u.major_id };
    if (u.official_course_number) patch.official_course_number = u.official_course_number;

    const { error: updateError } = await supabase
      .from('course')
      .update(patch)
      .eq('course_id', u.course_id);

    if (updateError) {
      console.error(`Failed to update course ${u.course_id}:`, updateError.message);
      failCount++;
    } else {
      successCount++;
    }
  }

  console.log(`\n=== Step 4: Verification ===`);
  console.log(`Successfully updated: ${successCount} courses`);
  if (failCount > 0) console.log(`Failed updates: ${failCount}`);

  const { data: updatedCourses } = await supabase.from('course').select('major_id');
  const nullAfter = updatedCourses.filter(c => c.major_id == null).length;
  const withMajorAfter = updatedCourses.filter(c => c.major_id != null).length;

  console.log(`Courses WITH major_id now: ${withMajorAfter} / ${updatedCourses.length}`);
  console.log(`Courses without major_id now: ${nullAfter}`);
}

applyMappings().catch(console.error);
