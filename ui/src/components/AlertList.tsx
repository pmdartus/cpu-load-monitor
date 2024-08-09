import { Alert } from "../services/types";

import "./AlertList.css";

const ALERT_MAPPING = {
  HighCpuLoad: {
    label: "High CPU Load",
    isError: true,
  },
  Recovered: {
    label: "Recovered from High CPU Load",
    isError: false,
  },
};

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  timeStyle: "medium",
});

export interface AlertListProps {
  items: Alert[];
}

export function AlertList({ items }: AlertListProps) {
  const reversedList = [...items].reverse();

  return (
    <div className="alert-list">
      <h2>Alerts</h2>
      {reversedList.length === 0 ? (
        <p className="alert-list__empty">No alerts to show.</p>
      ) : (
        <ol>
          {reversedList.map((item) => (
            <AlertListItem key={item.id} alert={item} />
          ))}
        </ol>
      )}
    </div>
  );
}

function AlertListItem({ alert }: { alert: Alert }) {
  const { ts, type } = alert;

  const { label, isError } = ALERT_MAPPING[type];

  const tsDate = new Date(ts);

  const dateIsoString = tsDate.toISOString();
  const dateFormatted = DATE_FORMAT.format(tsDate);

  return (
    <li
      className={`alert-list-item alert-list-item__${isError ? "error" : "ok"}`}
    >
      <strong>
        <time dateTime={dateIsoString}>{dateFormatted}</time>
      </strong>
      &nbsp;-&nbsp; Alert triggered: <strong>{label}</strong>
    </li>
  );
}
