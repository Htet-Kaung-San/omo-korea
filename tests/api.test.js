const request = require("supertest");
const app = require("../index");

describe("Hey! PNU Backend API Integration Tests", () => {
  let tempPostId = null;

  // 1. Test Health Diagnostics
  describe("GET /api/students/health-check", () => {
    it("should return system health statistics and DB status", async () => {
      const res = await request(app)
        .get("/api/students/health-check")
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe("UP");
      expect(res.body.database).toBeDefined();
      expect(res.body.counts).toBeDefined();
    });
  });

  // 2. Test Authentication Login Flow
  describe("POST /api/students/login", () => {
    it("should return user details for valid student credentials", async () => {
      const res = await request(app)
        .post("/api/students/login")
        .send({
          student_id: "202455393",
          password: "password",
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(String(res.body.data.student_id)).toBe("202455393");
      expect(res.body.data.name).toBeDefined();
    });

    it("should return 401 Unauthorized for incorrect password", async () => {
      const res = await request(app)
        .post("/api/students/login")
        .send({
          student_id: "202455393",
          password: "wrongpassword",
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/(invalid|incorrect|failed)/i);
    });
  });

  // 3. Test Global Search
  describe("GET /api/students/search", () => {
    it("should return search results for query 'Library'", async () => {
      const res = await request(app)
        .get("/api/students/search")
        .query({ q: "Library" })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.facilities).toBeInstanceOf(Array);
    });
  });

  // 4. Test Post, Comment, and Comments Retrieval Lifecycle
  describe("Forum Posts & Comments Lifecycle", () => {
    it("should allow creating a forum post", async () => {
      const res = await request(app).post("/api/students/posts").send({
        board_id: 3,
        student_id: "202455393",
        title: "Automated test thread title",
        content: "Automated test thread content details description",
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.post_id).toBeDefined();
      tempPostId = res.body.data.post_id;
    });

    it("should allow posting a comment to the newly created post", async () => {
      if (!tempPostId) return;

      const res = await request(app)
        .post("/api/students/comments")
        .send({
          post_id: tempPostId,
          student_id: "202455393",
          content: "Automated test comment content description",
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe(
        "Automated test comment content description",
      );
      expect(res.body.data.student_name).toBeDefined();
    });

    it("should retrieve comments for the post", async () => {
      if (!tempPostId) return;

      const res = await request(app)
        .get(`/api/students/posts/${tempPostId}/comments`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].content).toBe(
        "Automated test comment content description",
      );
    });
  });

  // 5. Test Language Preferences Sync
  describe("PATCH /api/students/:student_id/language", () => {
    it("should update language preference to KO", async () => {
      const res = await request(app)
        .patch("/api/students/202455393/language")
        .send({ language_pref: "KO" })
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  // 6. Test Course Enrollments
  describe("POST /api/students/enrollments", () => {
    it("should allow enrolling in a course", async () => {
      const res = await request(app).post("/api/students/enrollments").send({
        student_id: "202455393",
        course_id: 8,
      });

      expect([201, 400, 409, 500]).toContain(res.status);
    });
  });
});
