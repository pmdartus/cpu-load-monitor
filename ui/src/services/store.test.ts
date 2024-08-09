import { beforeEach, describe, expect, it } from "vitest";

import { AlertType } from "./types";
import { createMonitoringStore, BoundMonitoringStore } from "./store";

const LOW_CPU_LOAD = 0.3;
const HIGH_CPU_LOAD = 1.2;

const MINUTE_MS = 60 * 1000;

let store: BoundMonitoringStore;

beforeEach(() => {
  store = createMonitoringStore();
});

describe("ingestData", () => {
  it("shouldn't produce alerts if all entries are below the threshold", () => {
    store.getState().ingestData([
      { ts: 0, value: LOW_CPU_LOAD },
      { ts: 1 * MINUTE_MS, value: LOW_CPU_LOAD },
      { ts: 2 * MINUTE_MS, value: LOW_CPU_LOAD },
      { ts: 3 * MINUTE_MS, value: LOW_CPU_LOAD },
    ]);

    const { alerts } = store.getState();
    expect(alerts).toEqual([]);
  });

  it("should produce an alert if the CPU load is high for more than 2 minutes", () => {
    store.getState().ingestData([
      { ts: 0, value: HIGH_CPU_LOAD },
      { ts: 1 * MINUTE_MS, value: HIGH_CPU_LOAD },
      { ts: 2 * MINUTE_MS, value: HIGH_CPU_LOAD },
      { ts: 3 * MINUTE_MS, value: HIGH_CPU_LOAD },
    ]);

    const { alerts } = store.getState();
    expect(alerts).toEqual([
      {
        id: expect.any(String),
        ts: 2 * MINUTE_MS,
        type: AlertType.HighCpuLoad,
      },
    ]);
  });

  it("should a single high load alert if the CPU load is high for more than 2 minutes", () => {
    for (let i = 0; i < 10; i++) {
      store
        .getState()
        .ingestData([{ ts: i * MINUTE_MS, value: HIGH_CPU_LOAD }]);
    }

    const { alerts } = store.getState();
    expect(alerts).toEqual([
      {
        id: expect.any(String),
        ts: 2 * MINUTE_MS,
        type: AlertType.HighCpuLoad,
      },
    ]);
  });

  it("should produce an high load alert followed by a recovery alert if CPU load drops for 2 minutes", () => {
    store.getState().ingestData([
      { ts: 0, value: HIGH_CPU_LOAD },
      { ts: 1 * MINUTE_MS, value: HIGH_CPU_LOAD },
      { ts: 2 * MINUTE_MS, value: HIGH_CPU_LOAD },
      { ts: 3 * MINUTE_MS, value: LOW_CPU_LOAD },
      { ts: 4 * MINUTE_MS, value: LOW_CPU_LOAD },
      { ts: 5 * MINUTE_MS, value: LOW_CPU_LOAD },
      { ts: 6 * MINUTE_MS, value: LOW_CPU_LOAD },
    ]);

    const { alerts } = store.getState();
    expect(alerts).toEqual([
      {
        id: expect.any(String),
        ts: 2 * MINUTE_MS,
        type: AlertType.HighCpuLoad,
      },
      {
        id: expect.any(String),
        ts: 5 * MINUTE_MS,
        type: AlertType.Recovered,
      },
    ]);
  });

  it("should only preserve 10 minutes of data", () => {
    for (let i = 0; i < 20; i++) {
      store.getState().ingestData([{ ts: i * MINUTE_MS, value: LOW_CPU_LOAD }]);
    }

    const { data } = store.getState();
    expect(data).toHaveLength(10);
  });

  it("should throw an error if new data is older than the last entry", () => {
    store.getState().ingestData([{ ts: 0, value: LOW_CPU_LOAD }]);

    expect(() => {
      store.getState().ingestData([{ ts: 0, value: LOW_CPU_LOAD }]);
    }).toThrowError("Data must be sorted by timestamp in ascending order");
  });

  it("shouldn't throw an error when ingesting an empty array", () => {
    expect(() => {
      store.getState().ingestData([]);
    }).not.toThrow();
  });
});
