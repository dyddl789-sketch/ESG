// 파일 위치: src/domains/report/utils/reportExportUtils.js
import html2pdf from "html2pdf.js";

export const downloadPdf = (previewRef, year, title) => {
  const element = previewRef.current;
  const opt = {
    margin:       15,
    filename:     `${year}_${title}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, scrollY: 0 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(element).save();
};

export const downloadWord = (previewRef, year, title) => {
  const element = previewRef.current;
  if (!element) return;
  const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>ESG Report</title></head><body>";
  const footer = "</body></html>";
  const sourceHTML = header + element.innerHTML + footer;
  const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${year}_${title}_초안.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};