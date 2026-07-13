const PORT = process.env.PORT || 5001;
const BASE_URL = `http://localhost:${PORT}/api/students`;
const TEST_STUDENT_ID = 202455393;

async function runValidationTest() {
  try {
    // 1. We need a token first since the route is protected by both token and validator
    console.log('--- 1. Authenticating to get token ---');
    const loginResponse = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: TEST_STUDENT_ID }),
    });
    const { token } = await loginResponse.json();

    // 2. SEND A BAD PAYLOAD (Title empty, content too short)
    console.log('\n--- 2. Sending Invalid Post Payload (Empty Title, Short Content) ---');
    const badResponse = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        board_id: 7,
        student_id: TEST_STUDENT_ID,
        title: '',          // Error: cannot be empty
        content: 'Hi'       // Error: must be at least 5 chars
      }),
    });

    const badData = await badResponse.json();
    console.log('Status Received:', badResponse.status); // Expecting 400
    console.log('Response Body:', JSON.stringify(badData, null, 2));

  } catch (err) {
    console.error('Validation test failed:', err.message);
  }
}

runValidationTest();