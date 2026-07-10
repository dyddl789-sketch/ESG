import { useState } from "react";
import Button from "../../../shared/components/Button";
import { adminModalStyles, adminColors } from "../components/adminStyles";
import { AdminInput, AdminSelect } from "../components/AdminUI";

const CATEGORIES = [
  { value: "ENVIRONMENT", label: "환경 (E)" },
  { value: "SOCIAL", label: "사회 (S)" },
  { value: "GOVERNANCE", label: "거버넌스 (G)" },
];

const VALUE_TYPES = [
  { value: "QUANTITATIVE", label: "정량" },
  { value: "QUALITATIVE", label: "정성" },
];

export default function IndicatorFormModal({ indicator, onClose, onSave }) {
  const isEdit = !!indicator?.id;
  const [formData, setFormData] = useState(
    indicator || {
      category: "ENVIRONMENT",
      sub_category: "",
      indicator_code: "",
      title: "",
      value_type: "QUANTITATIVE",
      description: "",
      unit: "",
      is_active: true,
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
    <div style={adminModalStyles.overlay} onClick={onClose}>
      <div style={adminModalStyles.content} onClick={(e) => e.stopPropagation()}>
        <div style={adminModalStyles.header}>
          <h2 style={adminModalStyles.title}>{isEdit ? "지표 수정" : "지표 등록"}</h2>
          <button style={adminModalStyles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={adminModalStyles.body}>
            <div style={adminModalStyles.fieldGrid}>
              <div style={adminModalStyles.field}>
                <label style={adminModalStyles.label}>
                  영역 <span style={{ color: adminColors.danger }}>*</span>
                </label>
                <AdminSelect name="category" value={formData.category} onChange={handleChange}>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </AdminSelect>
              </div>
              <div style={adminModalStyles.field}>
                <label style={adminModalStyles.label}>
                  유형 <span style={{ color: adminColors.danger }}>*</span>
                </label>
                <AdminSelect name="value_type" value={formData.value_type} onChange={handleChange}>
                  {VALUE_TYPES.map((v) => (
                    <option key={v.value} value={v.value}>{v.label}</option>
                  ))}
                </AdminSelect>
              </div>
            </div>

            <div style={adminModalStyles.fieldGrid}>
              <div style={adminModalStyles.field}>
                <label style={adminModalStyles.label}>
                  지표 코드 <span style={{ color: adminColors.danger }}>*</span>
                </label>
                <AdminInput
                  name="indicator_code"
                  value={formData.indicator_code || ""}
                  onChange={handleChange}
                  placeholder="예: IND_E_ELEC"
                  required
                  disabled={isEdit}
                />
              </div>
              <div style={adminModalStyles.field}>
                <label style={adminModalStyles.label}>
                  세부 분류 <span style={{ color: adminColors.danger }}>*</span>
                </label>
                <AdminInput
                  name="sub_category"
                  value={formData.sub_category || ""}
                  onChange={handleChange}
                  placeholder="예: 에너지, 산업안전"
                  required
                />
              </div>
            </div>

            <div style={adminModalStyles.field}>
              <label style={adminModalStyles.label}>
                지표명 <span style={{ color: adminColors.danger }}>*</span>
              </label>
              <AdminInput
                name="title"
                value={formData.title || ""}
                onChange={handleChange}
                placeholder="예: 전력 사용량"
                required
              />
            </div>

            <div style={adminModalStyles.fieldGrid}>
              <div style={adminModalStyles.field}>
                <label style={adminModalStyles.label}>단위</label>
                <AdminInput
                  name="unit"
                  value={formData.unit || ""}
                  onChange={handleChange}
                  placeholder="예: kWh, %"
                />
              </div>
              {isEdit && (
                <div style={adminModalStyles.field}>
                  <label style={adminModalStyles.label}>상태</label>
                  <AdminSelect
                    value={formData.is_active ? "true" : "false"}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, is_active: e.target.value === "true" }))
                    }
                  >
                    <option value="true">사용</option>
                    <option value="false">중지</option>
                  </AdminSelect>
                </div>
              )}
            </div>

            <div style={adminModalStyles.field}>
              <label style={adminModalStyles.label}>설명</label>
              <textarea
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                rows={3}
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: `1px solid ${adminColors.border}`,
                  fontSize: "0.95rem",
                  outline: "none",
                  width: "100%",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />
            </div>
          </div>

          <div style={adminModalStyles.footer}>
            <Button variant="secondary" onClick={onClose} style={{ minWidth: "80px" }}>
              취소
            </Button>
            <Button
              type="submit"
              style={{
                backgroundColor: adminColors.primary,
                borderColor: adminColors.primary,
                minWidth: "100px",
                fontWeight: "600",
              }}
            >
              {isEdit ? "변경사항 저장" : "지표 등록 완료"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}