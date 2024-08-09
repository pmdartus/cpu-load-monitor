import { vi, describe, it, expect, beforeAll, afterAll } from "vitest";
import { renderHook } from "@testing-library/react";

import { useRefresh } from "./useRefresh";

describe("useRefresh", () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it("should call the callback immediately", () => {
    const callback = vi.fn();
    const interval = 1000;

    renderHook(() => useRefresh(callback, interval));
    expect(callback).toHaveBeenCalledTimes;
  });

  it("should call the callback every interval", async () => {
    const callback = vi.fn();
    const interval = 100;

    renderHook(() => useRefresh(callback, interval));
    expect(callback).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(200);
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it("should keep invoking the callback even if it throws an error", async () => {
    const callback = vi.fn(() => {
      throw new Error("Test error");
    });
    const interval = 100;

    renderHook(() => useRefresh(callback, interval));
    expect(callback).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(200);
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it("shouldn't call the callback after unmount", async () => {
    const callback = vi.fn();
    const interval = 100;

    const { unmount } = renderHook(() => useRefresh(callback, interval));
    expect(callback).toHaveBeenCalledTimes(1);

    unmount();
    vi.advanceTimersByTime(200);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should wait for callback to finish before calling it again", async () => {
    const callback = vi.fn(
      () => new Promise<void>((resolve) => setTimeout(resolve, 100))
    );
    const interval = 100;

    renderHook(() => useRefresh(callback, interval));
    expect(callback).toHaveBeenCalledTimes(1);

    // Wait for the callback timeout to be invoked first and then advance the timer.
    const start = Date.now();
    await vi.advanceTimersToNextTimerAsync();
    await vi.advanceTimersToNextTimerAsync();
    const end = Date.now();

    expect(callback).toHaveBeenCalledTimes(2);
    expect(end - start).toBeGreaterThanOrEqual(200);
  });

  it("returns the current refresh state", async () => {
    const callback = vi.fn(
      () => new Promise<void>((resolve) => setTimeout(resolve, 100))
    );
    const interval = 100;

    const { result } = renderHook(() => useRefresh(callback, interval));
    expect(result.current).toEqual({ isRefreshing: true });
  });

  it("passes an AbortSignal to the callback", async () => {
    const callback = vi.fn();
    const interval = 100;

    renderHook(() => useRefresh(callback, interval));

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith({ signal: expect.any(AbortSignal) });
  });

  it("aborts the callback when unmounting", async () => {
    const abortCallback = vi.fn();
    const interval = 100;

    const { unmount } = renderHook(() =>
      useRefresh(({ signal }) => {
        signal.addEventListener("abort", abortCallback);
      }, interval)
    );
    expect(abortCallback).toHaveBeenCalledTimes(0);

    unmount();
    expect(abortCallback).toHaveBeenCalledTimes(1);
  });
});
