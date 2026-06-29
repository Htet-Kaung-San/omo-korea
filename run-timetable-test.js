require('dotenv').config();
const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api/students`;

async function runTimetableTest() {
  try {
    const studentId = '202455393';

    console.log('\n--- 1. GET all courses ---\n');
    const coursesRes = await fetch(`${BASE_URL}/courses`);
    const coursesData = await coursesRes.json();
    console.log('Courses Count:', coursesData.data?.length);

    console.log('\n--- 2. GET current enrollments (timetable) ---\n');
    const getRes = await fetch(`${BASE_URL}/enrollments/${studentId}`);
    const getData = await getRes.json();
    console.log('Enrollments:', JSON.stringify(getData, null, 2));

    console.log('\n--- 3. POST new enrollment (Add course_id: 4) ---\n');
    const postRes = await fetch(`${BASE_URL}/enrollments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId, course_id: 4 })
    });
    const postData = await postRes.json();
    console.log('Status:', postRes.status);
    console.log('Enroll Result:', JSON.stringify(postData, null, 2));

    console.log('\n--- 4. POST duplicate enrollment (Verify error) ---\n');
    const dupRes = await fetch(`${BASE_URL}/enrollments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId, course_id: 4 })
    });
    const dupData = await dupRes.json();
    console.log('Status:', dupRes.status);
    console.log('Duplicate Result:', JSON.stringify(dupData, null, 2));

    if (postData.success && postData.data && postData.data.enrollment_id) {
      console.log('\n--- 5. DELETE enrollment (Drop course) ---\n');
      const delRes = await fetch(`${BASE_URL}/enrollments/${postData.data.enrollment_id}`, {
        method: 'DELETE'
      });
      const delData = await delRes.json();
      console.log('Status:', delRes.status);
      console.log('Drop Result:', JSON.stringify(delData, null, 2));
    }

  } catch (err) {
    console.error('Request failed:', err.message);
  }
}

runTimetableTest();
