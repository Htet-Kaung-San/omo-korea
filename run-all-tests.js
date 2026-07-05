const PORT = process.env.PORT || 5001;
const BASE_URL = `http://localhost:${PORT}/api/students`;
const TEST_STUDENT_ID = 202455393;

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
};

const results = { passed: 0, failed: 0, steps: [] };

function section(step, title) {
  console.log(`\n${C.bold}${C.cyan}${'═'.repeat(60)}${C.reset}`);
  console.log(`${C.bold}${C.magenta}STEP ${step}: ${title}${C.reset}`);
  console.log(`${C.cyan}${'═'.repeat(60)}${C.reset}\n`);
}

function pass(label, detail = '') {
  results.passed += 1;
  results.steps.push({ label, ok: true, detail });
  console.log(`${C.green}✔ PASS${C.reset}  ${label}${detail ? `${C.dim} — ${detail}${C.reset}` : ''}`);
}

function fail(label, detail = '') {
  results.failed += 1;
  results.steps.push({ label, ok: false, detail });
  console.log(`${C.red}✘ FAIL${C.reset}  ${label}${detail ? `${C.dim} — ${detail}${C.reset}` : ''}`);
}

function info(message) {
  console.log(`${C.blue}ℹ${C.reset}  ${message}`);
}

function assertStatus(label, actual, expected) {
  if (actual === expected) {
    pass(label, `status ${actual}`);
    return true;
  }
  fail(label, `expected ${expected}, got ${actual}`);
  return false;
}

