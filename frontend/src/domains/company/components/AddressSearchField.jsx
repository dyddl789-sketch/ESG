import { useState } from "react";
import { COLORS, FONT_SIZE, RADIUS } from "./companyStyles";
import { loadKakaoMap, loadDaumPostcode } from "../api/kakaoLoader";

export default function AddressSearchField({ address, onChange, required }) {
  const [searching, setSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const saveAddressWithCoordinates = async (fullAddress) => {
    try {
      const kakao = await loadKakaoMap();
      const geocoder = new kakao.maps.services.Geocoder();

      geocoder.addressSearch(fullAddress, (result, status) => {
        if (status === kakao.maps.services.Status.OK && result.length > 0) {
          const { y: latitude, x: longitude } = result[0];
          onChange({
            address: fullAddress,
            latitude: Number.parseFloat(latitude),
            longitude: Number.parseFloat(longitude),
          });
        } else {
          onChange({ address: fullAddress, latitude: null, longitude: null });
        }
        setSearching(false);
      });
    } catch (error) {
      // 지도 API 키가 없거나 좌표 변환 SDK를 불러오지 못해도 주소 등록은 진행한다.
      console.warn("Address selected without coordinates:", error);
      onChange({ address: fullAddress, latitude: null, longitude: null });
      setSearching(false);
    }
  };

  const handleSearch = async () => {
    setSearching(true);

    try {
      const daum = await loadDaumPostcode();

      new daum.Postcode({
        oncomplete: (data) => {
          const fullAddress = data.roadAddress || data.jibunAddress || data.autoRoadAddress || data.autoJibunAddress;

          if (!fullAddress) {
            setSearching(false);
            alert("선택한 주소를 확인할 수 없습니다. 다시 검색해주세요.");
            return;
          }

          saveAddressWithCoordinates(fullAddress);
        },
        onclose: () => setSearching(false),
      }).open();
    } catch (error) {
      console.error("Failed to load address search:", error);
      setSearching(false);
      alert("주소 검색 기능을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
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
