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

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>{isEdit ? "사업장 수정" : "사업장 등록"}</h2>
          <button style={closeBtnStyle} onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={fieldGridStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>사업장명</label>
              <input
                name="facility_name"
                value={formData.facility_name || ""}
                onChange={handleChange}
                onFocus={() => setFocused("facility_name")}
                onBlur={() => setFocused(null)}
                required
                style={getInputStyle("facility_name")}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>사업장 유형</label>
              <select
                name="facility_type"
                value={formData.facility_type || ""}
                onChange={handleChange}
                onFocus={() => setFocused("facility_type")}
                onBlur={() => setFocused(null)}
                style={getInputStyle("facility_type")}
              >
                <option value="본사">본사</option>
                <option value="공장">공장</option>
                <option value="사무실">사무실</option>
                <option value="기타">기타</option>
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>주소</label>
              <input
                name="address"
                value={formData.address || ""}
                onChange={handleChange}
                onFocus={() => setFocused("address")}
                onBlur={() => setFocused(null)}
                style={getInputStyle("address")}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>한전 계약전력 (kW)</label>
              <input
                type="number"
                name="contract_power_kw"
                value={formData.contract_power_kw || 0}
                onChange={handleChange}
                onFocus={() => setFocused("contract_power_kw")}
                onBlur={() => setFocused(null)}
                style={getInputStyle("contract_power_kw")}
              />
            </div>
          </div>
          <div style={footerStyle}>
            <Button type="submit">{isEdit ? "수정" : "등록"}</Button>
            <Button variant="secondary" onClick={onClose}>취소</Button>
          </div>
        </form>
      </div>
    </div>
  );
}