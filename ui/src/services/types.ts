import { CpuLoadResponse, DataPoint } from "@monitoring/server";

export enum AlertType {
  HighCpuLoad = "HighCpuLoad",
  Recovered = "Recovered",
}

export interface Alert {
  id: string;
  type: AlertType;
  ts: number;
}

export interface FetchOptions {
  since?: number;
  signal?: AbortSignal;
}

export type CpuLoadFetcher = (
  options?: FetchOptions,
) => Promise<CpuLoadResponse>;

export type { CpuLoadResponse, DataPoint };
