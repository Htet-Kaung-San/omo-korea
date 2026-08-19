#!/usr/bin/env node

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const supabase = require('../supabaseClient.js');
const {
  buildSourceDataset,
  classifyDataset,
} = require('./lib/economicsInternationalTradeCurriculum.cjs');

async function fetchAllCourses(pageSize = 1000) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('course')
      .select('course_id,course_name,course_name_en,credit,major_id,category,official_course_number,recommended_year')
      .order('course_id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`Production course query failed: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

try {
  const sourceDataset = buildSourceDataset();
  const productionCourses = await fetchAllCourses();
  const application = classifyDataset(sourceDataset, productionCourses);
  const { dataset } = application;
  console.log(JSON.stringify({
    mode: 'READ_ONLY_DRY_RUN',
    datasetSha256: application.datasetSha256,
    counts: {
      sourceCourses: dataset.sourceCourses.length,
      existingCourses: dataset.existingCourses.length,
      newCourses: dataset.newCourses.length,
      tourismCurriculumRows: dataset.curriculumRows.length,
      departmentWebsites: dataset.departmentWebsites.length,
    },
    byMajor: [68, 70, 71].map((majorId) => ({
      majorId,
      source: dataset.sourceCourses.filter((row) => row.major_id === majorId).length,
      existing: dataset.existingCourses.filter((row) => row.major_id === majorId).length,
      new: dataset.newCourses.filter((row) => row.major_id === majorId).length,
    })),
    categoryChanges: dataset.existingCourses
      .filter((row) => row.previous_category !== row.category)
      .map((row) => ({
        courseId: row.course_id,
        name: row.course_name,
        previous: row.previous_category,
        reviewed: row.category,
      })),
  }, null, 2));
  console.log('No database writes performed.');
} catch (error) {
  console.error(`Curriculum dry-run stopped safely: ${error.message}`);
  process.exitCode = 1;
}
