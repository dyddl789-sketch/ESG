import { useEffect, useMemo, useRef, useState } from "react";
import { loadKakaoMap } from "../api/kakaoLoader";
import { normalizeFacility, normalizeMapStatus } from "../utils/facilityData";

const markerColors = {
  NORMAL: "#1f7a4d",
  REVIEW: "#d58a1f",
  ERROR: "#d74747",
  PENDING: "#3b72c4",
};

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

export default function FacilityMap({ facilities = [], onSelect, selectedId }) {
  const mapRef = useRef(null);
  const [error, setError] = useState("");
  const normalizedFacilities = useMemo(
    () => facilities.map((facility, index) => normalizeFacility(facility, index)),
    [facilities],
  );

  useEffect(() => {
    let active = true;

    if (!normalizedFacilities.length) {
      return undefined;
    }

    loadKakaoMap()
      .then((kakao) => {
        if (!active || !mapRef.current) {
          return;
        }

        setError("");
        const first = normalizedFacilities[0];
        const map = new kakao.maps.Map(mapRef.current, {
          center: new kakao.maps.LatLng(first.latitude, first.longitude),
          level: 8,
        });
        const bounds = new kakao.maps.LatLngBounds();

        normalizedFacilities.forEach((facility) => {
          if (!Number.isFinite(facility.latitude) || !Number.isFinite(facility.longitude)) {
            return;
          }

          const position = new kakao.maps.LatLng(facility.latitude, facility.longitude);
          bounds.extend(position);

          const status = normalizeMapStatus(facility.mapStatus || facility.status);
          const markerContent = document.createElement("button");
          markerContent.type = "button";
          markerContent.className = `facility-map-marker ${selectedId === facility.id ? "selected" : ""}`;
          markerContent.style.setProperty("--marker-color", markerColors[status]);
          markerContent.title = `${facility.facilityName} 상세 보기`;
          markerContent.innerHTML = `<span></span><b>${escapeHtml(facility.facilityName)}</b>`;
          markerContent.addEventListener("click", () => onSelect?.(facility));

          const overlay = new kakao.maps.CustomOverlay({
            content: markerContent,
            position,
            yAnchor: 1.2,
          });
          overlay.setMap(map);
        });

        if (normalizedFacilities.length > 1) {
          map.setBounds(bounds, 40, 40, 40, 40);
        }
      })
      .catch(() => setError("카카오 지도 API 키와 허용 도메인을 확인하세요."));

    return () => {
      active = false;
    };
  }, [normalizedFacilities, onSelect, selectedId]);

  const displayError = normalizedFacilities.length ? error : "지도에 표시할 사업장이 없습니다.";

  return (
    <div className="facility-map-shell">
      <div ref={mapRef} className="facility-map" />
      {displayError && <div className="facility-map-error">{displayError}</div>}
      <div className="facility-map-legend">
        <span><i className="normal" />정상</span>
        <span><i className="review" />검토 필요</span>
        <span><i className="pending" />처리 대기</span>
        <span><i className="error" />오류</span>
      </div>
    </div>
  );
}
