const API_URL = 'http://localhost:5001/api/students';
const studentId = '202455393';

async function runTests() {
  console.log('=== RUNNING COMMENTS AND LANGUAGE PREF ENDPOINT TESTS ===');
  
  try {
    // 0. Fetch boards
    console.log('[0] Fetching discussion boards...');
    const resBoards = await fetch(`${API_URL}/boards`);
    const jsonBoards = await resBoards.json();
    if (!jsonBoards.success || jsonBoards.data.length === 0) {
      console.log('✗ No boards found.');
      return;
    }
    const boardId = jsonBoards.data[0].board_id;
    console.log(`Using board_id: ${boardId}`);

    // 1. Fetch posts
    console.log(`\n[1] Fetching posts for board_id: ${boardId}...`);
    const resPosts = await fetch(`${API_URL}/boards/${boardId}/posts`);
    const jsonPosts = await resPosts.json();
    let postId;

    if (jsonPosts.success && jsonPosts.data.length > 0) {
      postId = jsonPosts.data[0].post_id;
      console.log(`Found existing post_id: ${postId}`);
    } else {
      console.log('No posts found. Creating a test post first...');
      const resCreatePost = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board_id: boardId,
          student_id: studentId,
          title: 'ARC Application Processing Time',
          content: 'Hey guys! Does anyone know how long the ARC card processing takes right now?'
        })
      });
      const jsonCreatePost = await resCreatePost.json();
      postId = jsonCreatePost.data.post_id;
      console.log(`Created post_id: ${postId}`);
    }

    // 2. Fetch comments for this post
    console.log(`\n[2] Fetching comments for post_id: ${postId}...`);
    const resGet = await fetch(`${API_URL}/posts/${postId}/comments`);
    const jsonGet = await resGet.json();
    console.log(`Status: ${resGet.status}`);
    console.log('Comments payload:', JSON.stringify(jsonGet, null, 2));

    // 3. Add a new comment to this post
    console.log(`\n[3] Adding a new comment to post_id: ${postId}...`);
    const resPost = await fetch(`${API_URL}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        post_id: postId,
        student_id: studentId,
        content: 'Thanks, this is helpful! I will book my slot right away.'
      })
    });
    const jsonPost = await resPost.json();
    console.log(`Status: ${resPost.status}`);
    console.log('Create comment payload:', JSON.stringify(jsonPost, null, 2));

    if (resPost.status === 201 && jsonPost.success) {
      console.log('✓ Successfully created comment!');
    } else {
      console.log('✗ Failed to create comment.');
    }

    // 4. Verify comments updated count
    console.log(`\n[4] Re-fetching comments for post_id: ${postId}...`);
    const resGet2 = await fetch(`${API_URL}/posts/${postId}/comments`);
    const jsonGet2 = await resGet2.json();
    console.log(`Updated comments count: ${jsonGet2.data?.length}`);

    // 5. Update language preference
    console.log(`\n[5] Updating language preference to 'KO' for student: ${studentId}...`);
    const resLang = await fetch(`${API_URL}/${studentId}/language`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language_pref: 'KO' })
    });
    const jsonLang = await resLang.json();
    console.log(`Status: ${resLang.status}`);
    console.log('Language patch payload:', JSON.stringify(jsonLang, null, 2));

    if (jsonLang.success && jsonLang.data.language_pref === 'KO') {
      console.log('✓ Successfully updated language preference in DB!');
    } else {
      console.log('✗ Failed to update language preference.');
    }

  } catch (err) {
    console.error('Test Execution Error:', err);
  }
}

runTests();
