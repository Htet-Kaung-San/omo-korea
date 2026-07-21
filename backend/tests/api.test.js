const request = require("supertest");
const app = require("../index");
const supabase = require("../supabaseClient");

// Fixture accounts, created by `npm run seed:test-fixtures`. They must exist
// before this suite runs; it authenticates as them rather than creating them.
const ADMIN_STUDENT_ID = "202455393";
const NON_ADMIN_STUDENT_ID = "202612345";
const FIXTURE_PASSWORD = "password";

describe("Hey! PNU Backend API Integration Tests", () => {
  let tempPostId = null;
  let authToken = null;

  beforeAll(async () => {
    const res = await request(app)
      .post("/api/students/login")
      .send({
        student_id: ADMIN_STUDENT_ID,
        password: FIXTURE_PASSWORD,
      });

    if (!res.body.success || !res.body.data) {
      throw new Error(
        `Could not log in as fixture ${ADMIN_STUDENT_ID}. ` +
          "Run `npm run seed:test-fixtures` first.",
      );
    }

    authToken = res.body.data.token;
  });

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
    it("should return user details and JWT token for valid student credentials", async () => {
      const res = await request(app)
        .post("/api/students/login")
        .send({
          student_id: ADMIN_STUDENT_ID,
          password: FIXTURE_PASSWORD,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(String(res.body.data.student_id)).toBe(ADMIN_STUDENT_ID);
      expect(res.body.data.name).toBeDefined();
      expect(res.body.data.token).toBeDefined();
      authToken = res.body.data.token; // Save token for write routes
    });

    it("should return 401 Unauthorized for incorrect password", async () => {
      const res = await request(app)
        .post("/api/students/login")
        .send({
          student_id: ADMIN_STUDENT_ID,
          password: "wrongpassword",
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/(invalid|incorrect|failed)/i);
    });
  });

  // 3. Test Global Search
  describe("GET /api/students/search", () => {
    it("should return structured, ranked search results for query 'Library'", async () => {
      const res = await request(app)
        .get("/api/students/search")
        .query({ q: "Library" })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.query).toBe("Library");
      expect(res.body.data.courses).toBeInstanceOf(Array);
      expect(res.body.data.notices).toBeInstanceOf(Array);
      expect(res.body.data.scholarships).toBeInstanceOf(Array);
      expect(res.body.data.programs).toBeInstanceOf(Array);
      expect(res.body.data.majors).toBeInstanceOf(Array);
      expect(res.body.data.documents).toBeInstanceOf(Array);
      expect(res.body.data.facilities).toBeInstanceOf(Array);
      expect(res.body.data.posts).toBeInstanceOf(Array);
    });
  });

  // 4. Test Post, Comment, and Comments Retrieval Lifecycle (Auth Protected)
  describe("Forum Posts & Comments Lifecycle (Auth Protected)", () => {
    it("should allow creating a forum post using JWT authentication", async () => {
      expect(authToken).toBeDefined();

      const res = await request(app)
        .post("/api/students/posts")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          board_id: 3,
          student_id: ADMIN_STUDENT_ID,
          title: "Automated test thread title",
          content: "Automated test thread content details description",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.post_id).toBeDefined();
      tempPostId = res.body.data.post_id;
    });

    it("should allow posting a comment to the newly created post with auth", async () => {
      expect(tempPostId).toBeDefined();
      expect(authToken).toBeDefined();

      const res = await request(app)
        .post("/api/students/comments")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          post_id: tempPostId,
          student_id: ADMIN_STUDENT_ID,
          content: "Automated test comment content description",
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe(
        "Automated test comment content description",
      );
      expect(res.body.data.student_name).toBeDefined();
    });

    it("should retrieve comments for the post (unprotected read)", async () => {
      expect(tempPostId).toBeDefined();

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

    it("should allow upvoting the post using JWT authentication", async () => {
      expect(tempPostId).toBeDefined();
      expect(authToken).toBeDefined();

      const res = await request(app)
        .post(`/api/students/posts/${tempPostId}/like`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.likes_count).toBeDefined();
      expect(res.body.data.liked).toBe(true);
    });

    it("should allow reporting the post using JWT authentication", async () => {
      expect(tempPostId).toBeDefined();
      expect(authToken).toBeDefined();

      const res = await request(app)
        .post(`/api/students/posts/${tempPostId}/report`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBeDefined();
    });
  });

  // 5. Test Language Preferences Sync (Auth Protected)
  describe("PATCH /api/students/:student_id/language", () => {
    it("should update language preference to KO with auth", async () => {
      expect(authToken).toBeDefined();

      const res = await request(app)
        .patch(`/api/students/${ADMIN_STUDENT_ID}/language`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ language_pref: "ko" })
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  // 6. Test Course Enrollments & Conflicts (Auth Protected)
  describe("POST /api/students/enrollments", () => {
    // Enrollments persist in the shared database, and re-enrolling in the same
    // course is rejected with 400. Clear the fixture's enrollments first so the
    // suite gives the same result on every run.
    beforeAll(async () => {
      await supabase.from("enrollment").delete().eq("student_id", ADMIN_STUDENT_ID);
    });

    it("should allow enrolling in a course with auth", async () => {
      expect(authToken).toBeDefined();

      const res = await request(app)
        .post("/api/students/enrollments")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          student_id: ADMIN_STUDENT_ID,
          course_id: 8,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    // Courses 8 and 9 share Monday and overlap (09:30–10:45 vs 10:00–11:15),
    // per backend/supabase/post_engagement_and_schedule.sql.
    it("should reject enrolling in a conflicting course with 400 Bad Request", async () => {
      expect(authToken).toBeDefined();

      // Course 9 overlaps with Course 8 on Monday 09:30-10:45
      const res = await request(app)
        .post("/api/students/enrollments")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          student_id: ADMIN_STUDENT_ID,
          course_id: 9,
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Schedule Conflict");
    });
  });

  // 7. Test Account Deletion Request
  //
  // The hard-delete test that used to live here was removed. It deleted the
  // very account the suite authenticates as and asserted the profile was gone,
  // so the suite passed exactly once and failed on every run afterwards. The
  // request-delete flag below is reset in afterAll to keep the run repeatable.
  describe("Account Deletion Flow", () => {
    afterAll(async () => {
      await request(app)
        .patch(`/api/students/${ADMIN_STUDENT_ID}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ deletion_requested: false });
    });

    it("should allow student to request account deletion", async () => {
      expect(authToken).toBeDefined();

      const res = await request(app)
        .patch(`/api/students/${ADMIN_STUDENT_ID}/request-delete`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.deletion_requested).toBe(true);
    });
  });

  // 8. Test Admin Access Control
  describe("Admin Access Control", () => {
    let nonAdminToken = null;

    beforeAll(async () => {
      // Login as a non-admin student
      const res = await request(app)
        .post("/api/students/login")
        .send({
          student_id: NON_ADMIN_STUDENT_ID,
          password: FIXTURE_PASSWORD,
        });
      if (res.body.success && res.body.data) {
        nonAdminToken = res.body.data.token;
      }
    });

    it("should reject non-admin from listing all students with 403", async () => {
      expect(nonAdminToken).toBeDefined();

      const res = await request(app)
        .get("/api/students/")
        .set("Authorization", `Bearer ${nonAdminToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Admin privileges required");
    });

    it("should reject non-admin from deleting a student with 403", async () => {
      expect(nonAdminToken).toBeDefined();

      const res = await request(app)
        .delete("/api/students/202012345")
        .set("Authorization", `Bearer ${nonAdminToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Admin privileges required");
    });

    it("should include is_admin field in login response", async () => {
      const res = await request(app)
        .post("/api/students/login")
        .send({
          student_id: NON_ADMIN_STUDENT_ID,
          password: FIXTURE_PASSWORD,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.is_admin).toBe(false);
    });
  });
});
