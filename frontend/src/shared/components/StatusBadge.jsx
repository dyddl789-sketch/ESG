import { STATUS_LABELS } from "../../app/config/status";
export default function StatusBadge({ status, label }) {
  return <span className={`status status-${String(status).toLowerCase()}`}>{label ?? STATUS_LABELS[status] ?? status}</span>;
}
