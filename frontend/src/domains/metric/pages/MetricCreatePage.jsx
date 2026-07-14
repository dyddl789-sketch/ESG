import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Button from "../../../shared/components/Button";
import { metricApi } from "../api/metricApi";
import companyApi from "../../company/api/companyApi";
import Swal from "sweetalert2";

export default function MetricCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [indicators, setIndicators] = useState([]);
  const [facilities, setFacilities] = useState([]);

  const [formData, setFormData] = useState({
    indicatorId: "",
    facilityId: "",
    reportingYear: new Date().getFullYear(),
    periodType: "MONTHLY",
    periodValue: new Date().getMonth() + 1,
    value: "",
    textValue: "",
    submitForApproval: false
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [indRes, facRes] = await Promise.all([
          metricApi.getIndicators(),
          companyApi.getFacilities()
        ]);
        // [주의] indRes.data는 배열, facRes.data는 ApiResponse{success, data:[]} 형태
        setIndicators(indRes.data || []);
        setFacilities(facRes.data?.data || []);
      } catch (err) {
        console.error("기초 정보 로드 실패:", err);
        Swal.fire("오류", "지표 또는 사업장 정보를 불러오지 못했습니다.", "error");
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.indicatorId) return Swal.fire("알림", "지표를 선택해주세요.", "warning");

    setLoading(true);
    try {
      await metricApi.create({
        ...formData,
        indicatorId: Number(formData.indicatorId),
        facilityId: formData.facilityId ? Number(formData.facilityId) : null,
        reportingYear: Number(formData.reportingYear),
        periodValue: Number(formData.periodValue),
        value: formData.value !== "" ? Number(formData.value) : null
      });

      await Swal.fire({
        title: "등록 완료",
        text: formData.submitForApproval ? "데이터가 등록되어 승인 요청되었습니다." : "데이터가 임시 저장되었습니다.",
        icon: "success",
        confirmButtonColor: "#1f6b46"
      });
      navigate("/manager/metrics");
    } catch (err) {
      console.error("등록 실패:", err);
      Swal.fire("오류", "데이터 등록에 실패했습니다.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        breadcrumbs={["ESG 데이터", "지표 데이터 관리", "신규 등록"]}
        title="ESG 데이터 신규 등록"
        description="정량 수치 또는 정성 내용을 입력하여 ESG 지표 데이터를 등록합니다."
      />

      <form onSubmit={handleSubmit}>
        <div className="two-cols">
          <Card title="기본 정보">
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
                <label>사업장</label>
                <select name="facilityId" value={formData.facilityId} onChange={handleChange}>
                  <option value="">전체(본사 공통)</option>
                  {facilities.map(fac => (
                    <option key={fac.id} value={fac.id}>{fac.facility_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>보고 연도 *</label>
                <input type="number" name="reportingYear" value={formData.reportingYear} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label>보고 주기 *</label>
                <div className="input-group">
                  <select name="periodType" value={formData.periodType} onChange={handleChange} style={{ width: "40%" }}>
                    <option value="MONTHLY">월별</option>
                    <option value="QUARTERLY">분기별</option>
                    <option value="YEARLY">연별</option>
                  </select>
                  <input
                    type="number"
                    name="periodValue"
                    value={formData.periodValue}
                    onChange={handleChange}
                    placeholder={formData.periodType === "MONTHLY" ? "1~12" : "1~4"}
                    required
                    style={{ width: "60%" }}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card title="데이터 입력">
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

              <div className="form-group">
                <label>정성 내용 / 비고</label>
                <textarea
                  name="textValue"
                  value={formData.textValue}
                  onChange={handleChange}
                  rows={4}
                  placeholder="추가 설명이나 정성적 내용을 입력하세요."
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="submitForApproval"
                    checked={formData.submitForApproval}
                    onChange={handleChange}
                  />
                  등록 즉시 승인 요청 (검토 대기 상태로 전환)
                </label>
              </div>
            </div>
          </Card>
        </div>

        <div className="form-actions" style={{ marginTop: "20px", textAlign: "right", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <Button variant="outline" type="button" onClick={() => navigate(-1)}>취소</Button>
          <Button type="submit" disabled={loading}>
            {loading ? "처리 중..." : formData.submitForApproval ? "등록 및 승인 요청" : "임시 저장"}
          </Button>
        </div>
      </form>
    </div>
  );
}
