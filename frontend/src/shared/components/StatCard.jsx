export default function StatCard({ label, value, helper, tone = "green", icon }) {
  return <article className="stat-card"><span className={`stat-icon tone-${tone}`}>{icon}</span><div><span>{label}</span><strong>{value}</strong>{helper && <small>{helper}</small>}</div></article>;
}
