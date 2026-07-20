import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Button from "../../../shared/components/Button";
import Icon from "../../../shared/components/Icon";
import { fileApi } from "../../../shared/api/fileApi";
import companyApi from "../../company/api/companyApi";
import { documentApi } from "../api/documentApi";
import { metricApi } from "../../metric/api/metricApi";
import { apiErrorMessage } from "../../../shared/utils/esgFormat";
import { tokenStorage } from "../../../shared/auth/tokenStorage";
import "../../../styles/metricform.css"; // 👈 [수정] 누락되었던 스타일 파일 명시적 임포트 추가

export default function DocumentAiPage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    Promise.all([
      companyApi.getFacilities(),
      metricApi.getIndicators()
    ])
      .then(([facRes, indRes]) => {
        setFacilities(facRes?.data?.data || facRes?.data || []);
        setIndicators(Array.isArray(indRes) ? indRes : []);
      })
      .catch(() => {
        setFacilities([]);
        setIndicators([]);
      });

    try {
      const token = tokenStorage.getAccessToken();
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        setUserRole(payload?.role || payload?.roles || payload?.auth || "");
      }
    } catch (e) {
      setUserRole("");
    }
  }, []);

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const uploadResponse = await fileApi.upload(file);
      const fileUrl = uploadResponse.data?.data?.fileUrl || uploadResponse.data?.fileUrl;
      const analysis = await documentApi.helper(fileUrl);
      const hq = facilities.find((facility) => facility.facility_type === "HQ") || facilities;
      
      setResult({
        indicatorId: analysis?.indicatorId || "",
        facilityId: analysis?.facilityId || hq?.id || "",
        reportingYear: analysis?.reportingYear || new Date().getFullYear(),
        periodType: "MONTHLY",
        periodValue: analysis?.periodValue || new Date().getMonth() + 1,
        value: analysis?.value !== undefined && analysis?.value !== null ? String(analysis.value) : "",
        textValue: analysis?.textValue || analysis?.aiExplanation || "",
        type: analysis?.type || "분석 문서",
        confidence: analysis?.confidence || 100,
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
      const payload = {
        indicatorId: Number(result.indicatorId),
        facilityId: result.facilityId ? Number(result.facilityId) : null,
        reportingYear: Number(result.reportingYear),
        periodType: result.periodType,
        periodValue: Number(result.periodValue),
        value: result.value !== "" ? Number(result.value) : null,
        textValue: result.textValue,
        evidenceFileUrl: result.fileUrl,
        submitForApproval
      };
      const response = await documentApi.submit(payload);
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
        <Card title="AI 추출 결과 최종 검토" description={userRole === "COMPANY_MANAGER" ? "AI 결과를 확인·수정한 후 임시저장하거나 승인 요청합니다." : "AI가 매핑한 추출 결과를 검토합니다. (읽기 전용)"}>
          {/* ⭕ [구조 변경]: 수동 등록 폼 CSS 컴포넌트와 완벽히 격리 연동되도록 하이퍼 래퍼 컴포넌트 추가 */}
          <div className="card-internal-wrapper">
            <div className="form-grid">
              <div className="form-group">
                <label>매핑된 ESG 지표 *</label>
                <select value={result.indicatorId} onChange={(event) => update("indicatorId", event.target.value)} disabled={userRole !== "COMPANY_MANAGER"} required>
                  <option value="">지표 자동 매핑 실패 시 선택</option>
                  {indicators.map(ind => (
                    <option key={ind.id} value={ind.id}>[{ind.category}] {ind.title} ({ind.unit})</option>
                  ))}
                </select>
              </div>
              <div className="form-group"><label>사업장</label><select value={result.facilityId || ""} onChange={(event) => update("facilityId", Number(event.target.value))} disabled={userRole !== "COMPANY_MANAGER"}><option value="">사업장 선택</option>{facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.facility_name}</option>)}</select></div>
              <div className="form-group"><label>기준연도</label><select value={result.reportingYear} onChange={(event) => update("reportingYear", Number(event.target.value))} disabled={userRole !== "COMPANY_MANAGER"}><option value={2026}>2026년</option><option value={2025}>2025년</option></select></div>
              <div className="form-group"><label>기준월</label><select value={result.periodValue} onChange={(event) => update("periodValue", Number(event.target.value))} disabled={userRole !== "COMPANY_MANAGER"}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}월</option>)}</select></div>
              <div className="form-group"><label>정량 수치 (숫자)</label><input type="number" step="any" value={result.value} onChange={(event) => update("value", event.target.value)} readOnly={userRole !== "COMPANY_MANAGER"} placeholder="추출된 수치 데이터가 표시됩니다." /></div>
              <div className="form-group form-span-2"><label>AI 분석 요약 / 정성 내용</label><textarea value={result.textValue} onChange={(event) => update("textValue", event.target.value)} readOnly={userRole !== "COMPANY_MANAGER"} rows={5} placeholder="문서 요약 및 정성적 분석 내용이 표시됩니다." /></div>
            </div>
          </div>
          <div className="card-actions">
            {/* COMPANY_MANAGER 권한을 가진 사용자에게만 버튼 노출 */}
            {userRole === 'COMPANY_MANAGER' && (
              <>
                <Button variant="outline" disabled={submitting} onClick={() => submit(false)}>
                  임시저장
                </Button>
                <Button disabled={submitting} onClick={() => submit(true)}>
                  ESG 데이터 승인 요청
                </Button>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
