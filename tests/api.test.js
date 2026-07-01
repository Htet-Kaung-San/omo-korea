const request = require("supertest");
const app = require("../index");

describe("Hey! PNU Backend API Integration Tests", () => {
  // Test Health Diagnostics
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

  // Test Authentication Login Flow
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

  // Test Global Search
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

  // Test Forum Comments listing
  describe("GET /api/students/posts/:post_id/comments", () => {
    it("should fetch comments array matching post ID 1", async () => {
      const res = await request(app)
        .get("/api/students/posts/1/comments")
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });
});
