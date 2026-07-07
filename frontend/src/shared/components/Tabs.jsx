export default function Tabs({ items, value, onChange }) {
  return <div className="tabs">{items.map((item) => <button key={item.value} className={value === item.value ? "active" : ""} onClick={() => onChange(item.value)} type="button">{item.label}{item.count !== undefined && <b>{item.count}</b>}</button>)}</div>;
}
