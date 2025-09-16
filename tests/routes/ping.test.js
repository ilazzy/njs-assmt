import request from "supertest";
import app from "../server.js";

describe("Account Routes", () => {
  test("GET PING SERVER and it will return 200 OK", async () => {
    const response = await request(app).get("/");
    expect(response.statusCode).toBe(200);
  });
});
