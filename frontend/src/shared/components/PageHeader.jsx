export default function PageHeader({ eyebrow, title, description, actions, breadcrumbs = [] }) {
  return (
    <div className="page-header">
      <div>
        {breadcrumbs.length > 0 && <div className="breadcrumbs">{breadcrumbs.map((item, i) => <span key={item}>{i > 0 && "›"}{item}</span>)}</div>}
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}
