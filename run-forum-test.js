const BASE_URL = 'http://localhost:5000/api/students';

async function runForumTest() {
  try {
    console.log('\n--- POST create forum post ---\n');

    // 1. Pointing cleanly to /api/students/posts
    const postResponse = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        board_id: 7,
        student_id: 202455393,
        title: 'Welcome to PNU! 🌸',
        content: "Hello everyone! Let's share helpful tips about settling down in Busan on this board.",
      }),
    });

    const postData = await postResponse.json();

    console.log('Status:', postResponse.status);
    console.log('Created post:', JSON.stringify(postData, null, 2));

    console.log('\n--- GET board posts timeline ---\n');

    // 2. Pointing cleanly to /api/students/boards/7/posts
    const getResponse = await fetch(`${BASE_URL}/boards/7/posts`);
    const getData = await getResponse.json();

    console.log('Status:', getResponse.status);
    console.log('Board posts:', JSON.stringify(getData, null, 2));
  } catch (err) {
    console.error('Request failed:', err.message);
  }
}

runForumTest();