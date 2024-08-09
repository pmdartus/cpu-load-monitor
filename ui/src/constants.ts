/**
 * The threshold to consider the CPU load as high.
 */
export const HIGH_CPU_THRESHOLD = 1;

/**
 * The duration to wait before considering the CPU load has been high for a sustained period.
 */
export const HIGH_CPU_DURATION_MS = 2 * 60 * 1000; // 2 minutes

/**
 * The duration to wait before considering the CPU load has recovered after it has dropped below
 * the threshold.
 */
export const RECOVERY_DURATION_MS = 2 * 60 * 1000; // 2 minutes

/**
 * The maximum window duration to consider for monitoring.
 */
export const MAX_WINDOW_DURATION_MS = 10 * 60 * 1000; // 10 minutes

/**
 * The interval to refresh the CPU load data.
 */
export const REFRESH_INTERVAL_MS = 10_000; // 10 seconds
