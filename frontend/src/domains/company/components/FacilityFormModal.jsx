import React, { useState } from "react";
import Button from "../../../shared/components/Button";
import { COLORS, FONT_SIZE, RADIUS } from "./companyStyles";
import { CustomInput, CustomSelect } from "./CompanyUI";

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0, 0, 0, 0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
  backdropFilter: "blur(2px)",
};

const contentStyle = {
  backgroundColor: COLORS.white,
  width: "600px",
  borderRadius: RADIUS.lg,
  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

const headerStyle = {
  padding: "20px 24px",
  borderBottom: `1px solid ${COLORS.border}`,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  backgroundColor: COLORS.white,
};

const titleStyle = {
  margin: 0,
  fontSize: FONT_SIZE.xl,
  fontWeight: "700",
  color: COLORS.textPrimary,
};

const closeBtnStyle = {
  background: "none",
  border: "none",
  fontSize: "24px",
  cursor: "pointer",
  color: COLORS.textSecondary,
  lineHeight: 1,
  padding: "4px",
  borderRadius: RADIUS.sm,
  transition: "background-color 0.2s",
};

const footerStyle = {
  padding: "16px 24px",
  borderTop: `1px solid ${COLORS.border}`,
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
  backgroundColor: COLORS.bgHover,
};

const formGridStyle = {
  padding: "24px",
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px 24px",
};

export default function FacilityFormModal({ facility, onClose, onSave }) {
  const isEdit = !!facility?.id;
  const [formData, setFormData] = useState(
    facility || {
      facility_name: "",
      facility_type: "공장",
      address: "",
      contract_power_kw: 0,
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>{isEdit ? "사업장 정보 수정" : "신규 사업장 등록"}</h2>
          <button 
            style={closeBtnStyle} 
            onClick={onClose}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.bgHover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={formGridStyle}>
            <div style={{ gridColumn: "span 2" }}>
              <CustomInput
                label="사업장명"
                name="facility_name"
                value={formData.facility_name || ""}
                onChange={handleChange}
                placeholder="사업장 이름을 입력하세요"
                required
              />
            </div>
            
            <CustomSelect
              label="사업장 유형"
              name="facility_type"
              value={formData.facility_type || ""}
              onChange={handleChange}
              required
              options={[
                { value: "본사", label: "본사" },
                { value: "공장", label: "공장" },
                { value: "사무실", label: "사무실" },
                { value: "창고", label: "창고" },
                { value: "기타", label: "기타" },
              ]}
            />

            <CustomInput
              label="한전 계약전력 (kW)"
              type="number"
              name="contract_power_kw"
              value={formData.contract_power_kw || 0}
              onChange={handleChange}
              placeholder="0"
              required
            />

            <div style={{ gridColumn: "span 2" }}>
              <CustomInput
                label="주소"
                name="address"
                value={formData.address || ""}
                onChange={handleChange}
                placeholder="사업장 소재지 주소를 입력하세요"
                required
              />
            </div>
          </div>

          <div style={{ padding: "0 24px 24px", fontSize: FONT_SIZE.xs, color: COLORS.textSecondary }}>
            <span style={{ color: COLORS.danger }}>*</span> 표시는 필수 입력 항목입니다.
          </div>

          <div style={footerStyle}>
            <Button variant="secondary" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" style={{ backgroundColor: COLORS.primary }}>
              {isEdit ? "변경사항 저장" : "사업장 등록 완료"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
