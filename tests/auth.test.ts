import supertest from "supertest";
import app from "../src/index";
import prisma from "../src/config/prisma";
import * as email from "../src/config/email";

// Mock email sending
jest.mock("../src/config/email", () => ({
  sendEmail: jest.fn(),
}));

describe("Auth Routes", () => {
  const testUser = {
    name: "Test User",
    email: `test${Date.now()}@example.com`,
    username: `testuser${Date.now()}`,
    password: "password123",
    phone: "1234567890",
  };

  afterAll(async () => {
    // Cleanup the user if it exists
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
    await prisma.$disconnect();
  });

  it("should register a new user successfully", async () => {
    const res = await supertest(app).post("/auth/register").send(testUser);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.email).toBe(testUser.email);
    expect(email.sendEmail).toHaveBeenCalled();
  });

  it("should login the user and return a token", async () => {
    const res = await supertest(app).post("/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.email).toBe(testUser.email);
  });

  it("should fail validation if email is invalid", async () => {
    const res = await supertest(app).post("/auth/register").send({
      ...testUser,
      email: "not-an-email",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation Error");
  });
});
