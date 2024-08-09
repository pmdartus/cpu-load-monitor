import { CpuLoadResponse, DataPoint, FetchOptions } from "./types";

const MOCK_NETWORK_LATENCY_MS = 500;

const MOCK_CPU_INTERVAL_MS = 10_000; // 10 seconds
const MOCK_CYCLE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

const LOW_CPU_VALUE = 0.3;
const HIGH_CPU_VALUE = 1.4;

/**
 * Generate mock CPU load data. This function should only be used for development purposes only.
 * Alternates between low and high CPU load values every 5 minutes.
 */
export async function fetchCpuData(
  options?: FetchOptions
): Promise<CpuLoadResponse> {
  const since = options?.since ?? Date.now() - 60 * 10_000;
  const to = Date.now();

  options?.signal?.throwIfAborted();

  const data: DataPoint[] = [];
  for (let current = since; current <= to; current += MOCK_CPU_INTERVAL_MS) {
    const normalized =
      (current % MOCK_CYCLE_DURATION_MS) / MOCK_CYCLE_DURATION_MS;

    data.push({
      ts: current,
      value: normalized < 0.5 ? LOW_CPU_VALUE : HIGH_CPU_VALUE,
    });
  }

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        options?.signal?.throwIfAborted();
        resolve({ data });
      } catch (error) {
        reject(error);
      }
    }, MOCK_NETWORK_LATENCY_MS);
  });
}
