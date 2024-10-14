const request = require("supertest");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const app = require("../app"); // your Express app
const User = require("../src/models/User");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;
let token;
let testUser;

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
  });

  // Generate JWT token for the test user
  token = jwt.sign(
    { id: testUser._id, firstname: testUser.firstname },
    process.env.JWT_SECRET,
    { expiresIn: "30m" }
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("User routes with /api/users", () => {
  describe("POST /api/users/register", () => {
    it("should register a new user", async () => {
      const res = await request(app).post("/api/users/register").send({
        firstname: "Jane",
        lastname: "Smith",
        email: "jane@example.com",
        password: "Helsinki1!",
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe("User created successfully!");
      expect(res.body.token).toBeDefined();
    });

    it("should fail to register a user with invalid data", async () => {
      const res = await request(app).post("/api/users/register").send({
        firstname: "",
        email: "invalidemail",
        password: "short",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe("POST /api/users/login", () => {
    it("should login a user successfully", async () => {
      const res = await request(app).post("/api/users/login").send({
        email: "john@example.com",
        password: "Helsinki1!",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.message).toBe("User logged in successfully");
    });

    it("should fail login with incorrect credentials", async () => {
      const res = await request(app).post("/api/users/login").send({
        email: "john@example.com",
        password: "wrongpassword",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe("GET /api/users/profile", () => {
    it("should return the user's profile with valid token", async () => {
      const res = await request(app)
        .get("/api/users/profile")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(testUser._id.toString());
      expect(res.body.email).toBe(testUser.email);
    });

    it("should return 401 for missing or invalid token", async () => {
      const res = await request(app).get("/api/users/profile");

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe("No token provided");
    });
  });

  describe("PATCH /api/users/profile", () => {
    it("should update the user's profile with valid data", async () => {
      const res = await request(app)
        .patch("/api/users/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ firstname: "UpdatedName" });

      expect(res.statusCode).toBe(200);
      expect(res.body.firstname).toBe("UpdatedName");
    });

    it("should return 400 for invalid user ID", async () => {
      // In case the token has an invalid user ID, we can simulate it by creating an invalid token
      const invalidToken = jwt.sign(
        { id: "invalidId" },
        process.env.JWT_SECRET
      );
      const res = await request(app)
        .patch("/api/users/profile")
        .set("Authorization", `Bearer ${invalidToken}`)
        .send({ firstname: "AnotherName" });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Invalid user ID");
    });
  });

  describe("PATCH /api/users/favourites", () => {
    it("should add a job to the user's favourites", async () => {
      const jobId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch("/api/users/favourites")
        .set("Authorization", `Bearer ${token}`)
        .send({ jobPostId: jobId });

      expect(res.statusCode).toBe(200);
      expect(res.body).toContainEqual(jobId.toString());
    });

    it("should fail if job is already in favourites", async () => {
      const jobId = new mongoose.Types.ObjectId();
      // Add job first time
      await request(app)
        .patch("/api/users/favourites")
        .set("Authorization", `Bearer ${token}`)
        .send({ jobPostId: jobId });

      // Try adding it again
      const res = await request(app)
        .patch("/api/users/favourites")
        .set("Authorization", `Bearer ${token}`)
        .send({ jobPostId: jobId });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Job already in favourites");
    });
  });

  describe("DELETE /api/users/favourites", () => {
    it("should remove a job from the user's favourites", async () => {
      const jobId = new mongoose.Types.ObjectId();
      // Add job first
      await request(app)
        .post("/api/users/favourites")
        .set("Authorization", `Bearer ${token}`)
        .send({ jobPostId: jobId });

      // Remove job
      const res = await request(app)
        .delete("/api/users/favourites")
        .set("Authorization", `Bearer ${token}`)
        .send({ jobPostId: jobId });

      expect(res.statusCode).toBe(200);
      expect(res.body).not.toContainEqual(jobId.toString());
    });
  });

  describe("DELETE /api/users/profile", () => {
    it("should delete the user's account", async () => {
      const res = await request(app)
        .delete("/api/users/profile")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(204);
    });
  });
});
