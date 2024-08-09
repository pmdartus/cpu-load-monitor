import { useEffect, useRef, useState } from "react";

type RefreshCallback = (options: { signal: AbortSignal }) => void | Promise<void>;

interface UseRefreshState {
  /** Indicates whether the callback is currently being invoked. */
  isRefreshing: boolean;
}

/**
 * Custom hook that invokes a callback function at a regular interval. This hook is designed to 
 * handle the case where the callback function takes a long time to complete (eg. fetching data) as
 * it waits for the callback to finish before calling it again.
 * 
 * @param callback - The callback function to invoke at a regular interval.
 * @param interval - The interval in milliseconds at which to invoke the callback.
 * @returns An object containing the current refresh state.
 */
export function useRefresh(
  callback: RefreshCallback,
  interval: number
): UseRefreshState {
  const callbackRef = useRef(callback);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, interval]);

  useEffect(() => {
    const controller = new AbortController();
    let timeoutId: number | NodeJS.Timeout;

    (async function refresh() {
      const { signal } = controller;

      try {
        setIsRefreshing(true);

        const result = callbackRef.current({ signal });
        if (result instanceof Promise) {
          await result;
        }
      } catch {
        // Ignore errors.
      } finally {
        setIsRefreshing(false);

        if (!controller.signal.aborted) {
          timeoutId = setTimeout(refresh, interval);
        }
      }
    })();

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [interval]);

  return { isRefreshing };
}
