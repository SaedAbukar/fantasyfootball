const request = require("supertest");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const app = require("../app"); // Your Express app
const User = require("../src/models/User");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;
let token;
let adminToken;
let testUser;
let adminUser;

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  // Set up an in-memory MongoDB server
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Create a test user
  const hashedPassword = await bcrypt.hash("Helsinki1!", 10);
  testUser = await User.create({
    firstname: "John",
    lastname: "Doe",
    email: "john@example.com",
    password: hashedPassword,
    role: "user", // User role
  });

  testUser1 = await User.create({
    firstname: "John",
    lastname: "Doe",
    email: "john1@example.com",
    password: hashedPassword,
    role: "user", // User role
  });

  // Create an admin user
  const adminHashedPassword = await bcrypt.hash("Admin1!", 10);
  adminUser = await User.create({
    firstname: "Admin",
    lastname: "User",
    email: "admin@example.com",
    password: adminHashedPassword,
    role: "admin", // Admin role
  });

  // Generate JWT tokens for the test users
  token = jwt.sign(
    { id: testUser._id, firstname: testUser.firstname, role: "user" },
    process.env.JWT_SECRET,
    { expiresIn: "30m" }
  );

  adminToken = jwt.sign(
    { id: adminUser._id, firstname: adminUser.firstname, role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "30m" }
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Admin routes with /api/admin", () => {
  describe("GET /api/admin/allUsers", () => {
    it("should fetch all users for admin", async () => {
      const res = await request(app)
        .get("/api/admin/allUsers")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(3); // Expect two users (admin + test user)
    });

    it("should return 403 for non-admin user", async () => {
      const res = await request(app)
        .get("/api/admin/allUsers")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe("Access denied. Insufficient permissions.");
    });
  });

  describe("PATCH /api/admin/:id", () => {
    it("should update user role for admin", async () => {
      const res = await request(app)
        .patch(`/api/admin/${testUser._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "admin" });

      expect(res.statusCode).toBe(200);
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.role).toBe("admin"); // Check if the role is updated
    });

    it("should return 404 for non-existent user", async () => {
      const res = await request(app)
        .patch("/api/admin/507f1f77bcf86cd799439011")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "user" });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("User not found");
    });

    it("should return 403 for non-admin user", async () => {
      const res = await request(app)
        .patch(`/api/admin/${testUser._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ role: "admin" });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe("Access denied. Insufficient permissions.");
    });
  });

  describe("DELETE /api/admin/:id", () => {
    it("should delete a user for admin", async () => {
      const res = await request(app)
        .delete(`/api/admin/${testUser._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(204);

      // Ensure the user is deleted
      const deletedUser = await User.findById(testUser._id);
      expect(deletedUser).toBeNull();
    });

    it("should return 404 for non-existent user", async () => {
      const res = await request(app)
        .delete("/api/admin/507f1f77bcf86cd799439012")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("User not found");
    });

    it("should return 403 for non-admin user", async () => {
      const res = await request(app)
        .delete(`/api/admin/${adminUser._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe("Access denied. Insufficient permissions.");
    });
  });

  // New tests for user favourites management
  describe("POST /api/admin/createUser", () => {
    it("should create a new user for admin", async () => {
      const res = await request(app)
        .post("/api/admin/createUser")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          firstname: "Jane",
          lastname: "Smith",
          email: "jane@example.com",
          password: "Helsinki1!",
          favourites: [], // Ensure the favourites array exists
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.firstname).toBe("Jane");
      expect(res.body.email).toBe("jane@example.com");
    });

    it("should return 400 for invalid data", async () => {
      const res = await request(app)
        .post("/api/admin/createUser")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          firstname: "",
          lastname: "Smith",
          email: "jane@example.com",
          password: "short",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Failed to create user");
    });

    it("should return 403 for non-admin user", async () => {
      const res = await request(app)
        .post("/api/admin/createUser")
        .set("Authorization", `Bearer ${token}`)
        .send({
          firstname: "NewUser",
          lastname: "Test",
          email: "newuser@example.com",
          password: "Helsinki1!",
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe("Access denied. Insufficient permissions.");
    });
  });

  describe("POST /api/admin/:id/favourites/:jobPostId", () => {
    it("should add a job to a user's favourites", async () => {
      const jobPostId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/admin/${testUser1._id}/favourites/${jobPostId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(201);
      // Fetch the updated user to check favourites
      const updatedUser = await User.findById(testUser1._id);

      // Log the user favourites for debugging
      console.log("User favourites:", updatedUser.favourites);

      // Ensure the user's favourites contain the job post ID
      expect(updatedUser.favourites).toContainEqual(jobPostId);
    });

    it("should return 404 for non-existent user", async () => {
      const jobPostId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(
          `/api/admin/${new mongoose.Types.ObjectId()}/favourites/${jobPostId}`
        )
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("User not found");
    });

    it("should return 403 for non-admin user", async () => {
      const jobPostId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/admin/${testUser1._id}/favourites/${jobPostId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe("Access denied. Insufficient permissions.");
    });
  });

  describe("GET /api/admin/:id/favourites", () => {
    it("should get user's favourites", async () => {
      const jobPostId = new mongoose.Types.ObjectId();
      await request(app)
        .post(`/api/admin/${testUser1._id}/favourites/${jobPostId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      console.log("User favourites:", testUser1.favourites);
      // Fetch the updated user to check favourites
      const updatedUser = await User.findById(testUser1._id);

      const res = await request(app)
        .get(`/api/admin/${updatedUser._id}/favourites`)
        .set("Authorization", `Bearer ${adminToken}`);

      console.log("User favourites:", updatedUser.favourites);

      expect(res.statusCode).toBe(200);
      expect(updatedUser.favourites).toContainEqual(jobPostId);
    });

    it("should return 404 for non-existent user", async () => {
      const res = await request(app)
        .get(`/api/admin/${new mongoose.Types.ObjectId()}/favourites`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("User not found");
    });

    it("should return 403 for non-admin user", async () => {
      const res = await request(app)
        .get(`/api/admin/${testUser1._id}/favourites`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe("Access denied. Insufficient permissions.");
    });
  });

  describe("DELETE /api/admin/:id/favourites/:jobPostId", () => {
    it("should remove a job from a user's favourites", async () => {
      const jobPostId = new mongoose.Types.ObjectId();
      await request(app)
        .post(`/api/admin/${testUser1._id}/favourites/${jobPostId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      const res = await request(app)
        .delete(`/api/admin/${testUser1._id}/favourites/${jobPostId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(204);
    });

    it("should return 404 for non-existent user", async () => {
      const jobPostId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(
          `/api/admin/${new mongoose.Types.ObjectId()}/favourites/${jobPostId}`
        )
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("User not found");
    });

    it("should return 403 for non-admin user", async () => {
      const jobPostId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/admin/${testUser1._id}/favourites/${jobPostId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe("Access denied. Insufficient permissions.");
    });
  });
});
