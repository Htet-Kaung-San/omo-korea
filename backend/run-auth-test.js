const PORT = process.env.PORT || 5001;
const BASE_URL = `http://localhost:${PORT}/api/students`;
const TEST_STUDENT_ID = 202455393;

async function runAuthTest() {
  try {
    // === TEST 1: TRY ACCESSING PROTECTED ROUTE WITHOUT A TOKEN ===
    console.log('\n--- 1. Testing Protected Route Without Token ---');
    
    const badResponse = await fetch(`${BASE_URL}/checklist/${TEST_STUDENT_ID}`);
    const badData = await badResponse.json();
    
    console.log('Status Received:', badResponse.status); // Expecting 401
    console.log('Response Body:', JSON.stringify(badData, null, 2));


    // === TEST 2: LOGIN TO GET A VALID TOKEN ===
    console.log('\n--- 2. Logging In To Generate Token ---');
    
    const loginResponse = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: TEST_STUDENT_ID }),
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    
    if (!token) {
      console.error('Login failed, no token returned!');
      return;
    }
    console.log('Token successfully intercepted from login response.');


    // === TEST 3: ACCESS PROTECTED ROUTE WITH VALID BEARER TOKEN ===
    console.log('\n--- 3. Testing Protected Route With Valid Token ---');
    
    const goodResponse = await fetch(`${BASE_URL}/checklist/${TEST_STUDENT_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`, // Passing token in standard format
        'Content-Type': 'application/json'
      }
    });
    
    const goodData = await goodResponse.json();
    
    console.log('Status Received:', goodResponse.status); // Expecting 200
    console.log(`Success! Fetched ${goodData.data?.length ?? 0} checklist items securely.`);

  } catch (err) {
    console.error('Test pipeline failed:', err.message);
  }
}

runAuthTest();