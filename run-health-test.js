const API_URL = "http://localhost:5001/api/students";

async function runTests() {
  console.log("=== RUNNING HEALTH CHECK & GLOBAL SEARCH TESTS ===");

  try {
    // 1. Fetch Health Check Status
    console.log("\n[1] Pinging health-check diagnostics...");
    const resHealth = await fetch(`${API_URL}/health-check`);
    const jsonHealth =
      (await resHealth.status) === 200 ? await resHealth.json() : null;
    console.log(`Status: ${resHealth.status}`);
    console.log("Health Payload:", JSON.stringify(jsonHealth, null, 2));

    if (jsonHealth && jsonHealth.success && jsonHealth.status === "UP") {
      console.log("✓ System Health Check verified!");
    } else {
      console.log("✗ Failed System Health Check verification.");
    }

    // 2. Perform Search Query 'Library'
    console.log('\n[2] Searching for query: "Library"...');
    const resSearch = await fetch(`${API_URL}/search?q=Library`);
    const jsonSearch = await resSearch.json();
    console.log(`Status: ${resSearch.status}`);
    console.log("Search Results:", JSON.stringify(jsonSearch, null, 2));

    if (jsonSearch.success && jsonSearch.data.facilities.length > 0) {
      console.log("✓ Global search query verified!");
    } else {
      console.log("✗ Global search query failed.");
    }
  } catch (err) {
    console.error("Test Execution Error:", err);
  }
}

runTests();
