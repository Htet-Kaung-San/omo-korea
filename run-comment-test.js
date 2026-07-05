const BASE_URL = 'http://localhost:5000/api/students';
const TEST_STUDENT_ID = 202455393;
const TEST_POST_ID = 1; 

async function runCommentTest() {
  try {
    // 1. Authenticate to get a valid token
    console.log('--- 1. Authenticating to get token ---');
    const loginResponse = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: TEST_STUDENT_ID }),
    });
    const { token } = await loginResponse.json();

    if (!token) {
      console.error('Authentication failed, skipping tests.');
      return;
    }

    // 2. Test input validation (Sending an empty comment)
    console.log('\n--- 2. Testing Validation Filter (Empty Comment) ---');
    const badRes = await fetch(`${BASE_URL}/posts/${TEST_POST_ID}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        student_id: TEST_STUDENT_ID,
        content: ' ' // Error: too short / empty
      })
    });
    const badData = await badRes.json();
    console.log('Status Received:', badRes.status); // Expecting 400
    console.log('Validation Response:', JSON.stringify(badData, null, 2));

    // 3. Post a legitimate comment
    console.log('\n--- 3. Submitting a Valid Comment ---');
    const goodRes = await fetch(`${BASE_URL}/posts/${TEST_POST_ID}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        student_id: TEST_STUDENT_ID,
        content: 'Hey, thanks for this helpful information! 🚀'
      })
    });
    const goodData = await goodRes.json();
    console.log('Status Received:', goodRes.status); // Expecting 201
    console.log('Created Comment:', JSON.stringify(goodData.data, null, 2));

    // 4. Fetch all comments for this post
    console.log(`\n--- 4. Fetching All Comments for Post #${TEST_POST_ID} ---`);
    const fetchRes = await fetch(`${BASE_URL}/posts/${TEST_POST_ID}/comments`);
    const fetchData = await fetchRes.json();
    console.log('Status Received:', fetchRes.status); // Expecting 200
    console.log(`Success! Retrieved ${fetchData.data?.length ?? 0} total comments.`);
    if (fetchData.data && fetchData.data.length > 0) {
      console.log('Latest comment author:', fetchData.data[fetchData.data.length - 1].author_name);
    }

  } catch (err) {
    console.error('Comment pipeline test failed:', err.message);
  }
}

runCommentTest();