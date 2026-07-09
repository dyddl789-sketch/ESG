import { useState } from "react";
import Button from "../../../shared/components/Button";

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? "사업장 수정" : "사업장 등록"}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-field">
                <label>사업장명</label>
                <input name="facility_name" value={formData.facility_name || ""} onChange={handleChange} required />
              </div>
              <div className="form-field">
                <label>사업장 유형</label>
                <select name="facility_type" value={formData.facility_type || ""} onChange={handleChange}>
                  <option value="본사">본사</option>
                  <option value="공장">공장</option>
                  <option value="사무실">사무실</option>
                  <option value="기타">기타</option>
                </select>
              </div>
              <div className="form-field">
                <label>주소</label>
                <input name="address" value={formData.address || ""} onChange={handleChange} />
              </div>
              <div className="form-field">
                <label>한전 계약전력 (kW)</label>
                <input type="number" name="contract_power_kw" value={formData.contract_power_kw || 0} onChange={handleChange} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <Button type="submit">{isEdit ? "수정" : "등록"}</Button>
            <Button variant="secondary" onClick={onClose}>취소</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
