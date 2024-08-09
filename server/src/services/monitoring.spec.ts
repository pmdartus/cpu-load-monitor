import { describe, it, vi, beforeEach, afterEach, expect } from "vitest";

import { CpuMonitoringService } from "./monitoring.js";

vi.mock("node:os", () => {
  return {
    default: {
      cpus: vi.fn(() => [{}, {}]),
      loadavg: vi.fn(() => [0.5, 0.5, 0.5]),
    },
  };
});

describe("CpuMonitoringService", () => {
  let sampler: CpuMonitoringService;

  beforeEach(() => {
    // Use fake timers to speed up the test and make it predictable.
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Stop the sampler to avoid leaking timers.
    sampler?.stop();
    // Restore the real timers once the test is done.
    vi.useRealTimers();
  });

  it("should collect cpu load when started", () => {
    sampler = new CpuMonitoringService();
    sampler.start();

    const data = sampler.getData();
    expect(data).toHaveLength(1);
    expect(data[0].value).toBe(0.25);
  });

  it("should collect cpu load at regular intervals", () => {
    sampler = new CpuMonitoringService({ interval: 100 });

    sampler.start();
    expect(sampler.getData()).toHaveLength(1);

    vi.advanceTimersByTime(200);
    expect(sampler.getData()).toHaveLength(3);
  });

  it("should stop collecting data when stopped", () => {
    sampler = new CpuMonitoringService({ interval: 100 });

    sampler.start();
    expect(sampler.getData()).toHaveLength(1);

    sampler.stop();
    vi.advanceTimersByTime(200);
    expect(sampler.getData()).toHaveLength(1);
  });

  it("should discard old entries from the buffer when reaching its max size", () => {
    sampler = new CpuMonitoringService({
      interval: 100,
      bufferSize: 3,
    });

    sampler.start();
    const { ts: oldestTs } = sampler.getData()[0];

    // Advance time by 300ms to fill the buffer.
    vi.advanceTimersByTime(300);

    const buffer = sampler.getData();
    expect(buffer).toHaveLength(3);
    expect(buffer[0].ts).toBeGreaterThan(oldestTs);
  });

  it("should return data points since a given timestamp", () => {
    sampler = new CpuMonitoringService({ interval: 100 });

    sampler.start();
    vi.advanceTimersByTime(200);

    const since = Date.now() - 100;
    const data = sampler.getData({ since });

    expect(data).toHaveLength(2);
    expect(data[0].ts).toBeGreaterThanOrEqual(since);
  });
});
