import { describe, beforeEach, vi, it, expect, afterEach } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";

import { apiRoutes, DEFAULT_SINCE_OFFSET } from "./api.js";
import type { MonitoringService } from "../services/monitoring.js";

let app: FastifyInstance;
let mockMonitoring: MonitoringService;

beforeEach(async () => {
  mockMonitoring = {
    start: vi.fn(),
    stop: vi.fn(),
    getData: vi.fn(),
  };

  app = Fastify();

  app.register(apiRoutes, {
    cpuMonitoring: mockMonitoring,
  });
});

beforeEach(() => {
  // Use fake timers to speed up the test and make it predictable.
  vi.useFakeTimers();
});

afterEach(() => {
  // Restore the real timers once the test is done.
  vi.useRealTimers();
});

describe("GET /metrics/cpu-load", () => {
  describe("query string validation", () => {
    it("responds with a 400 error if the since query string is not a number", async () => {
      const response = await app.inject({
        method: "GET",
        url: `/metrics/cpu-load?since=abc`,
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        error: "Bad Request",
        message: "querystring/since must be number",
      });
    });
  });

  it("invokes the monitoring service with the since query string", async () => {
    const since = 123;

    await app.inject({
      method: "GET",
      url: `/metrics/cpu-load?since=${since}`,
    });

    expect(mockMonitoring.getData).toHaveBeenCalledWith({
      since,
    });
  });

  it("invokes the monitoring service with the default since value", async () => {
    const expectedSince = Date.now() - DEFAULT_SINCE_OFFSET; // 10 minutes ago

    await app.inject({
      method: "GET",
      url: "/metrics/cpu-load",
    });

    expect(mockMonitoring.getData).toHaveBeenCalledWith({
      since: expectedSince,
    });
  });

  it("respond with a 200 response with data points from the monitoring service", async () => {
    const expectedData = [{ timestamp: 123, value: 0.5 }];
    mockMonitoring.getData = vi.fn().mockReturnValue(expectedData);

    const response = await app.inject({
      method: "GET",
      url: `/metrics/cpu-load`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ data: expectedData });
  });
});
