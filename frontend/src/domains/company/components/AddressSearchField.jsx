import { useState } from "react";
import { COLORS, FONT_SIZE, RADIUS } from "./companyStyles";
import { loadKakaoMap, loadDaumPostcode } from "../api/kakaoLoader";

export default function AddressSearchField({ address, onChange, required }) {
  const [searching, setSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = async () => {
    setSearching(true);
    try {
      const daum = await loadDaumPostcode();
      const kakao = await loadKakaoMap();

      new daum.Postcode({
        oncomplete: (data) => {
          const fullAddress = data.roadAddress || data.jibunAddress;

          const geocoder = new kakao.maps.services.Geocoder();
          geocoder.addressSearch(fullAddress, (result, status) => {
            if (status === kakao.maps.services.Status.OK) {
              const { y: latitude, x: longitude } = result[0];
              onChange({
                address: fullAddress,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
              });
            } else {
              onChange({ address: fullAddress, latitude: null, longitude: null });
              alert("좌표 변환에 실패했습니다. 주소를 다시 확인해주세요.");
            }
            setSearching(false);
          });
        },
        onclose: () => setSearching(false),
      }).open();
    } catch (err) {
      console.error("Failed to load address search:", err);
      setSearching(false);
      alert("주소 검색 기능을 불러오는데 실패했습니다.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
      <label style={{ fontSize: FONT_SIZE.sm, fontWeight: "600", color: COLORS.textPrimary }}>
        주소 {required && <span style={{ color: COLORS.danger }}>*</span>}
      </label>
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          value={address || ""}
          readOnly
          placeholder="주소 검색 버튼을 눌러주세요"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: RADIUS.md,
            border: `1px solid ${isFocused ? COLORS.borderFocus : COLORS.border}`,
            boxShadow: isFocused ? COLORS.focusShadow : "none",
            fontSize: FONT_SIZE.md,
            color: COLORS.textPrimary,
            outline: "none",
            transition: "all 0.2s ease",
            backgroundColor: COLORS.bgHover,
            cursor: "default",
          }}
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          style={{
            padding: "10px 16px",
            borderRadius: RADIUS.md,
            border: `1px solid ${COLORS.primary}`,
            backgroundColor: "transparent",
            color: COLORS.primary,
            fontSize: FONT_SIZE.md,
            fontWeight: "600",
            cursor: searching ? "default" : "pointer",
            whiteSpace: "nowrap",
            transition: "all 0.2s",
          }}
        >
          {searching ? "검색 중..." : "주소 검색"}
        </button>
      </div>
    </div>
  );
}