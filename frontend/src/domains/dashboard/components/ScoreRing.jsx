export default function ScoreRing({ score }) {
  const numeric = Math.max(0, Math.min(100, Number(score || 0)));
  return <div className="score-ring" style={{ "--score": `${numeric * 3.6}deg` }}><div><strong>{Number(score || 0).toFixed(1)}</strong><span>/ 100</span></div></div>;
}
