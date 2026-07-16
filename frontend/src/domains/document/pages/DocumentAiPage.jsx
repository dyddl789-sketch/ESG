import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Button from "../../../shared/components/Button";
import Icon from "../../../shared/components/Icon";
import { fileApi } from "../../../shared/api/fileApi";
import companyApi from "../../company/api/companyApi";
import { documentApi } from "../api/documentApi";
import { apiErrorMessage } from "../../../shared/utils/esgFormat";

export default function DocumentAiPage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    companyApi.getFacilities()
      .then((response) => setFacilities(response?.data || []))
      .catch(() => setFacilities([]));
  }, []);

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const uploadResponse = await fileApi.upload(file);
      const fileUrl = uploadResponse.data?.data?.fileUrl || uploadResponse.data?.fileUrl;
      const analysis = await documentApi.helper(fileUrl);
      const hq = facilities.find((facility) => facility.facility_type === "HQ") || facilities[0];
      setResult({
        ...analysis,
        facilityId: analysis?.facilityId || hq?.id || "",
        reportingYear: analysis?.reportingYear || 2026,
        periodType: "MONTHLY",
        periodValue: analysis?.periodValue || 6,
        fileUrl,
      });
    } catch (error) {
      Swal.fire("분석 실패", apiErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  const submit = async (submitForApproval) => {
    if (!result) return;
    setSubmitting(true);
    try {
      const response = await documentApi.submit({ ...result, submitForApproval });
      await Swal.fire(
        submitForApproval ? "승인 요청 완료" : "임시저장 완료",
        response?.message || "문서 분석 결과가 ESG 데이터로 등록되었습니다.",
        "success",
      );
      setResult(null);
      setFile(null);
    } catch (error) {
      Swal.fire("등록 실패", apiErrorMessage(error), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const update = (key, value) => setResult((current) => ({ ...current, [key]: value }));

  return (
    <div className="page-stack">
      <PageHeader
        breadcrumbs={["데이터 관리", "문서·AI 분석"]}
        eyebrow="DOCUMENT AI"
        title="증빙문서 등록·AI 분석"
        description="PDF·Excel·Word 문서에서 ESG 핵심 항목을 추출하고 담당자가 최종 검토합니다."
      />

      <div className="two-cols">
        <Card title="문서 업로드">
          <label className="upload-zone">
            <input
              type="file"
              accept=".pdf,.xlsx,.xls,.docx,.txt,.csv"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              disabled={loading}
            />
            <Icon name="upload" size={30} />
            <strong>{file?.name || "분석할 문서를 선택하세요."}</strong>
            <span>이사회 회의록, 안전보고서, 전력 고지서</span>
          </label>
          <Button className="full" disabled={!file || loading} onClick={analyze}>
            <Icon name="ai" size={17} /> {loading ? "문서 분석 진행 중..." : "AI 분석 실행"}
          </Button>
        </Card>

        <Card title="분석 상태">
          {!result ? (
            <div className="empty-state"><strong>{loading ? "문서 분석 중" : "분석 대기"}</strong><p>{loading ? "문서 본문을 읽고 ESG 핵심값을 추출하고 있습니다." : "문서를 등록하면 추출 결과가 표시됩니다."}</p></div>
          ) : (
            <div className="analysis-status">
              <article><span>문서 유형</span><strong>{result.type}</strong></article>
              <article><span>신뢰도</span><strong>{Number(result.confidence || 0).toFixed(0)}%</strong></article>
              <article><span>상태</span><strong className="success-text">분석 완료</strong></article>
            </div>
          )}
        </Card>
      </div>

      {result && (
        <Card title="AI 추출 결과 최종 검토" description="AI 결과를 확인·수정한 후 임시저장하거나 승인 요청합니다.">
          <div className="form-grid">
            <div className="form-group"><label>사업장</label><select value={result.facilityId || ""} onChange={(event) => update("facilityId", Number(event.target.value))}><option value="">사업장 선택</option>{facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.facility_name}</option>)}</select></div>
            <div className="form-group"><label>기준연도</label><select value={result.reportingYear} onChange={(event) => update("reportingYear", Number(event.target.value))}><option value={2026}>2026년</option><option value={2025}>2025년</option></select></div>
            <div className="form-group"><label>기준월</label><select value={result.periodValue} onChange={(event) => update("periodValue", Number(event.target.value))}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}월</option>)}</select></div>
            <div className="form-group"><label>문서일자</label><input value={result.date || ""} onChange={(event) => update("date", event.target.value)} /></div>
            <div className="form-group"><label>전체 이사</label><input type="number" value={result.total ?? 0} onChange={(event) => update("total", Number(event.target.value))} /></div>
            <div className="form-group"><label>참석 이사</label><input type="number" value={result.attended ?? 0} onChange={(event) => update("attended", Number(event.target.value))} /></div>
            <div className="form-group"><label>참석률</label><input type="number" step="0.1" value={result.rate ?? 0} onChange={(event) => update("rate", Number(event.target.value))} /></div>
            <div className="form-group form-span-2"><label>핵심 ESG 안건</label><input value={result.agenda || ""} onChange={(event) => update("agenda", event.target.value)} /></div>
            <div className="form-group form-span-2"><label>AI 분석 요약</label><textarea value={result.aiExplanation || ""} onChange={(event) => update("aiExplanation", event.target.value)} /></div>
          </div>
          <div className="card-actions">
            <Button variant="outline" disabled={submitting} onClick={() => submit(false)}>임시저장</Button>
            <Button disabled={submitting} onClick={() => submit(true)}>ESG 데이터 승인 요청</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
