let kakaoMapPromise = null;
let daumPostcodePromise = null;

export function loadKakaoMap() {
  if (window.kakao?.maps?.services) return Promise.resolve(window.kakao);
  if (kakaoMapPromise) return kakaoMapPromise;

  kakaoMapPromise = new Promise((resolve, reject) => {
    const key = import.meta.env.VITE_KAKAO_MAP_KEY;

    if (!key) {
      reject(new Error("VITE_KAKAO_MAP_KEY is not configured."));
      return;
    }

    const existingScript = document.querySelector('script[data-kakao-map-sdk="true"]');
    const script = existingScript || document.createElement("script");

    if (!existingScript) {
      script.dataset.kakaoMapSdk = "true";
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false&libraries=services`;
      document.head.appendChild(script);
    }

    const handleLoad = () => {
      if (!window.kakao?.maps) {
        reject(new Error("Kakao Maps SDK loaded without the maps object."));
        return;
      }

      window.kakao.maps.load(() => {
        if (window.kakao?.maps?.services) {
          resolve(window.kakao);
        } else {
          reject(new Error("Kakao Maps services library is unavailable."));
        }
      });
    };

    const handleError = () => {
      kakaoMapPromise = null;
      reject(new Error("Failed to load Kakao Maps SDK."));
    };

    if (window.kakao?.maps) {
      handleLoad();
      return;
    }

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
  }).catch((error) => {
    kakaoMapPromise = null;
    throw error;
  });

  return kakaoMapPromise;
}

export function loadDaumPostcode() {
  if (window.daum?.Postcode) return Promise.resolve(window.daum);
  if (daumPostcodePromise) return daumPostcodePromise;

  daumPostcodePromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-daum-postcode="true"]');
    const script = existingScript || document.createElement("script");

    const handleLoad = () => {
      if (window.daum?.Postcode) {
        resolve(window.daum);
      } else {
        reject(new Error("Daum postcode script loaded without Postcode."));
      }
    };

    const handleError = () => {
      daumPostcodePromise = null;
      reject(new Error("Failed to load Daum postcode script."));
    };

    if (!existingScript) {
      script.dataset.daumPostcode = "true";
      script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      document.head.appendChild(script);
    }

    if (window.daum?.Postcode) {
      resolve(window.daum);
      return;
    }

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
  }).catch((error) => {
    daumPostcodePromise = null;
    throw error;
  });

  return daumPostcodePromise;
}
