import Button from "../../../shared/components/Button";

export default function FacilityDetailModal({ facility, onClose, onEdit, onDelete, canEdit }) {
  if (!facility) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>사업장 상세 정보</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="detail-grid">
            <div>
              <span>사업장명</span>
              <strong>{facility.facility_name}</strong>
            </div>
            <div>
              <span>사업장 코드/ID</span>
              <strong>{facility.id}</strong>
            </div>
            <div>
              <span>사업장 유형</span>
              <strong>{facility.facility_type}</strong>
            </div>
            <div>
              <span>주소</span>
              <strong>{facility.address}</strong>
            </div>
            <div>
              <span>한전 계약전력</span>
              <strong>{facility.contract_power_kw} kW</strong>
            </div>
            <div>
              <span>등록일</span>
              <strong>{new Date(facility.created_at).toLocaleDateString()}</strong>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          {canEdit && (
            <div className="btn-group">
              <Button variant="secondary" onClick={() => onEdit(facility)}>수정</Button>
              <Button variant="danger" onClick={() => onDelete(facility.id)}>삭제</Button>
            </div>
          )}
          <Button onClick={onClose}>닫기</Button>
        </div>
      </div>
    </div>
  );
}
