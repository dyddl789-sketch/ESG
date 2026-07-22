import { useState } from "react";
import Button from "../../../shared/components/Button";
import {
  overlayStyle,
  contentStyle,
  headerStyle,
  titleStyle,
  closeBtnStyle,
  footerStyle,
  fieldGridStyle,
  fieldStyle,
  labelStyle,
  inputStyle,
} from "./modalStyles";

export default function CompanyEditModal({ company, onClose, onSave }) {
  const [formData, setFormData] = useState({ ...company });
  const [focused, setFocused] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(formData);
  };

  const getInputStyle = (name) => ({
    ...inputStyle,
    borderColor: focused === name ? "#2a7d55" : "#dcdfe3",
    boxShadow: focused === name ? "0 0 0 3px rgba(42,125,85,0.12)" : "none",
  });

  const fields = [
    ["기업명", "name", "text", true],
    ["기업 규모", "scale", "text", false],
    ["사업자등록번호", "business_number", "text", false],
    ["대표자명", "representative", "text", false],
    ["설립일", "founded_on", "date", false],
    ["업태", "business_type", "text", false],
    ["종목", "business_item", "text", false],
    ["대표 전화", "representative_phone", "text", false],
    ["대표 이메일", "representative_email", "email", false],
  ];

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ ...contentStyle, maxWidth: 760 }} onClick={(event) => event.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>기업 기본정보 수정</h2>
          <button type="button" style={closeBtnStyle} onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={fieldGridStyle}>
            {fields.map(([label, name, type, required]) => (
              <div key={name} style={fieldStyle}>
                <label style={labelStyle}>{label}</label>
                <input
                  type={type}
                  name={name}
                  value={formData[name] || ""}
                  onChange={handleChange}
                  onFocus={() => setFocused(name)}
                  onBlur={() => setFocused(null)}
                  required={required}
                  style={getInputStyle(name)}
                />
              </div>
            ))}
            <div style={fieldStyle}>
              <label style={labelStyle}>운영 상태</label>
              <select name="operation_status" value={formData.operation_status || "ACTIVE"} onChange={handleChange} style={getInputStyle("operation_status")}>
                <option value="ACTIVE">정상 운영</option>
                <option value="INACTIVE">운영 중지</option>
              </select>
            </div>
          </div>
          <div style={footerStyle}>
            <Button type="submit">저장</Button>
            <Button type="button" variant="secondary" onClick={onClose}>취소</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
