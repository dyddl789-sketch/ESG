import React from 'react';
import { adminColors } from './adminStyles';

/**
 * Admin 전용 상태 배지
 */
export const AdminBadge = ({ type, children }) => {
  const styles = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: '600',
    lineHeight: 1,
  };

  if (type === 'success') {
    Object.assign(styles, {
      backgroundColor: adminColors.successLight,
      color: adminColors.success,
    });
  } else if (type === 'danger') {
    Object.assign(styles, {
      backgroundColor: adminColors.dangerLight,
      color: adminColors.danger,
    });
  } else {
    Object.assign(styles, {
      backgroundColor: adminColors.infoLight,
      color: adminColors.info,
    });
  }

  return <span style={styles}>{children}</span>;
};

/**
 * Admin 전용 입력 필드 (포커스 효과 포함)
 */
export const AdminInput = (props) => {
  const [isFocused, setIsFocused] = React.useState(false);
  
  const style = {
    padding: "10px 14px",
    borderRadius: "8px",
    border: `1px solid ${isFocused ? adminColors.primary : adminColors.border}`,
    fontSize: "0.95rem",
    transition: "all 0.2s",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    boxShadow: isFocused ? `0 0 0 3px ${adminColors.primaryLight}` : 'none',
  };

  return (
    <input 
      {...props} 
      style={{...style, ...props.style}} 
      onFocus={(e) => {
        setIsFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setIsFocused(false);
        props.onBlur?.(e);
      }}
    />
  );
};

/**
 * Admin 전용 셀렉트 박스
 */
export const AdminSelect = (props) => {
  const [isFocused, setIsFocused] = React.useState(false);

  const style = {
    padding: "10px 14px",
    borderRadius: "8px",
    border: `1px solid ${isFocused ? adminColors.primary : adminColors.border}`,
    fontSize: "0.95rem",
    backgroundColor: adminColors.white,
    cursor: "pointer",
    width: "100%",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    backgroundSize: "16px",
    boxSizing: "border-box",
    transition: "all 0.2s",
    outline: "none",
    boxShadow: isFocused ? `0 0 0 3px ${adminColors.primaryLight}` : 'none',
  };

  return (
    <select 
      {...props} 
      style={{...style, ...props.style}}
      onFocus={(e) => {
        setIsFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setIsFocused(false);
        props.onBlur?.(e);
      }}
    >
      {props.children}
    </select>
  );
};

/**
 * Admin 전용 테이블 래퍼 (커스텀 스타일 적용을 위한 CSS 주입)
 */
export const AdminTableContainer = ({ children }) => {
  return (
    <div className="admin-table-container">
      <style>{`
        .admin-table-container .data-table {
          border-collapse: separate;
          border-spacing: 0;
          width: 100%;
        }
        .admin-table-container .data-table th {
          background-color: #fcfcfc;
          padding: 14px 16px;
          font-weight: 600;
          color: #666;
          border-bottom: 2px solid #f0f0f0;
          text-align: left;
          font-size: 0.9rem;
        }
        .admin-table-container .data-table td {
          padding: 16px;
          border-bottom: 1px solid #f0f0f0;
          font-size: 0.95rem;
          color: #333;
          vertical-align: middle;
        }
        .admin-table-container .data-table tr:hover td {
          background-color: #f9fbf9;
          cursor: pointer;
        }
        .admin-table-container .data-table tr:last-child td {
          border-bottom: none;
        }
      `}</style>
      {children}
    </div>
  );
};

/**
 * Admin 전용 상세 정보 그리드
 */
export const AdminDetailGrid = ({ children }) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '24px',
      padding: '8px 0'
    }}>
      {children}
    </div>
  );
};

export const AdminDetailItem = ({ label, value }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <span style={{ fontSize: '0.85rem', color: '#888', fontWeight: '500' }}>{label}</span>
      <strong style={{ fontSize: '1rem', color: '#222', fontWeight: '600' }}>{value || '-'}</strong>
    </div>
  );
};
