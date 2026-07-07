export default function Card({ title, description, action, children, className = "" }) {
  return (
    <section className={`card ${className}`.trim()}>
      {(title || action) && <header className="card-head"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</header>}
      {children}
    </section>
  );
}
