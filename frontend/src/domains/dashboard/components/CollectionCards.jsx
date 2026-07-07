import StatusBadge from "../../../shared/components/StatusBadge";
export default function CollectionCards({ sources }) { return <div className="collection-grid">{sources.map((source) => <article key={source.id}><div><strong>{source.name}</strong><span>{source.description}</span><small>{source.lastRun}</small></div><StatusBadge status={source.status}/></article>)}</div>; }
