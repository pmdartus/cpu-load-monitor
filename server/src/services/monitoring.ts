import os from "node:os";

export interface DataPoint {
  /** Unix timestamp in millisecond. */
  ts: number;
  /** Sample value at the timestamp. */
  value: number;
}

export interface MonitoringServiceConfig {
  /** The sample rate in millisecond. Defaults to 1 second. */
  interval?: number;
  /** The maximum number of samples to store. Defaults to 10K data points. */
  bufferSize?: number;
}

export interface GetDataOptions {
  /** The start of the time range to query. */
  since?: number;
}

export interface MonitoringService {
  /** Starts the monitoring service. */
  start(): void;

  /** Stops the monitoring service. */
  stop(): void;

  /**
   * Returns the load data points within the specified time range. If no time range is specified, it
   * returns all the data points.
   */
  getData(options?: GetDataOptions): DataPoint[];
}

const DEFAULT_SAMPLING_INTERVAL = 10_000; // 10 seconds
const DEFAULT_BUFFER_SIZE = 100;

export class CpuMonitoringService implements MonitoringService {
  #buffer: DataPoint[] = [];

  #cpuCount = os.cpus().length;
  #config: Required<MonitoringServiceConfig>;
  #intervalId: NodeJS.Timeout | undefined;

  constructor(config: MonitoringServiceConfig = {}) {
    this.#config = {
      interval: DEFAULT_SAMPLING_INTERVAL,
      bufferSize: DEFAULT_BUFFER_SIZE,
      ...config,
    };
  }

  #collectSample() {
    const ts = Date.now();

    // Calculate the average load per logical CPU core.
    const [avgLoad] = os.loadavg();
    const value = avgLoad / this.#cpuCount;

    this.#buffer.push({ ts, value });

    // Keep the buffer size in check.
    if (this.#buffer.length > this.#config.bufferSize) {
      this.#buffer.shift();
    }
  }

  start(): void {
    // Prevent starting the sampler multiple times.
    if (this.#intervalId !== undefined) {
      console.warn("Sampler is already running");
      return;
    }

    // Collect the first sample immediately and start polling at the interval.
    this.#collectSample();
    this.#intervalId = setInterval(
      () => this.#collectSample(),
      this.#config.interval,
    );
  }

  stop(): void {
    clearInterval(this.#intervalId);
    this.#intervalId = undefined;
  }

  getData(options: GetDataOptions = {}): DataPoint[] {
    const { since = 0 } = options;
    return this.#buffer.filter((entry) => entry.ts >= since);
  }
}
