import { useState } from "react";
import Swal from "sweetalert2";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Button from "../../../shared/components/Button";
import Icon from "../../../shared/components/Icon";

export default function DocumentAiPage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const analyze = async () => {
    if (!file) {
      return;
    }

    setAnalyzing(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setResult({
      type: "이사회 회의록",
      confidence: 96,
      date: "2026-06-24",
      total: 8,
      attended: 7,
      rate: 87.5,
      agenda: "탄소배출 감축 설비 투자 승인",
    });
    setAnalyzing(false);
  };

  const apply = () => Swal.fire({
    icon: "success",
    title: "ESG 초안 반영 완료",
    text: "추출값이 검토 중(DRAFT) 데이터로 생성되었습니다.",
    confirmButtonColor: "#1f6b46",
  });

  return (
    <div className="page-stack">
      <PageHeader
        breadcrumbs={["데이터 관리", "문서·AI 분석"]}
        eyebrow="DOCUMENT EXTRACTION"
        title="증빙문서 등록·AI 분석"
        description="정형화하기 어려운 회의록과 증빙문서에서 검토용 값을 추출합니다. 추출값은 담당자 확인 후 반영합니다."
      />

      <div className="two-cols">
        <Card title="문서 업로드">
          <label className="upload-zone">
            <input
              type="file"
              accept=".pdf,.xlsx,.xls"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
            <Icon name="upload" size={30} />
            <strong>{file?.name || "파일을 선택하거나 이곳에 드래그하세요."}</strong>
            <span>이사회 회의록, 안전보고서, 전력 고지서</span>
          </label>
          <Button className="full" disabled={!file || analyzing} onClick={analyze}>
            <Icon name="ai" size={17} />
            {analyzing ? "문서 분석 중" : "AI 문서 분석"}
          </Button>
        </Card>

        <Card title="분석 상태">
          {!result ? (
            <div className="empty-state">
              <strong>{analyzing ? "분석 중" : "분석 대기"}</strong>
              <p>문서를 등록하면 추출 결과가 표시됩니다.</p>
            </div>
          ) : (
            <div className="analysis-status">
              <article><span>문서 유형</span><strong>{result.type}</strong></article>
              <article><span>신뢰도</span><strong>{result.confidence}%</strong></article>
              <article><span>상태</span><strong className="success-text">담당자 검토 필요</strong></article>
            </div>
          )}
        </Card>
      </div>

      {result && (
        <Card title="AI 추출 결과" description="AI 추출값은 공식 데이터가 아니며 담당자 검토 후 DRAFT로 반영됩니다.">
          <div className="detail-grid three">
            {[
              ["회의일", result.date],
              ["전체 이사", `${result.total}명`],
              ["참석 이사", `${result.attended}명`],
              ["참석률", `${result.rate}%`],
              ["ESG 안건", result.agenda],
              ["검증 결과", "담당자 확인 필요"],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <div className="card-actions">
            <Button onClick={apply}>ESG 데이터 초안으로 반영</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
