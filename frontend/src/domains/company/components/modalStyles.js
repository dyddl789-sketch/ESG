export const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.55)",
  backdropFilter: "blur(2px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: "20px",
};

export const contentStyle = {
  background: "#fff",
  borderRadius: 16,
  padding: "28px 32px",
  width: 520,
  maxWidth: "100%",
  maxHeight: "88vh",
  overflowY: "auto",
  boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
};

export const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 24,
  paddingBottom: 16,
  borderBottom: "1px solid #eef0f2",
};

export const titleStyle = {
  margin: 0,
  fontSize: 19,
  fontWeight: 700,
  color: "#1a1d21",
};

export const closeBtnStyle = {
  border: "none",
  background: "#f4f5f6",
  width: 30,
  height: 30,
  borderRadius: "50%",
  fontSize: 16,
  lineHeight: 1,
  color: "#666",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background 0.15s",
};

export const footerStyle = {
  display: "flex",
  gap: 10,
  marginTop: 28,
  paddingTop: 16,
  borderTop: "1px solid #eef0f2",
  justifyContent: "flex-end",
};

export const fieldGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "18px 20px",
};

export const fieldStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

export const labelStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: "#555",
};

export const inputStyle = {
  border: "1px solid #dcdfe3",
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: 14,
  color: "#1a1d21",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

export const detailGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "18px 24px",
};

export const detailItemLabelStyle = {
  display: "block",
  fontSize: 12,
  color: "#8a8f98",
  marginBottom: 4,
};

export const detailItemValueStyle = {
  fontSize: 15,
  fontWeight: 600,
  color: "#1a1d21",
};