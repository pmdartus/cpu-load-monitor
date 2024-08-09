import { FastifyPluginAsync } from "fastify";

import { DataPoint, MonitoringService } from "../services/monitoring.js";

interface CpuLoadQuery {
  since?: number;
}

export interface CpuLoadResponse {
  data: DataPoint[];
}

export const DEFAULT_SINCE_OFFSET = 1_000 * 60 * 10; // 10 minutes

export const apiRoutes: FastifyPluginAsync<{
  cpuMonitoring: MonitoringService;
}> = async (fastify, { cpuMonitoring }) => {
  fastify.get<{
    Querystring: CpuLoadQuery;
    Reply: CpuLoadResponse;
  }>(
    "/metrics/cpu-load",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            since: { type: "number" },
          },
        },
      },
    },
    async (request) => {
      const data = cpuMonitoring.getData({
        since: request.query.since ?? Date.now() - DEFAULT_SINCE_OFFSET,
      });

      return { data };
    },
  );
};
