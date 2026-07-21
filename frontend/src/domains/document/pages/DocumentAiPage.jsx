import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { ROLES } from "../../../app/config/roles";
import { useAuth } from "../../../app/providers/AuthProvider";
import { fileApi } from "../../../shared/api/fileApi";
import Button from "../../../shared/components/Button";
import Card from "../../../shared/components/Card";
import Icon from "../../../shared/components/Icon";
import PageHeader from "../../../shared/components/PageHeader";
import { apiErrorMessage } from "../../../shared/utils/esgFormat";
import companyApi from "../../company/api/companyApi";
import { metricApi } from "../../metric/api/metricApi";
import { useMetricPeriods } from "../../metric/hooks/useMetricPeriods";
import { documentApi } from "../api/documentApi";
import "../../../styles/metricform.css";


const numberOrNull = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function DocumentAiPage() {
  const { user } = useAuth();
  const canEdit = user?.role === ROLES.COMPANY_MANAGER;

  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { years: dataYears } = useMetricPeriods();
  const yearOptions = useMemo(() => [...new Set([
    Number(result?.reportingYear),
    new Date().getFullYear(),
    ...dataYears,
  ].filter(Number.isInteger))].sort((left, right) => right - left), [dataYears, result?.reportingYear]);

  useEffect(() => {
    let active = true;

    Promise.all([companyApi.getFacilities(), metricApi.getIndicators()])
      .then(([facilityResponse, indicatorResponse]) => {
        if (!active) return;
        setFacilities(facilityResponse?.data?.data || facilityResponse?.data || []);
        setIndicators(Array.isArray(indicatorResponse) ? indicatorResponse : []);
      })
      .catch(() => {
        if (!active) return;
        setFacilities([]);
        setIndicators([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const selectedIndicator = useMemo(
    () => indicators.find((indicator) => String(indicator.id) === String(result?.indicatorId)),
    [indicators, result?.indicatorId],
  );

  const isElectricityDocument = selectedIndicator?.indicatorCode === "IND_E_ELEC";
  const isScope2Document = selectedIndicator?.indicatorCode === "IND_E_SCOPE2";

  const isAttendanceDocument = selectedIndicator?.indicatorCode === "IND_G_ATTENDANCE";

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const uploadResponse = await fileApi.upload(file);
      const fileUrl = uploadResponse.data?.data?.fileUrl || uploadResponse.data?.fileUrl;
      const analysis = await documentApi.helper(fileUrl);
      const headquarters = facilities.find((facility) => facility.facility_type === "HQ") || facilities[0];

      setResult({
        indicatorId: analysis?.indicatorId || "",
        facilityId: analysis?.facilityId || headquarters?.id || "",
        reportingYear: analysis?.reportingYear || new Date().getFullYear(),
        periodType: analysis?.periodType || "MONTHLY",
        periodValue: analysis?.periodValue || new Date().getMonth() + 1,
        value: analysis?.value ?? analysis?.rate ?? "",
        textValue: analysis?.textValue || analysis?.aiExplanation || "",
        type: analysis?.type || "분석 문서",
        detectedCategory: analysis?.detectedCategory || "",
        confidence: analysis?.confidence || 0,
        date: analysis?.date || "",
        total: analysis?.total ?? 0,
        attended: analysis?.attended ?? 0,
        rate: analysis?.rate ?? "",
        electricityUsageKwh: analysis?.electricityUsageKwh ?? "",
        shipmentAmountMillionKrw: analysis?.shipmentAmountMillionKrw ?? "",
        agenda: analysis?.agenda || "",
        aiExplanation: analysis?.aiExplanation || analysis?.textValue || "",
        fileUrl,
      });
    } catch (error) {
      Swal.fire("분석 실패", apiErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  const update = (key, value) => {
    setResult((current) => {
      if (!current) return current;
      const next = { ...current, [key]: value };

      if (key === "indicatorId") {
        const indicator = indicators.find((item) => String(item.id) === String(value));
        if (indicator?.indicatorCode === "IND_E_ELEC") {
          next.detectedCategory = "ENVIRONMENT";
          if (next.electricityUsageKwh === "" && next.value !== "") {
            next.electricityUsageKwh = next.value;
          }
        } else {
          next.detectedCategory = indicator?.category || next.detectedCategory;
        }
      }

      if (key === "electricityUsageKwh") {
        next.value = value;
      }
      if (key === "rate" && isAttendanceDocument) {
        next.value = value;
      }
      if (key === "textValue") {
        next.aiExplanation = value;
      }
      return next;
    });
  };

  const submit = async (submitForApproval) => {
    if (!result || !canEdit) return;
    if (!result.indicatorId) {
      await Swal.fire("확인 필요", "등록할 ESG 지표를 선택해 주세요.", "warning");
      return;
    }
    if (isElectricityDocument) {
      if (Number(result.electricityUsageKwh) <= 0) {
        await Swal.fire("확인 필요", "전력 사용량(kWh)을 입력해 주세요.", "warning");
        return;
      }
      if (Number(result.shipmentAmountMillionKrw) <= 0) {
        await Swal.fire("확인 필요", "출하액(백만원)을 입력해 주세요.", "warning");
        return;
      }
      if (!result.facilityId) {
        await Swal.fire("확인 필요", "전력·출하액을 등록할 사업장을 선택해 주세요.", "warning");
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        indicatorId: Number(result.indicatorId),
        facilityId: result.facilityId ? Number(result.facilityId) : null,
        reportingYear: Number(result.reportingYear),
        periodType: result.periodType || "MONTHLY",
        periodValue: Number(result.periodValue),
        value: isElectricityDocument
          ? numberOrNull(result.electricityUsageKwh)
          : numberOrNull(result.value),
        textValue: result.textValue || result.aiExplanation || "",
        detectedCategory: result.detectedCategory,
        date: result.date,
        total: numberOrNull(result.total),
        attended: numberOrNull(result.attended),
        rate: numberOrNull(result.rate),
        electricityUsageKwh: numberOrNull(result.electricityUsageKwh),
        shipmentAmountMillionKrw: numberOrNull(result.shipmentAmountMillionKrw),
        agenda: result.agenda,
        aiExplanation: result.aiExplanation || result.textValue || "",
        fileUrl: result.fileUrl,
        submitForApproval,
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

  return (
    <div className="page-stack">
      <PageHeader
        breadcrumbs={["데이터 관리", "문서·AI 분석"]}
        eyebrow="DOCUMENT AI"
        title="증빙문서 등록·AI 분석"
        description="PDF·Excel·Word 문서에서 ESG 지표와 전력 사용량·출하액을 추출하고 담당자가 최종 검토합니다."
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
            <span>전력 고지서·출하 실적, 이사회 회의록, 안전·교육·인사 증빙</span>
          </label>
          <Button className="full" disabled={!file || loading} onClick={analyze}>
            <Icon name="ai" size={17} /> {loading ? "문서 분석 진행 중..." : "AI 분석 실행"}
          </Button>
        </Card>

        <Card title="분석 상태">
          {!result ? (
            <div className="empty-state">
              <strong>{loading ? "문서 분석 중" : "분석 대기"}</strong>
              <p>{loading ? "문서 본문을 읽고 ESG 핵심값을 추출하고 있습니다." : "문서를 등록하면 추출 결과가 표시됩니다."}</p>
            </div>
          ) : (
            <div className="analysis-status">
              <article><span>문서 유형</span><strong>{result.type}</strong></article>
              <article><span>매핑 지표</span><strong>{selectedIndicator?.title || "담당자 확인 필요"}</strong></article>
              <article><span>신뢰도</span><strong>{Number(result.confidence || 0).toFixed(0)}%</strong></article>
              <article><span>상태</span><strong className="success-text">분석 완료</strong></article>
            </div>
          )}
        </Card>
      </div>

      {result && (
        <Card
          title="AI 추출 결과 최종 검토"
          description={canEdit
            ? "AI 결과를 확인·수정한 후 임시저장하거나 승인 요청합니다."
            : "AI가 매핑한 추출 결과를 검토합니다. 시스템 관리자는 읽기 전용입니다."}
        >
          <div className="card-internal-wrapper document-ai-review">
            <div className="form-grid">
              <div className="form-group form-span-2">
                <label>매핑된 ESG 지표 *</label>
                <select
                  value={result.indicatorId}
                  onChange={(event) => update("indicatorId", event.target.value)}
                  disabled={!canEdit}
                  required
                >
                  <option value="">지표 자동 매핑 실패 시 선택</option>
                  {indicators.map((indicator) => (
                    <option key={indicator.id} value={indicator.id}>
                      [{indicator.category}] {indicator.title} ({indicator.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>사업장</label>
                <select
                  value={result.facilityId || ""}
                  onChange={(event) => update("facilityId", event.target.value)}
                  disabled={!canEdit}
                >
                  <option value="">본사 공통 또는 사업장 선택</option>
                  {facilities.map((facility) => (
                    <option key={facility.id} value={facility.id}>{facility.facility_name || facility.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>문서일자</label>
                <input
                  type="date"
                  value={result.date || ""}
                  onChange={(event) => update("date", event.target.value)}
                  readOnly={!canEdit}
                />
              </div>

              <div className="form-group">
                <label>기준연도</label>
                <select
                  value={result.reportingYear}
                  onChange={(event) => update("reportingYear", Number(event.target.value))}
                  disabled={!canEdit}
                >
                  {yearOptions.map((year) => <option key={year} value={year}>{year}년</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>기준월</label>
                <select
                  value={result.periodValue}
                  onChange={(event) => update("periodValue", Number(event.target.value))}
                  disabled={!canEdit}
                >
                  {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                    <option key={month} value={month}>{month}월</option>
                  ))}
                </select>
              </div>

              {isElectricityDocument ? (
                <>
                  <div className="form-group">
                    <label>전력 사용량 (kWh) *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={result.electricityUsageKwh ?? ""}
                      onChange={(event) => update("electricityUsageKwh", event.target.value)}
                      readOnly={!canEdit}
                    />
                  </div>
                  <div className="form-group shipment-input-group">
                    <label>출하액 (백만원) *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={result.shipmentAmountMillionKrw ?? ""}
                      onChange={(event) => update("shipmentAmountMillionKrw", event.target.value)}
                      readOnly={!canEdit}
                    />
                    <small>전력·탄소 원단위 계산에 사용되며 전력 사용량과 동일한 승인 상태로 저장됩니다.</small>
                  </div>
                </>
              ) : (
                <div className="form-group form-span-2">
                  <label>
                    정량 수치{selectedIndicator?.unit ? ` (${selectedIndicator.unit})` : ""}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={result.value ?? ""}
                    onChange={(event) => update("value", event.target.value)}
                    readOnly={!canEdit}
                    placeholder="AI가 추출한 지표 수치"
                  />
                </div>
              )}

              {isScope2Document && Number(result.shipmentAmountMillionKrw || 0) > 0 && (
                <div className="form-group form-span-2 shipment-input-group">
                  <label>AI 추출 출하액 (백만원, 참고)</label>
                  <input
                    type="number"
                    value={result.shipmentAmountMillionKrw}
                    readOnly
                  />
                  <small>현재 등록 지표는 Scope 2입니다. 출하액은 원문 확인용으로 표시하며, 전력 사용량 데이터 등록 시 활동자료로 저장합니다.</small>
                </div>
              )}

              {isAttendanceDocument && (
                <>
                  <div className="form-group">
                    <label>전체 이사</label>
                    <input type="number" min="0" value={result.total ?? 0} onChange={(event) => update("total", event.target.value)} readOnly={!canEdit} />
                  </div>
                  <div className="form-group">
                    <label>참석 이사</label>
                    <input type="number" min="0" value={result.attended ?? 0} onChange={(event) => update("attended", event.target.value)} readOnly={!canEdit} />
                  </div>
                  <div className="form-group">
                    <label>참석률 (%)</label>
                    <input type="number" min="0" max="100" step="0.1" value={result.rate ?? ""} onChange={(event) => update("rate", event.target.value)} readOnly={!canEdit} />
                  </div>
                  <div className="form-group">
                    <label>핵심 ESG 안건</label>
                    <input value={result.agenda || ""} onChange={(event) => update("agenda", event.target.value)} readOnly={!canEdit} />
                  </div>
                </>
              )}

              <div className="form-group form-span-2">
                <label>AI 분석 요약 / 정성 내용</label>
                <textarea
                  value={result.textValue || ""}
                  onChange={(event) => update("textValue", event.target.value)}
                  readOnly={!canEdit}
                  rows={5}
                  placeholder="문서 요약 및 정성 분석 내용"
                />
              </div>
            </div>
          </div>

          <div className="card-actions">
            {canEdit && (
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
