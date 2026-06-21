const BASE_URL = 'http://localhost:5000/api/students';

async function runScholarshipTest() {
  try {
    console.log('\n--- GET all scholarships ---\n');

    const getResponse = await fetch(`${BASE_URL}/scholarships`);
    const getData = await getResponse.json();

    console.log('Status:', getResponse.status);
    console.log('Scholarships:', JSON.stringify(getData, null, 2));

    console.log('\n--- POST scholarship application ---\n');

    const postResponse = await fetch(`${BASE_URL}/scholarships/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: 202455393, scholarship_id: 1 }),
    });

    const postData = await postResponse.json();

    console.log('Status:', postResponse.status);
    console.log('Application:', JSON.stringify(postData, null, 2));
  } catch (err) {
    console.error('Request failed:', err.message);
  }
}

runScholarshipTest();
