import { create } from "zustand";

import { Alert, AlertType, DataPoint } from "./types";
import {
  HIGH_CPU_DURATION_MS,
  HIGH_CPU_THRESHOLD,
  MAX_WINDOW_DURATION_MS,
  RECOVERY_DURATION_MS,
} from "../constants";

export interface MonitoringState {
  /** The data points that have been ingested so far sorted by timestamp in ascending order. */
  data: DataPoint[];
  /** The alerts that have been generated based on the ingested */
  alerts: Alert[];
  /** Whether the CPU is currently under load. */
  isCpuUnderLoad: boolean;
  /** The timestamp when the CPU load started to be high. */
  highCpuStart: number | undefined;
  /** The timestamp when the CPU load started to recover. */
  recoveryStart: number | undefined;
}

export interface MonitoringActions {
  /**
   * Ingests new data points and updates the store state. This method expects the data points to be
   * sorted by timestamp in ascending order.
   */
  ingestData(data: DataPoint[]): void;
}

export type MonitoringStore = MonitoringState & MonitoringActions;
export type BoundMonitoringStore = ReturnType<typeof createMonitoringStore>;

const INITIAL_STATE: MonitoringState = {
  data: [],
  alerts: [],
  isCpuUnderLoad: false,
  highCpuStart: undefined,
  recoveryStart: undefined,
};

export function createMonitoringStore(
  initialState: MonitoringState = INITIAL_STATE,
) {
  return create<MonitoringStore>((set, get) => ({
    ...initialState,
    ingestData(data) {
      const state = get();
      let { isCpuUnderLoad, recoveryStart, highCpuStart } = state;

      // Assert first sample is newer than the last sample in the store.
      const firstSample = data[0];
      const lastSample = state.data.at(-1);
      if (firstSample && lastSample && firstSample.ts <= lastSample.ts) {
        throw new Error("Data must be sorted by timestamp in ascending order");
      }

      // Generate alerts based on the ingested data.
      const alerts: Alert[] = [];
      for (const sample of data) {
        if (sample.value >= HIGH_CPU_THRESHOLD) {
          recoveryStart = undefined;
          highCpuStart ??= sample.ts;

          if (
            !isCpuUnderLoad &&
            sample.ts - highCpuStart >= HIGH_CPU_DURATION_MS
          ) {
            isCpuUnderLoad = true;

            const alert = createAlert(AlertType.HighCpuLoad, sample.ts);
            alerts.push(alert);
          }
        } else {
          highCpuStart = undefined;
          recoveryStart ??= sample.ts;

          if (
            isCpuUnderLoad &&
            sample.ts - recoveryStart >= RECOVERY_DURATION_MS
          ) {
            isCpuUnderLoad = false;

            const alert = createAlert(AlertType.Recovered, sample.ts);
            alerts.push(alert);
          }
        }
      }

      const mergedData = mergeData(state.data, data);

      set({
        isCpuUnderLoad,
        highCpuStart,
        recoveryStart,
        data: mergedData,
        alerts: [...state.alerts, ...alerts],
      });
    },
  }));
}

/** Store instance. */
export const useMonitoringStore = createMonitoringStore();

function mergeData(
  currentDataPoints: DataPoint[],
  newDataPoints: DataPoint[],
): DataPoint[] {
  const mostRecentTs =
    newDataPoints.at(-1)?.ts ?? currentDataPoints.at(-1)?.ts ?? 0;
  const oldestAllowedTs = mostRecentTs - MAX_WINDOW_DURATION_MS;

  return [...currentDataPoints, ...newDataPoints].filter(
    (d) => d.ts > oldestAllowedTs,
  );
}

function createAlert(type: AlertType, ts: number): Alert {
  // Using a combination of type and timestamp as the alert ID as it is guaranteed to be unique.
  return {
    id: `${type}-${ts}`,
    ts,
    type,
  };
}
