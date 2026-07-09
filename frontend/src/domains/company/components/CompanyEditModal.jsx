import { useState } from "react";
import Button from "../../../shared/components/Button";

export default function CompanyEditModal({ company, onClose, onSave }) {
  const [formData, setFormData] = useState({ ...company });

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
          <h2>기업 정보 수정</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-field">
                <label>기업명</label>
                <input name="name" value={formData.name || ""} onChange={handleChange} required />
              </div>
              <div className="form-field">
                <label>업종</label>
                <input name="industry" value={formData.industry || ""} onChange={handleChange} />
              </div>
              <div className="form-field">
                <label>기업규모</label>
                <input name="scale" value={formData.scale || ""} onChange={handleChange} />
              </div>
              <div className="form-field">
                <label>사업자번호</label>
                <input name="businessNumber" value={formData.businessNumber || ""} onChange={handleChange} />
              </div>
              <div className="form-field">
                <label>대표자</label>
                <input name="representative" value={formData.representative || ""} onChange={handleChange} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <Button type="submit">저장</Button>
            <Button variant="secondary" onClick={onClose}>취소</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