async function parseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function runAllTests() {
  console.log(`\n${C.bold}${C.yellow}Hey! PNU — Full API Test Suite${C.reset}`);
  console.log(`${C.dim}Target: ${BASE_URL}${C.reset}`);

  let token = null;
  let postId = null;

  try {
    // ── 1. Public endpoints ──────────────────────────────────────────────
    section(1, 'Public Endpoints');

    const testRes = await fetch(`${BASE_URL}/test`);
    const testData = await parseJson(testRes);
    assertStatus('GET /test', testRes.status, 200);
    if (testData?.success) {
      pass('GET /test response shape', 'success: true');
      info(`Database probe returned ${testData.count ?? 0} major record(s)`);
    } else {
      fail('GET /test response shape', 'missing success flag');
    }

    const scholarshipsRes = await fetch(`${BASE_URL}/scholarships`);
    const scholarshipsData = await parseJson(scholarshipsRes);
    assertStatus('GET /scholarships', scholarshipsRes.status, 200);
    if (Array.isArray(scholarshipsData?.data)) {
      pass('GET /scholarships response shape', `${scholarshipsData.data.length} scholarship(s)`);
    } else {
      fail('GET /scholarships response shape', 'data is not an array');
    }

    // ── 2. Unauthorized blocking ───────────────────────────────────────────
    section(2, 'Unauthorized Access (Auth Middleware)');

    const unauthRes = await fetch(`${BASE_URL}/checklist/${TEST_STUDENT_ID}`);
    const unauthData = await parseJson(unauthRes);
    assertStatus('GET /checklist/:student_id without token', unauthRes.status, 401);
    if (unauthData?.message === 'Access denied. No token provided.') {
      pass('401 error message', unauthData.message);
    } else {
      fail('401 error message', JSON.stringify(unauthData?.message ?? unauthData));
    }

    // ── 3. Student login ───────────────────────────────────────────────────
    section(3, 'Student Login (JWT Issuance)');

    const loginRes = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: TEST_STUDENT_ID }),
    });
    const loginData = await parseJson(loginRes);
    assertStatus('POST /login', loginRes.status, 200);

    token = loginData?.token;
    if (token) {
      pass('JWT token received', `${token.slice(0, 20)}…`);
    } else {
      fail('JWT token received', 'no token in response — aborting protected tests');
      printSummary();
      process.exit(1);
    }

    // ── 4. Authorized access ───────────────────────────────────────────────
    section(4, 'Authorized Access (Bearer Token)');

    const checklistRes = await fetch(`${BASE_URL}/checklist/${TEST_STUDENT_ID}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const checklistData = await parseJson(checklistRes);
    assertStatus('GET /checklist/:student_id with token', checklistRes.status, 200);
    if (checklistData?.success && Array.isArray(checklistData.data)) {
      pass('Checklist payload', `${checklistData.data.length} item(s) returned`);
    } else {
      fail('Checklist payload', 'unexpected response shape');
    }

    // ── 5. Bad payload validation (posts) ──────────────────────────────────
    section(5, 'Validation Layer — Invalid Post Payload');

    const badPostRes = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        board_id: 7,
        student_id: TEST_STUDENT_ID,
        title: '',
        content: 'Hi',
      }),
    });
    const badPostData = await parseJson(badPostRes);
    assertStatus('POST /posts with invalid body', badPostRes.status, 400);

    if (badPostData?.message === 'Validation failed') {
      pass('Validation error message', badPostData.message);
    } else {
      fail('Validation error message', JSON.stringify(badPostData?.message));
    }

    if (Array.isArray(badPostData?.errors) && badPostData.errors.length > 0) {
      pass('Validation errors array', `${badPostData.errors.length} error(s)`);
      badPostData.errors.forEach((err, i) => info(`  [${i + 1}] ${err}`));
    } else {
      fail('Validation errors array', 'missing or empty errors array');
    }

    // ── 6. Successful post creation ────────────────────────────────────────
    section(6, 'Successful Post Creation');

    const goodPostRes = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        board_id: 7,
        student_id: TEST_STUDENT_ID,
        title: 'Integration Test Post',
        content: 'Automated test post created by run-all-tests.js.',
      }),
    });
    const goodPostData = await parseJson(goodPostRes);
    const postOk = goodPostRes.status >= 200 && goodPostRes.status < 300;
    if (postOk) {
      pass('POST /posts with valid body', `status ${goodPostRes.status}`);
    } else {
      fail('POST /posts with valid body', `expected 2xx, got ${goodPostRes.status}`);
    }

    postId = goodPostData?.data?.post_id;
    if (postId) {
      pass('Post created', `post_id = ${postId}`);
    } else {
      fail('Post created', 'no post_id in response — skipping comment tests');
      printSummary();
      process.exit(1);
    }

    // ── 7. Post comments workflow ──────────────────────────────────────────
    section(7, 'Post Comments Workflow');

    const badCommentRes = await fetch(`${BASE_URL}/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        student_id: TEST_STUDENT_ID,
        content: '',
      }),
    });
    const badCommentData = await parseJson(badCommentRes);
    assertStatus('POST /posts/:post_id/comments with empty content', badCommentRes.status, 400);

    if (Array.isArray(badCommentData?.errors) && badCommentData.errors.length > 0) {
      pass('Comment validation errors array', badCommentData.errors.join(' | '));
    } else {
      fail('Comment validation errors array', 'missing errors array');
    }

    const goodCommentRes = await fetch(`${BASE_URL}/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        student_id: TEST_STUDENT_ID,
        content: 'Great post — integration test comment!',
      }),
    });
    const goodCommentData = await parseJson(goodCommentRes);
    assertStatus('POST /posts/:post_id/comments with valid body', goodCommentRes.status, 201);

    if (goodCommentData?.success && goodCommentData?.data?.comment_id) {
      pass('Comment created', `comment_id = ${goodCommentData.data.comment_id}`);
    } else if (goodCommentData?.success) {
      pass('Comment created', 'success response received');
    } else {
      fail('Comment created', JSON.stringify(goodCommentData));
    }

    const getCommentsRes = await fetch(`${BASE_URL}/posts/${postId}/comments`);
    const getCommentsData = await parseJson(getCommentsRes);
    assertStatus('GET /posts/:post_id/comments (public)', getCommentsRes.status, 200);

    if (getCommentsData?.success && Array.isArray(getCommentsData.data)) {
      pass('Comments fetched publicly', `${getCommentsData.data.length} comment(s)`);
    } else {
      fail('Comments fetched publicly', 'unexpected response shape');
    }
  } catch (err) {
    console.error(`\n${C.red}${C.bold}Fatal error:${C.reset} ${err.message}`);
    console.error(`${C.dim}Is the server running? Try: npm run dev${C.reset}\n`);
    process.exit(1);
  }

  printSummary();
  process.exit(results.failed > 0 ? 1 : 0);
}

function printSummary() {
  const total = results.passed + results.failed;
  const color = results.failed === 0 ? C.green : C.red;

  console.log(`\n${C.bold}${C.cyan}${'═'.repeat(60)}${C.reset}`);
  console.log(`${C.bold}TEST SUMMARY${C.reset}`);
  console.log(`${C.cyan}${'═'.repeat(60)}${C.reset}`);
  console.log(`${color}${C.bold}  ${results.passed}/${total} assertions passed${C.reset}`);

  if (results.failed > 0) {
    console.log(`\n${C.red}Failed checks:${C.reset}`);
    results.steps
      .filter((s) => !s.ok)
      .forEach((s) => console.log(`  ${C.red}•${C.reset} ${s.label}${s.detail ? ` — ${s.detail}` : ''}`));
  } else {
    console.log(`\n${C.green}${C.bold}  All endpoints, auth, validation, and error handling verified!${C.reset}`);
  }

  console.log('');
}

runAllTests();
