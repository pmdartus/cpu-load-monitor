import { CpuLoadResponse, FetchOptions } from "./types";

const API_HOST = import.meta.env.VITE_API_HOST;

/**
 * Fetch CPU load data from API.
 */
export async function fetchCpuData(
  options?: FetchOptions,
): Promise<CpuLoadResponse> {
  let url = `${API_HOST}/api/v1/metrics/cpu-load`;

  if (options?.since) {
    url += `?since=${options.since}`;
  }

  const response = await fetch(url, { signal: options?.signal });
  if (!response.ok) {
    throw new Error(`Failed to fetch CPU load data: ${response.statusText}`);
  }

  return response.json();
}
