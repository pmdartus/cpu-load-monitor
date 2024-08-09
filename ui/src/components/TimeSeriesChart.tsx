import { useEffect, useRef } from "react";

import {
  Chart,
  ChartOptions,
  Colors,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  TimeSeriesScale,
  Tooltip,
} from "chart.js";
import "chartjs-adapter-date-fns";
import annotationPlugin, { AnnotationOptions } from "chartjs-plugin-annotation";

import { AlertType, Alert, DataPoint } from "../services/types";

import "./TimeSeriesChart.css";

export interface TimeSeriesChartProps {
  data: DataPoint[];
  alerts: Alert[];
  threshold: number;
}

// Register the necessary components for the Line chart. Using this approach allows us to
// reduce the bundle size by ~60Kb.
Chart.register([
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeSeriesScale,
  
  Colors,
  Tooltip,

  annotationPlugin,
]);

const THRESHOLD_LINE_COLOR = "#ff6384";
const ALERT_ERROR_COLOR = "#ff6384";
const ALERT_OK_COLOR = "#4cc0c0";

// https://www.chartjs.org/docs/latest/configuration/
const CHART_DEFAULT_OPTIONS: ChartOptions = {
  animation: false,
  maintainAspectRatio: false,
  scales: {
    x: {
      type: "time",
      time: {
        unit: "minute",
      },
    },
    y: {
      beginAtZero: true,
      suggestedMax: 1,
      title: {
        display: true,
        text: "Average CPU Load",
      },
      ticks: {
        maxTicksLimit: 8,
        callback: (tickValue) => `${Math.round((tickValue as number) * 100)}%`,
      },
    },
  },
  plugins: {
    legend: {
      display: false,
    },
  },
};

export function TimeSeriesChart({
  data,
  alerts,
  threshold,
}: TimeSeriesChartProps) {
  const containerRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    chartRef.current = new Chart(containerRef.current!, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            data: [],
            label: "CPU Load",
          },
        ],
      },
      options: {
        ...CHART_DEFAULT_OPTIONS,
        plugins: {
          ...CHART_DEFAULT_OPTIONS.plugins,
          annotation: {
            annotations: [],
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    const { current: chart } = chartRef;
    if (!chart) {
      return;
    }

    // Update chart data
    const timestamps = data.map((d) => d.ts);
    const values = data.map((d) => d.value);
    chart.data.labels = timestamps;
    chart.data.datasets[0].data = values;

    // Horizontal line annotation for the threshold
    const thresholdAnnotation: AnnotationOptions = {
      type: "line",
      scaleID: "y",
      value: threshold,
      borderColor: THRESHOLD_LINE_COLOR,
    };

    // Point annotations for the alerts. We only show alerts that are within the current
    // visible range of the chart.
    const alertAnnotations = alerts
      .filter(
        (alert) =>
          alert.ts > (timestamps[0] ?? 0) &&
          alert.ts <= (timestamps.at(-1) ?? 0)
      )
      .map((alert): AnnotationOptions => {
        return {
          type: "point",
          xValue: alert.ts,
          yValue: 0,
          pointStyle: "triangle",
          backgroundColor:
            alert.type === AlertType.HighCpuLoad ? ALERT_ERROR_COLOR : ALERT_OK_COLOR,
        };
      });

    chart.options.plugins!.annotation!.annotations = [
      thresholdAnnotation,
      ...alertAnnotations,
    ];

    // Trigger Chart.js to re-render
    chart.update();
  }, [data, alerts, threshold]);

  return (
    <div className="time-series-chart__container">
      <canvas ref={containerRef} />
    </div>
  );
}
