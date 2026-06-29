require("dotenv").config();
const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api/students`;

async function runForumTest() {
  try {
    console.log("\n--- GET all boards ---\n");
    const boardsRes = await fetch(`${BASE_URL}/boards`);
    const boardsData = await boardsRes.json();
    console.log("Status:", boardsRes.status);
    console.log("Boards:", JSON.stringify(boardsData, null, 2));

    if (
      !boardsData.success ||
      !boardsData.data ||
      boardsData.data.length === 0
    ) {
      console.error("No boards found. Exiting test.");
      return;
    }

    const firstBoard = boardsData.data[0];
    const boardId = firstBoard.board_id;

    console.log(
      `\n--- POST a new post under board: ${firstBoard.name} (board_id: ${boardId}) ---\n`,
    );
    const newPost = {
      board_id: boardId,
      student_id: "202455393",
      title: "Settlement Tips for Busan",
      content:
        "I highly recommend visiting the Geumjeong-gu office early in the morning to avoid long queues for ARC registration!",
    };

    const postRes = await fetch(`${BASE_URL}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPost),
    });
    const postData = await postRes.json();
    console.log("Status:", postRes.status);
    console.log("Created Post:", JSON.stringify(postData, null, 2));

    console.log(
      `\n--- GET posts for board: ${firstBoard.name} (board_id: ${boardId}) ---\n`,
    );
    const postsRes = await fetch(`${BASE_URL}/boards/${boardId}/posts`);
    const postsData = await postsRes.json();
    console.log("Status:", postsRes.status);
    console.log("Posts:", JSON.stringify(postsData, null, 2));
  } catch (err) {
    console.error("Request failed:", err.message);
  }
}

runForumTest();
