import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../index";
import prisma from "../lib/prisma";

describe("API Endpoints", () => {
  let eventId: string;
  let stationId: string;

  beforeAll(async () => {
    const event = await prisma.event.findFirst();
    const station = await prisma.station.findFirst();
    
    if (!event || !station) {
      throw new Error("Database not seeded! Please run npm run seed first.");
    }
    
    eventId = event.id;
    stationId = station.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("GET /health", () => {
    it("should return a 200 OK status", async () => {
      const response = await request(app).get("/health");
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: "ok" });
    });
  });

  describe("GET /api/stats/event", () => {
    it("should return the bootstrapped event ID", async () => {
      const response = await request(app).get("/api/stats/event");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", eventId);
    });
  });

  describe("GET /api/stats", () => {
    it("should return dashboard statistics and aggregates", async () => {
      const response = await request(app).get(`/api/stats?eventId=${eventId}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("total");
      expect(response.body.total).toHaveProperty("confirmed");
      expect(response.body).toHaveProperty("rate");
      expect(response.body.rate).toHaveProperty("current");
      expect(response.body.rate).toHaveProperty("history");
    });

    it("should return 400 if eventId is missing", async () => {
      const response = await request(app).get("/api/stats");
      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/guests", () => {
    it("should return a paginated guest list", async () => {
      const response = await request(app).get(`/api/guests?eventId=${eventId}&page=1&limit=5`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
      expect(response.body).toHaveProperty("pagination");
    });
  });

  describe("POST /api/checkin", () => {
    it("should reject check-in with an invalid QR token", async () => {
      const response = await request(app)
        .post("/api/checkin")
        .send({
          qrToken: "INVALID_GUEST_TOKEN_XYZ",
          stationId: stationId,
          eventId: eventId
        });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
    });
  });
});
