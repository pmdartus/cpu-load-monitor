import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";

import { apiRoutes, type CpuLoadResponse } from "./routes/api.js";
import { CpuMonitoringService, type DataPoint } from "./services/monitoring.js";

export function createApp(): FastifyInstance {
  const fastify = Fastify({ logger: true });

  fastify.register(cors);

  const cpuMonitoring = new CpuMonitoringService();
  fastify.addHook("onReady", async () => cpuMonitoring.start());
  fastify.addHook("onClose", async () => cpuMonitoring.stop());

  fastify.register(apiRoutes, { prefix: "/api/v1/", cpuMonitoring });

  return fastify;
}

export type { CpuLoadResponse, DataPoint };
