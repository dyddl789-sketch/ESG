import { Line, Bar } from "react-chartjs-2";

const valuesOf = (data) => data.flatMap((dataset) => dataset.data).filter((value) => Number.isFinite(Number(value))).map(Number);

export default function DomainTrendChart({ type = "line", labels, datasets, unit = "", lowerIsBetter = false, height = 300 }) {
  const values = valuesOf(datasets);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 100;
  const padding = Math.max((max - min) * 0.18, max * 0.04, 1);
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 10, usePointStyle: true } },
      tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${Number(context.raw).toLocaleString("ko-KR", { maximumFractionDigits: 3 })}${unit ? ` ${unit}` : ""}` } },
    },
    scales: {
      y: { suggestedMin: Math.max(0, min - padding), suggestedMax: max + padding, grid: { color: "#edf1ef" }, title: { display: Boolean(unit), text: unit } },
      x: { grid: { display: false } },
    },
  };
  const data = { labels, datasets };
  return <div className="domain-chart" style={{ height }}>{type === "bar" ? <Bar data={data} options={{ ...options, indexAxis: labels.length > 5 ? "y" : "x" }} /> : <Line data={data} options={options} />}<small className="chart-direction-note">{lowerIsBetter ? "낮을수록 개선되는 지표입니다." : "승인 완료 데이터만 표시합니다."}</small></div>;
}
