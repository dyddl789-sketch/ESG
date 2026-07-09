import Button from "../../../shared/components/Button";
import {
  overlayStyle,
  contentStyle,
  headerStyle,
  titleStyle,
  closeBtnStyle,
  footerStyle,
  detailGridStyle,
  detailItemLabelStyle,
  detailItemValueStyle,
} from "./modalStyles";

export default function FacilityDetailModal({ facility, onClose, onEdit, onDelete, canEdit }) {
  if (!facility) return null;

  const rows = [
    ["사업장명", facility.facility_name],
    ["사업장 코드/ID", facility.id],
    ["사업장 유형", facility.facility_type],
    ["주소", facility.address],
    ["한전 계약전력", `${facility.contract_power_kw} kW`],
    ["등록일", new Date(facility.created_at).toLocaleDateString()],
  ];

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>사업장 상세 정보</h2>
          <button style={closeBtnStyle} onClick={onClose}>&times;</button>
        </div>

        <div style={detailGridStyle}>
          {rows.map(([label, value]) => (
            <div key={label}>
              <span style={detailItemLabelStyle}>{label}</span>
              <div style={detailItemValueStyle}>{value}</div>
            </div>
          ))}
        </div>

        <div style={footerStyle}>
          {canEdit && (
            <>
              <Button variant="secondary" onClick={() => onEdit(facility)}>수정</Button>
              <Button variant="danger" onClick={() => onDelete(facility.id)}>삭제</Button>
            </>
          )}
          <Button onClick={onClose}>닫기</Button>
        </div>
      </div>
    </div>
  );
}