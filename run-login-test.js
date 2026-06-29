const LOGIN_URL = "http://localhost:5000/api/students/login";

async function runLoginTest() {
  try {
    const response = await fetch(LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: 202455393 }),
    });

    const data = await response.json();

    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Request failed:", err.message);
  }
}

runLoginTest();
