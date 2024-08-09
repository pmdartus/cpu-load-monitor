import { CpuLoadResponse, DataPoint } from "@monitoring/server";

export enum AlertType {
  HighCpuLoad = "HighCpuLoad",
  Recovered = "Recovered",
}

export interface Alert {
  /** Unique identifier of the alert. */
  id: string;
  /** Type of the alert. */
  type: AlertType;
  /** Unix timestamp in millisecond when the alert occurred. */
  ts: number;
}

export interface FetchOptions {
  /** The start of the time range to query. */
  since?: number;
  /** The signal to abort the request. */
  signal?: AbortSignal;
}

export type CpuLoadFetcher = (
  options?: FetchOptions,
) => Promise<CpuLoadResponse>;

export type { CpuLoadResponse, DataPoint };
