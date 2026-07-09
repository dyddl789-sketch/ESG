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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const getInputStyle = (name) => ({
    ...inputStyle,
    borderColor: focused === name ? "#2a7d55" : "#dcdfe3",
    boxShadow: focused === name ? "0 0 0 3px rgba(42,125,85,0.12)" : "none",
  });

  const fields = [
    ["기업명", "name", true],
    ["업종", "industry", false],
    ["기업규모", "scale", false],
    ["사업자번호", "business_number", false],
    ["대표자", "representative", false],
  ];

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>기업 정보 수정</h2>
          <button style={closeBtnStyle} onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={fieldGridStyle}>
            {fields.map(([label, name, required]) => (
              <div key={name} style={fieldStyle}>
                <label style={labelStyle}>{label}</label>
                <input
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
          </div>
          <div style={footerStyle}>
            <Button type="submit">저장</Button>
            <Button variant="secondary" onClick={onClose}>취소</Button>
          </div>
        </form>
      </div>
    </div>
  );
}