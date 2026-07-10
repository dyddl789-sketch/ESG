let kakaoMapPromise = null;
let daumPostcodePromise = null;

export function loadKakaoMap() {
  if (window.kakao?.maps) return Promise.resolve(window.kakao);
  if (kakaoMapPromise) return kakaoMapPromise;

  kakaoMapPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const key = import.meta.env.VITE_KAKAO_MAP_KEY;
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=services`;
    script.onload = () => {
      window.kakao.maps.load(() => resolve(window.kakao));
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return kakaoMapPromise;
}

export function loadDaumPostcode() {
  if (window.daum?.Postcode) return Promise.resolve(window.daum);
  if (daumPostcodePromise) return daumPostcodePromise;

  daumPostcodePromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.onload = () => resolve(window.daum);
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return daumPostcodePromise;
}