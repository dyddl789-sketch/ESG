export default function ScoreRing({ score }) { return <div className="score-ring" style={{ "--score": `${score * 3.6}deg` }}><div><strong>{score}</strong><span>종합 점수</span></div></div>; }
