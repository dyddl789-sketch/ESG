// 파일 위치: src/domains/report/utils/reportExportUtils.js
// 버전: v1.5
// 이 파일은 ESG 보고서 시스템에서 리포트를 PDF 변환 후 즉시 시스템 인쇄 창을 띄우고, Word 다운로드 시 브라우저 인쇄 창과 동일한 형태의 커스텀 UI 모달(스크롤 없는 자동 스케일링 적용)을 제공하는 유틸리티 파일입니다.

import html2pdf from "html2pdf.js";

/**
 * PDF 변환 후 보이지 않는 iframe에 담아 브라우저의 네이티브 인쇄 다이얼로그를 즉시 호출합니다.
 * @param {React.RefObject} previewRef - 미리보기 대상 HTML 엘리먼트 레퍼런스
 * @param {string|number} year - 보고 연도
 * @param {string} title - 보고서 제목
 */
export const downloadPdf = (previewRef, year, title) => {
  console.log("[downloadPdf v1.5] PDF 변환 및 시스템 인쇄 창 호출 함수가 실행되었습니다.");
  
  const element = previewRef.current;
  
  if (!element) {
    console.log("[downloadPdf v1.5] 변환할 대상 엘리먼트(previewRef)가 존재하지 않아 실행을 중단합니다.");
    return;
  }

  // html2pdf 동작을 제어하기 위한 옵션값 정의 (표준 A4 세로 규격 설정)
  const opt = {
    margin:       15,
    filename:     `${year}_${title}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, scrollY: 0 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  console.log("[downloadPdf v1.5] html2pdf 라이브러리를 통해 PDF 바이너리(Blob) 변환을 시작합니다.");

  // html2pdf 프로세스 시작
  html2pdf().set(opt).from(element).toPdf().get('pdf').then(function (pdf) {
    console.log("[downloadPdf v1.5] PDF 변환 성공. Blob URL을 추출하여 숨겨진 iframe에 삽입합니다.");
    const blobUrl = pdf.output('bloburl');
    
    // 1. 화면에 보이지 않는 iframe을 생성하여 PDF 데이터를 로드합니다.
    const iframe = document.createElement("iframe");
    console.log("[downloadPdf v1.5] 시스템 인쇄 호출을 위한 숨겨진 iframe 엘리먼트를 생성합니다.");
    iframe.style.display = "none";
    iframe.src = blobUrl;
    
    // 2. 문서 body에 iframe을 주입하여 로딩을 트리거합니다.
    document.body.appendChild(iframe);
    console.log("[downloadPdf v1.5] iframe을 DOM에 주입 완료했습니다.");
    
    // 3. iframe에 PDF가 완전히 로드되면 iframe의 contentWindow를 통해 print() 시스템 함수를 호출합니다.
    iframe.onload = function() {
      console.log("[downloadPdf v1.5] iframe 내 PDF 로드 완료. 브라우저 네이티브 인쇄 다이얼로그를 트리거합니다.");
      // 포커스를 맞춘 후 인쇄를 호출해야 크로스 브라우징 환경에서 안정적으로 창이 뜹니다.
      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        console.log("[downloadPdf v1.5] 인쇄 다이얼로그 호출 명령이 전달되었습니다.");
      }, 100);
    };
  });
};

/**
 * 브라우저 인쇄 창(크롬 스타일)과 똑같이 생긴 커스텀 모달 UI를 렌더링하고, 화면 밖으로 삐져나가지 않도록 자동 스케일링을 적용하여 Word(.doc) 파일을 생성합니다.
 * @param {React.RefObject} previewRef - 미리보기 대상 HTML 엘리먼트 레퍼런스
 * @param {string|number} year - 보고 연도
 * @param {string} title - 보고서 제목
 */
export const downloadWord = (previewRef, year, title) => {
  console.log("[downloadWord v1.5] Word 다운로드용 자동 스케일링 커스텀 모달 렌더링 함수가 호출되었습니다.");
  
  const element = previewRef.current;
  
  if (!element) {
    console.log("[downloadWord v1.5] 변환할 대상 엘리먼트(previewRef)가 존재하지 않아 실행을 중단합니다.");
    return;
  }

  // MS Word 프로그램 대응용 HTML 레이아웃 규격 정의
  const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>ESG Report</title></head><body>";
  const footer = "</body></html>";
  const sourceHTML = header + element.innerHTML + footer;

  console.log("[downloadWord v1.5] Word 추출용 원본 HTML 마크업 병합 처리를 완료했습니다.");
  
  // 1. 전체 화면을 덮는 최상위 컨테이너 (인쇄 창 전체 모달 역할)
  const overlay = document.createElement("div");
  console.log("[downloadWord v1.5] 전체 화면을 덮는 모달 컨테이너를 생성합니다.");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.display = "flex";
  overlay.style.zIndex = "999999";
  overlay.style.fontFamily = "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  
  // 2. 좌측: 문서 미리보기 영역 (어두운 회색 배경 + 스크롤 숨김)
  const previewArea = document.createElement("div");
  console.log("[downloadWord v1.5] 좌측 어두운 배경의 미리보기 영역 컨테이너를 생성합니다.");
  previewArea.style.flex = "1";
  previewArea.style.backgroundColor = "#525659"; 
  previewArea.style.display = "flex";
  previewArea.style.justifyContent = "center";
  previewArea.style.alignItems = "center"; // 중앙 정렬
  previewArea.style.overflow = "hidden"; // 축소된 엘리먼트 외곽의 스크롤 방지
  
  // 2-1. 미리보기 영역 내부에 들어갈 실제 A4 픽셀 규격 용지 엘리먼트 (96 DPI 기준 A4 크기)
  const paper = document.createElement("div");
  console.log("[downloadWord v1.5] 미리보기 영역 내부에 A4 픽셀 규격 종이 엘리먼트를 생성하고 내용을 삽입합니다.");
  paper.style.width = "794px";
  paper.style.height = "1123px";
  paper.style.backgroundColor = "#ffffff";
  paper.style.padding = "60px";
  paper.style.boxSizing = "border-box";
  paper.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.4)";
  paper.style.overflow = "hidden"; // 내용이 1페이지를 넘어갈 경우 영역 안에서 절삭 (미리보기용)
  paper.innerHTML = element.innerHTML; 
  previewArea.appendChild(paper);
  
  // 2-2. 화면 크기에 맞춰 paper 엘리먼트를 동적으로 축소하는 스케일링 함수
  const updateScale = () => {
    // 여백(상하좌우 80px)을 제외한 가용 공간 계산
    const availableWidth = previewArea.clientWidth - 80;
    const availableHeight = previewArea.clientHeight - 80;
    
    // A4 원본 크기(794x1123) 대비 비율 계산
    const scaleW = availableWidth / 794;
    const scaleH = availableHeight / 1123;
    
    // 두 비율 중 더 작은 값을 선택하여 화면 밖으로 나가지 않게 조절 (최대 1배수까지만 확대)
    const scale = Math.min(scaleW, scaleH, 1);
    
    paper.style.transform = `scale(${scale})`;
    paper.style.transformOrigin = "center center";
    console.log(`[downloadWord v1.5] 미리보기 스케일이 조정되었습니다. (현재 배율: ${scale.toFixed(2)})`);
  };

  // 브라우저 리사이즈 시 동적으로 스케일 재계산 이벤트 바인딩
  window.addEventListener("resize", updateScale);
  
  // 3. 우측: 설정 패널 및 액션 버튼 영역 (하얀색 배경의 사이드바)
  const sidebar = document.createElement("div");
  console.log("[downloadWord v1.5] 우측 컨트롤 패널(사이드바) 엘리먼트를 생성합니다.");
  sidebar.style.width = "320px";
  sidebar.style.backgroundColor = "#ffffff";
  sidebar.style.display = "flex";
  sidebar.style.flexDirection = "column";
  sidebar.style.borderLeft = "1px solid #d1d5db";
  
  // 3-1. 사이드바 상단 타이틀
  const sidebarHeader = document.createElement("div");
  console.log("[downloadWord v1.5] 우측 패널 상단 타이틀 엘리먼트를 생성합니다.");
  sidebarHeader.style.padding = "24px 20px 20px";
  sidebarHeader.style.fontSize = "20px";
  sidebarHeader.style.color = "#202124";
  sidebarHeader.innerText = "Word 파일 다운로드";
  sidebar.appendChild(sidebarHeader);
  
  // 3-2. 사이드바 중앙 설정 내용부 (대상 포맷 정보)
  const settingsArea = document.createElement("div");
  console.log("[downloadWord v1.5] 우측 패널 중앙의 가짜 설정 엘리먼트를 생성합니다.");
  settingsArea.style.flex = "1";
  settingsArea.style.padding = "0 20px";
  
  const settingRow = document.createElement("div");
  settingRow.style.display = "flex";
  settingRow.style.justifyContent = "space-between";
  settingRow.style.alignItems = "center";
  settingRow.style.marginBottom = "24px";
  settingRow.innerHTML = `<span style="color: #5f6368; font-size: 13px;">대상</span><div style="border: 1px solid #dadce0; padding: 6px 12px; border-radius: 4px; font-size: 13px; width: 170px; color: #202124;">📄 Word (.doc) 파일</div>`;
  settingsArea.appendChild(settingRow);
  sidebar.appendChild(settingsArea);
  
  // 3-3. 모달 자원 해제용 공통 함수 (메모리 릭 방지)
  const destroyModal = () => {
    console.log("[downloadWord v1.5] 모달을 종료하고 리사이즈 이벤트 리스너를 해제합니다.");
    window.removeEventListener("resize", updateScale);
    if (document.body.contains(overlay)) {
      document.body.removeChild(overlay);
    }
  };

  // 3-4. 사이드바 하단 버튼 영역 (다운로드 및 취소)
  const actionArea = document.createElement("div");
  console.log("[downloadWord v1.5] 우측 패널 하단 액션 버튼 묶음 엘리먼트를 생성합니다.");
  actionArea.style.padding = "20px";
  actionArea.style.display = "flex";
  actionArea.style.justifyContent = "flex-end";
  actionArea.style.gap = "12px";
  actionArea.style.borderTop = "1px solid #dadce0";
  
  // 취소 버튼
  const cancelBtn = document.createElement("button");
  console.log("[downloadWord v1.5] 취소 버튼 엘리먼트를 생성하고 이벤트를 바인딩합니다.");
  cancelBtn.innerText = "취소";
  cancelBtn.style.padding = "8px 16px";
  cancelBtn.style.backgroundColor = "#ffffff";
  cancelBtn.style.border = "1px solid #dadce0";
  cancelBtn.style.color = "#1a73e8";
  cancelBtn.style.borderRadius = "4px";
  cancelBtn.style.cursor = "pointer";
  cancelBtn.style.fontSize = "14px";
  cancelBtn.style.fontWeight = "500";
  cancelBtn.onclick = destroyModal;
  
  // 다운로드 버튼
  const downloadBtn = document.createElement("button");
  console.log("[downloadWord v1.5] 다운로드 버튼 엘리먼트를 생성하고 이벤트를 바인딩합니다.");
  downloadBtn.innerText = "다운로드";
  downloadBtn.style.padding = "8px 24px";
  downloadBtn.style.backgroundColor = "#1a73e8";
  downloadBtn.style.color = "#ffffff";
  downloadBtn.style.border = "none";
  downloadBtn.style.borderRadius = "4px";
  downloadBtn.style.cursor = "pointer";
  downloadBtn.style.fontSize = "14px";
  downloadBtn.style.fontWeight = "500";
  downloadBtn.onclick = () => {
    console.log("[downloadWord v1.5] 다운로드 버튼 클릭됨. 설정해둔 HTML 데이터를 기반으로 .doc 파일을 생성합니다.");
    const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${year}_${title}_초안.doc`;
    document.body.appendChild(link);
    console.log("[downloadWord v1.5] 파일 다운로드 강제 클릭 이벤트를 트리거합니다.");
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    destroyModal();
  };
  
  actionArea.appendChild(cancelBtn);
  actionArea.appendChild(downloadBtn);
  sidebar.appendChild(actionArea);
  
  // 4. 생성된 좌측 미리보기, 우측 사이드바를 최상단 오버레이에 결합하여 문서에 주입
  console.log("[downloadWord v1.5] 구축된 좌/우 패널을 모달 오버레이에 병합하고 브라우저 화면에 주입합니다.");
  overlay.appendChild(previewArea);
  overlay.appendChild(sidebar);
  document.body.appendChild(overlay);

  // 5. DOM에 주입된 직후 스케일 1회 강제 계산 실행
  updateScale();
};