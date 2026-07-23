import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom"; 
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import { metricApi } from "../api/metricApi";
import { fileApi } from "../../../shared/api/fileApi"; 
import companyApi from "../../company/api/companyApi";
import Swal from "sweetalert2";
import "../../../styles/metricform.css"; 
import { useEsgData } from "../../../app/providers/EsgDataProvider"; 

export default function MetricFormPage() {
  const { metricId } = useParams(); 
  const isEditMode = !!metricId;    
  const navigate = useNavigate();

  const { refreshMetrics } = useEsgData();
  const [loading, setLoading] = useState(isEditMode); 
  const [uploading, setUploading] = useState(false);
  const [indicators, setIndicators] = useState([]);
  const [facilities, setFacilities] = useState([]);

  const [formData, setFormData] = useState({
    indicatorId: "",
    facilityId: "",
    reportingYear: new Date().getFullYear(),
    periodType: "MONTHLY",
    periodValue: new Date().getMonth() + 1,
    value: "",
    shipmentAmount: "",
    textValue: "",
    evidenceFileUrl: "",
    evidenceOriginalFilename: "",
    evidenceContentType: "",
    evidenceFileSize: null,
    evidenceUploadedAt: null
  });

  const selectedIndicator = indicators.find((indicator) => String(indicator.id) === String(formData.indicatorId));
  const isElectricityMetric = selectedIndicator?.indicatorCode === "IND_E_ELEC";
  const isCompanyWideGovernance = ["IND_G_ATTENDANCE", "IND_G_OUTSIDE"].includes(selectedIndicator?.indicatorCode);
  const requiresFacility = Boolean(selectedIndicator) && !isCompanyWideGovernance;
  const evidenceLabel = isCompanyWideGovernance ? "기업 거버넌스 증빙 PDF 첨부" : "사업장 ESG 증빙 PDF 첨부";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [indRes, facRes] = await Promise.all([
          metricApi.getIndicators(),
          companyApi.getFacilities()
        ]);
        
        const fetchedIndicators = Array.isArray(indRes) ? indRes : [];
        const fetchedFacilities = facRes.data?.data || facRes.data || [];

        setIndicators(fetchedIndicators);
        setFacilities(fetchedFacilities);

        if (isEditMode) {
          const d = await metricApi.detail(metricId); 

          if (!d) {
            console.warn("백엔드 상세 데이터(d)를 불러오지 못했습니다.");
            return;
          }

          const targetIndicator = fetchedIndicators.find(
            ind => String(ind.indicatorCode || ind.code).trim() === String(d.indicatorCode || "").trim()
          );
          const matchedIndicatorId = d.indicatorId
            ? String(d.indicatorId)
            : targetIndicator ? String(targetIndicator.id) : "";

          const targetFacility = fetchedFacilities.find(
            fac => String(fac.facility_name || fac.name).trim() === String(d.facility || "").trim()
          );
          const matchedFacilityId = d.facilityId
            ? String(d.facilityId)
            : targetFacility ? String(targetFacility.id) : "";

          // 정량 수치 BigDecimal 객체 직렬화 예외 파싱
          let extractedValue = "";
          const rawValue = d.value !== undefined && d.value !== null ? d.value : (d.numericalValue !== undefined ? d.numericalValue : d.numerical_value);
          if (rawValue !== null && rawValue !== undefined) {
            extractedValue = typeof rawValue === "object" ? (rawValue.value ?? "") : rawValue;
          }

          setFormData({
            indicatorId: matchedIndicatorId, 
            facilityId: matchedFacilityId, 
            reportingYear: Number(d.year || new Date().getFullYear()),
            periodType: String(d.periodType || "MONTHLY"),
            periodValue: d.periodValue !== undefined ? Number(d.periodValue) : 1,
            value: extractedValue !== "" ? String(extractedValue) : "",
            shipmentAmount: d.shipmentAmountMillionKrw !== null && d.shipmentAmountMillionKrw !== undefined ? String(d.shipmentAmountMillionKrw) : "",
            textValue: d.textValue || "",
            evidenceFileUrl: d.evidence || d.evidenceFileUrl || "",
            evidenceOriginalFilename: d.evidenceOriginalFilename || "",
            evidenceContentType: d.evidenceContentType || "",
            evidenceFileSize: d.evidenceFileSize ?? null,
            evidenceUploadedAt: d.evidenceUploadedAt || null
          });
        }
      } catch (err) {
        console.error("데이터 로드 실패:", err);
        Swal.fire("오류", "기초 정보 또는 기존 데이터를 불러오지 못했습니다.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [metricId, isEditMode]);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0] || null;
    if (!selectedFile) return;

    setUploading(true);
    try {
      const response = await fileApi.upload(selectedFile);
      const uploadData = response.data?.data || response.data || {};
      const uploadedUrl = uploadData.fileUrl;

      setFormData(prev => ({
        ...prev,
        evidenceFileUrl: uploadedUrl,
        evidenceOriginalFilename: uploadData.originalFilename || selectedFile.name,
        evidenceContentType: uploadData.contentType || selectedFile.type || "application/pdf",
        evidenceFileSize: uploadData.size ?? selectedFile.size,
        evidenceUploadedAt: uploadData.uploadedAt || new Date().toISOString()
      }));

      Swal.fire("알림", "증빙 자료가 서버에 안전하게 업로드되었습니다.", "success");
    } catch (err) {
      console.error("증빙 자료 업로드 실패:", err);
      Swal.fire("오류", "파일 업로드에 실패했습니다.", "error");
    } finally {
      setUploading(false);
    }
  };


  const handleEvidenceAction = async (mode) => {
    if (!formData.evidenceFileUrl) return;
    try {
      if (mode === "open") await fileApi.open(formData.evidenceFileUrl);
      else await fileApi.download(formData.evidenceFileUrl);
    } catch (error) {
      console.error("증빙 파일 열기 실패:", error);
      Swal.fire("오류", "증빙 파일을 불러오지 못했습니다.", "error");
    }
  };

  const handlePeriodTypeChange = (e) => {
    const type = e.target.value;
    let val = 1;
    if (type === "MONTHLY") val = new Date().getMonth() + 1;
    
    setFormData(prev => ({
      ...prev,
      periodType: type,
      periodValue: val
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const next = {
        ...prev,
        [name]: type === "checkbox" ? checked : value
      };
      if (name === "indicatorId") {
        const nextIndicator = indicators.find((indicator) => String(indicator.id) === String(value));
        if (nextIndicator?.indicatorCode !== "IND_E_ELEC") next.shipmentAmount = "";
        if (["IND_G_ATTENDANCE", "IND_G_OUTSIDE"].includes(nextIndicator?.indicatorCode)) next.facilityId = "";
      }
      return next;
    });
  };

  const handleProcessSubmit = async (isApprovalClick = false) => {
    if (!formData.indicatorId) return Swal.fire("알림", "지표를 선택해주세요.", "warning");
    if (requiresFacility && !formData.facilityId) return Swal.fire("알림", "해당 지표를 측정한 사업장을 선택해주세요.", "warning");
    if (isElectricityMetric && (!formData.shipmentAmount || Number(formData.shipmentAmount) <= 0)) return Swal.fire("알림", "전력 사용량 등록 시 출하액(백만원)을 입력해주세요.", "warning");
    if (!formData.evidenceFileUrl) return Swal.fire("알림", `${evidenceLabel}가 필요합니다.`, "warning");

    setLoading(true);
    
    const payload = {
      ...formData,
      indicatorId: Number(formData.indicatorId),
      facilityId: isCompanyWideGovernance ? null : (formData.facilityId ? Number(formData.facilityId) : null),
      reportingYear: Number(formData.reportingYear),
      periodValue: Number(formData.periodValue),
      value: formData.value !== "" ? Number(formData.value) : null,
      shipmentAmount: isElectricityMetric && formData.shipmentAmount !== "" ? Number(formData.shipmentAmount) : null,
      evidenceOriginalFilename: formData.evidenceFileUrl ? formData.evidenceOriginalFilename : null,
      evidenceContentType: formData.evidenceFileUrl ? formData.evidenceContentType : null,
      evidenceFileSize: formData.evidenceFileUrl ? formData.evidenceFileSize : null,
      evidenceUploadedAt: formData.evidenceFileUrl ? formData.evidenceUploadedAt : null,
      submitForApproval: isApprovalClick
    };

    try {
      if (isEditMode) {
        await metricApi.update(Number(metricId), payload);
      } else {
        await metricApi.create(payload);
      }

      await Swal.fire({
        title: "처리 완료",
        text: isApprovalClick ? "등록값과 PDF 증빙이 승인 요청 상태로 처리되었습니다." : "데이터 내용이 작성 중 상태로 저장되었습니다.",
        icon: "success",
        confirmButtonColor: "#1f6b46"
      });

      if (refreshMetrics) {
        refreshMetrics();
      }

      navigate("/manager/metrics");
    } catch (err) {
      console.error("데이터 저장 실패:", err);
      Swal.fire("오류", isEditMode ? "데이터 수정 등록에 실패했습니다." : "신규 데이터 등록에 실패했습니다.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="page-stack"><p style={{ padding: "40px", textAlign: "center" }}>ESG 데이터를 처리하는 중입니다...</p></div>;
  }

  return (
    <div className="page-stack">
      <PageHeader
        breadcrumbs={["ESG 데이터", "지표 데이터 관리", isEditMode ? "실적 수정" : "신규 등록"]}
        title={isEditMode ? "ESG 데이터 실적 수정" : "ESG 데이터 신규 등록"}
        description={isEditMode ? "임시 저장되거나 반려된 데이터를 보완하여 수정 기록을 갱신합니다." : "정량 수치 또는 정성 내용을 입력하여 ESG 지표 데이터를 등록합니다."}
      />

      <form onSubmit={(e) => e.preventDefault()}>
        <div className="two-cols">
          
          <Card title={isEditMode ? "기본 정보 수정" : "기본 정보 입력"}>
            <div className="card-internal-wrapper">
              <div className="form-grid">
                <div className="form-group">
                  <label>ESG 지표 *</label>
                  <select name="indicatorId" value={formData.indicatorId} onChange={handleChange} required>
                    <option value="">지표 선택</option>
                    {indicators.map(ind => (
                      <option key={ind.id} value={ind.id}>
                        [{ind.category}] {ind.title} ({ind.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>사업장 {requiresFacility ? "*" : ""}</label>
                  <select name="facilityId" value={formData.facilityId} onChange={handleChange} disabled={isCompanyWideGovernance} required={requiresFacility}>
                    <option value="">{isCompanyWideGovernance ? "전체 · 기업 기준" : "사업장을 선택하세요"}</option>
                    {facilities.map(fac => (
                      <option key={fac.id} value={fac.id}>{fac.facility_name || fac.name}</option>
                    ))}
                  </select>
                  {isCompanyWideGovernance && <small>이사회 참석률과 사외이사 비율은 등록 단계부터 기업 공통 데이터로 저장됩니다.</small>}
                  {selectedIndicator?.indicatorCode === "IND_G_ETHICS_EDU" && <small>윤리교육 이수율은 선택한 사업장에만 등록되며 전체 조회 시 사업장 승인값을 통합합니다.</small>}
                </div>

                <div className="form-group">
                  <label>보고 연도 *</label>
                  <input type="number" name="reportingYear" value={formData.reportingYear} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>보고 주기 *</label>
                  <div className="input-group">
                    <select name="periodType" value={formData.periodType} onChange={handlePeriodTypeChange} style={{ width: "40%" }}>
                      <option value="MONTHLY">월별</option>
                      <option value="QUARTERLY">분기별</option>
                      <option value="YEARLY">연별</option>
                    </select>
                    
                    {formData.periodType === "MONTHLY" && (
                      <select name="periodValue" value={formData.periodValue} onChange={handleChange} style={{ width: "60%" }}>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                          <option key={m} value={m}>{m}월</option>
                        ))}
                      </select>
                    )}

                    {formData.periodType === "QUARTERLY" && (
                      <select name="periodValue" value={formData.periodValue} onChange={handleChange} style={{ width: "60%" }}>
                        {[1, 2, 3, 4].map(q => (
                          <option key={q} value={q}>{q}분기</option>
                        ))}
                      </select>
                    )}

                    {formData.periodType === "YEARLY" && (
                      <select name="periodValue" value={1} disabled style={{ width: "60%" }}>
                        <option value={1}>연간</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 카드 2: 데이터 입력 및 증빙 자료 입력 */}
          <Card title="데이터 및 증빙 자료 입력">
            <div className="card-internal-wrapper">
              <div className="form-grid">
                <div className="form-group">
                  <label>정량 수치 (숫자)</label>
                  <input
                    type="number"
                    step="any"
                    name="value"
                    value={formData.value}
                    onChange={handleChange}
                    placeholder="수치 데이터가 있는 경우 입력"
                  />
                </div>

                {isElectricityMetric && (
                  <div className="form-group shipment-input-group">
                    <label>출하액 (백만원) *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      name="shipmentAmount"
                      value={formData.shipmentAmount}
                      onChange={handleChange}
                      placeholder="같은 사업장·기준월의 출하액"
                      required
                    />
                    <small>전력 원단위 계산에 사용되며 전력 사용량과 동일한 승인 상태로 처리됩니다.</small>
                  </div>
                )}

                <div className="form-group">
                  <label>정성 내용 / 비고</label>
                  <textarea
                    name="textValue"
                    value={formData.textValue}
                    onChange={handleChange}
                    rows={6}
                    placeholder="추가 설명이나 정성적 내용을 입력하세요."
                  />
                </div>

                {/* 증빙자료 파일 업로드 및 원본 한글파일명 복원 다운로드 흐름 완비 */}
                <div className="form-group" style={{ marginTop: "15px", borderTop: "1px dashed #eee", paddingTop: "15px" }}>
                  <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>
                    {evidenceLabel} *
                  </label>
                  <input 
                    type="file" 
                    accept="application/pdf,.pdf" 
                    onChange={handleFileChange} 
                    disabled={uploading || loading}
                    style={{ fontSize: "14px", width: "100%" }}
                  />
                  {uploading && <p style={{ fontSize: "12px", color: "#2563eb", marginTop: "5px" }}>파일을 서버에 업로드하고 있습니다...</p>}
                  
                  {formData.evidenceFileUrl && (() => {
                    const fileName = formData.evidenceOriginalFilename || formData.evidenceFileUrl.split("/").pop();

                    return (
                      <div style={{ marginTop: "12px", padding: "10px 14px", background: "#f4fcf7", borderRadius: "6px", border: "1px solid #e1f5e9", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                        <span style={{ fontSize: "14px", color: "#1f6b46" }}>✅ 업로드 완료: <strong>{fileName}</strong></span>
                        <button
                          type="button"
                          className="btn-platform btn-platform-draft"
                          onClick={() => handleEvidenceAction("open")}
                        >
                          증빙 미리보기
                        </button>
                      </div>
                    );
                  })()}
                </div>

              </div>
            </div>
          </Card>
        </div>

        {/* 하단 최종 조작 버튼 배치 영역 (임시저장 / 즉시 승인 요청) */}
        <div className="form-actions">
          <button 
            type="button" 
            className="btn-platform btn-platform-cancel"
            onClick={() => navigate(-1)} 
            disabled={loading || uploading}
          >
            취소
          </button>
          
          <button 
            type="button" 
            className="btn-platform btn-platform-draft"
            style={{ marginRight: "10px", background: "#f3f4f6", color: "#4b5563", border: "1px solid #d1d5db" }}
            disabled={loading || uploading}
            onClick={() => handleProcessSubmit(false)}
          >
            임시 저장
          </button>

          <button 
            type="button" 
            className="btn-platform btn-platform-save"
            disabled={loading || uploading}
            onClick={() => handleProcessSubmit(true)}
          >
            {loading ? "처리 중..." : "즉시 승인 요청"}
          </button>
        </div>
      </form>
    </div>
  );
}
