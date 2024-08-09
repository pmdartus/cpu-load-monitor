import { REFRESH_INTERVAL_MS, HIGH_CPU_THRESHOLD } from "./constants";

import * as apis from "./services/api";
import * as mocks from "./services/mocking";
import { useMonitoringStore } from "./services/store";

import { useRefresh } from "./hooks/useRefresh"; 

import { AlertList } from "./components/AlertList";
import { TimeSeriesChart } from "./components/TimeSeriesChart";

import "./App.css";

// Use mock api responses in dev mode is the `mock-api` search params is passed.
// TODO: Use a more elegant to handle this in the future.
const fetchCpuData =
  import.meta.env.DEV && location.search.includes("mock-api")
    ? mocks.fetchCpuData
    : apis.fetchCpuData;


export function App() {
  const { data, alerts } = useMonitoringStore();

  const { isRefreshing } = useRefresh(async ({ signal }) => {
    const { data, ingestData } = useMonitoringStore.getState();

    try {
      // Get the timestamp of the most recent sample to fetch only new data. Add 1 to the
      // timestamp to avoid fetching the same data point again.
      const mostRecentSample = data.at(-1);
      const since = mostRecentSample ? mostRecentSample.ts + 1 : undefined;

      const response = await fetchCpuData({
        since,
        signal,
      });

      ingestData(response.data);
    } catch (error) {
      // Ignore the error if the fetch request was aborted.
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      // TODO: Handle error properly by displaying an error message to the user.
      console.error("Failed to fetch CPU load data:", error);
    }
  }, REFRESH_INTERVAL_MS);

  return (
    <>
      <header>
        <h1>CPU Monitoring</h1>
        <span className="refresh-indicator">
          {isRefreshing ? "Refreshing..." : null}
        </span>
      </header>

      <main>
        <TimeSeriesChart data={data} alerts={alerts} threshold={HIGH_CPU_THRESHOLD} />
        <AlertList items={alerts} />
      </main>
    </>
  );
}
