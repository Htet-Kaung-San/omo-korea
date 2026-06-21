const BASE_URL = 'http://localhost:5000/api/students';
const STUDENT_ID = 202455393;

async function runChecklistTest() {
  try {
    console.log(`\n--- GET checklist for student ${STUDENT_ID} ---\n`);

    const getResponse = await fetch(`${BASE_URL}/checklist/${STUDENT_ID}`);
    const getData = await getResponse.json();

    console.log('Status:', getResponse.status);
    console.log('Tasks:', JSON.stringify(getData, null, 2));

    if (!getData.success || !getData.data?.length) {
      console.error('\nNo checklist tasks found. Cannot run update test.');
      return;
    }

    const firstTask = getData.data[0];
    const taskId = firstTask.checklist_id;

    console.log(`\n--- PUT update task ${taskId} to Completed ---\n`);

    const putResponse = await fetch(`${BASE_URL}/checklist/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Completed' }),
    });

    const putData = await putResponse.json();

    console.log('Status:', putResponse.status);
    console.log('Updated task:', JSON.stringify(putData, null, 2));
  } catch (err) {
    console.error('Request failed:', err.message);
  }
}

runChecklistTest();
