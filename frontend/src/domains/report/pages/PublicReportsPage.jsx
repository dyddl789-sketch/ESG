import { useState, useEffect, useMemo } from "react";
import html2pdf from "html2pdf.js";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import DataTable from "../../../shared/components/DataTable";
import Button from "../../../shared/components/Button";
import Icon from "../../../shared/components/Icon";
import { publicReportApi } from "../api/publicReportApi";

export default function PublicReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const [downloadingId, setDownloadingId] = useState(null);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await publicReportApi.list();
        setReports(res.data.data || []);
      } catch (err) {
        setError("공개 보고서 목록을 불러오는데 실패했습니다.");
        console.error("Failed to fetch reports:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const processedReports = useMemo(() => {
    let result = [...reports];
    if (searchTerm) {
      result = result.filter((report) =>
        report.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "latest" ? dateB - dateA : dateA - dateB;
    });
    return result;
  }, [reports, searchTerm, sortOrder]);

  const totalPages = Math.ceil(processedReports.length / itemsPerPage);
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedReports.slice(start, start + itemsPerPage);
  }, [processedReports, currentPage]);

  useEffect(() => {
    void Promise.resolve().then(() => setCurrentPage(1));
  }, [searchTerm, sortOrder]);

  const handleDownload = async (report) => {
    if (!report?.content) {
      window.alert("다운로드할 보고서 본문이 없습니다. 관리자에게 보고서 저장 상태를 확인해 주세요.");
      return;
    }

    setDownloadingId(report.id);

    const container = document.createElement("section");
    const safeTitle = String(report.title || "ESG_공개_보고서")
      .replace(/[\\/:*?"<>|]/g, "_")
      .trim();
    const reportYear = report.target_year || new Date(report.created_at).getFullYear();
    const issuedAt = new Date(report.created_at).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    container.style.width = "190mm";
    container.style.padding = "8mm";
    container.style.background = "#ffffff";
    container.style.color = "#111827";
    container.style.fontFamily = 'Arial, "Noto Sans KR", sans-serif';
    container.style.fontSize = "12px";
    container.style.lineHeight = "1.7";
    // html2canvas는 화면 밖(-10000px)에 배치된 요소를 빈 캔버스로 처리할 수 있습니다.
    // 실제 화면 좌표에 렌더링하고, 별도 로딩 오버레이로 사용자에게만 가립니다.
    container.style.position = "fixed";
    container.style.left = "0";
    container.style.top = "0";
    container.style.zIndex = "2147483646";
    container.style.boxSizing = "border-box";
    container.style.pointerEvents = "none";

    const header = document.createElement("header");
    header.innerHTML = `
      <div style="color:#166534;font-size:13px;font-weight:700;letter-spacing:1px;">${reportYear} SUSTAINABILITY REPORT</div>
      <h1 style="margin:10px 0 14px;padding-bottom:12px;border-bottom:3px solid #166534;font-size:26px;line-height:1.35;">${report.title}</h1>
      <div style="margin-bottom:22px;padding-bottom:8px;border-bottom:1px solid #cbd5e1;color:#64748b;font-size:11px;">
        보고 연도: ${reportYear}년 · 보고 범위: ${report.scope || "전체 사업장"} · 발행일: ${issuedAt}
      </div>
    `;

    const body = document.createElement("article");
    const rawContent = String(report.content || "").trim();
    const containsHtml = /<\/?[a-z][\s\S]*>/i.test(rawContent);

    if (containsHtml) {
      body.innerHTML = rawContent;
    } else {
      body.textContent = rawContent;
      body.style.whiteSpace = "pre-wrap";
      body.style.wordBreak = "keep-all";
    }

    body.querySelectorAll("script, iframe, object, embed").forEach((node) => node.remove());
    body.querySelectorAll("*").forEach((node) => {
      [...node.attributes].forEach((attribute) => {
        if (attribute.name.toLowerCase().startsWith("on")) {
          node.removeAttribute(attribute.name);
        }
      });
    });
    body.querySelectorAll("table").forEach((table) => {
      table.style.width = "100%";
      table.style.borderCollapse = "collapse";
      table.style.margin = "12px 0";
    });
    body.querySelectorAll("th, td").forEach((cell) => {
      cell.style.border = "1px solid #cbd5e1";
      cell.style.padding = "7px";
      cell.style.verticalAlign = "top";
    });
    body.querySelectorAll("img").forEach((image) => {
      image.style.maxWidth = "100%";
      image.style.height = "auto";
    });

    const loadingOverlay = document.createElement("div");
    loadingOverlay.style.position = "fixed";
    loadingOverlay.style.inset = "0";
    loadingOverlay.style.zIndex = "2147483647";
    loadingOverlay.style.display = "flex";
    loadingOverlay.style.alignItems = "center";
    loadingOverlay.style.justifyContent = "center";
    loadingOverlay.style.background = "rgba(255, 255, 255, 0.98)";
    loadingOverlay.style.color = "#166534";
    loadingOverlay.style.fontSize = "15px";
    loadingOverlay.style.fontWeight = "700";
    loadingOverlay.textContent = "공개 보고서 PDF를 생성하고 있습니다...";

    container.appendChild(header);
    container.appendChild(body);
    document.body.appendChild(container);
    document.body.appendChild(loadingOverlay);

    try {
      // DOM 배치·웹폰트·이미지 로딩이 끝난 뒤 캡처해야 빈 PDF가 생성되지 않습니다.
      await new Promise((resolve) => {
        window.requestAnimationFrame(() => window.requestAnimationFrame(resolve));
      });

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      await Promise.all(
        Array.from(body.querySelectorAll("img")).map(
          (image) =>
            new Promise((resolve) => {
              if (image.complete) {
                resolve();
                return;
              }
              image.addEventListener("load", resolve, { once: true });
              image.addEventListener("error", resolve, { once: true });
              window.setTimeout(resolve, 3000);
            })
        )
      );

      await html2pdf()
        .set({
          margin: 10,
          filename: `${reportYear}_${safeTitle}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["css", "legacy"] },
        })
        .from(container)
        .save();
    } catch (downloadError) {
      console.error("공개 보고서 PDF 생성 실패:", downloadError);
      window.alert("PDF 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      loadingOverlay.remove();
      container.remove();
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="page-stack">
        <PageHeader breadcrumbs={["공개 ESG 정보", "공개 보고서"]} title="ESG 공개 보고서" />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
          <div className="loading-spinner">보고서 목록을 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-stack">
        <PageHeader breadcrumbs={["공개 ESG 정보", "공개 보고서"]} title="ESG 공개 보고서" />
        <Card>
          <div style={{ textAlign: "center", padding: "60px", color: "#e53e3e" }}>
            <p style={{ fontWeight: "600" }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{ marginTop: "1rem", padding: "8px 16px", cursor: "pointer" }}
            >
              재시도
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-stack" style={{ gap: "20px" }}>
      <PageHeader
        breadcrumbs={["공개 ESG 정보", "공개 보고서"]}
        title="ESG 공개 보고서"
        description="회사의 ESG 성과를 담은 공식 지속가능경영 보고서 목록입니다."
      />

      {/* 검색 및 필터 컨트롤 바 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#ffffff",
          padding: "16px",
          borderRadius: "10px",
          border: "1px solid #edf2f7",
          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ position: "relative", width: "320px" }}>
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#a0aec0" }}>
            <Icon name="search" size={16} />
          </span>
          <input
            type="text"
            placeholder="보고서명으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px 10px 36px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              fontSize: "0.85rem",
              outline: "none",
              transition: "border-color 0.2s",
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#2a7d55")}
            onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "#718096" }}>정렬 기준</span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              fontSize: "0.85rem",
              backgroundColor: "#ffffff",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="latest">최신순</option>
            <option value="oldest">오래된순</option>
          </select>
        </div>
      </div>

      <Card>
        {processedReports.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <DataTable
              rows={paginatedReports}
              columns={[
                {
                  key: "title",
                  label: "보고서명",
                  render: (v) => <div style={{ fontWeight: "600", color: "#2d3748", fontSize: "0.9rem" }}>{v}</div>,
                },
                {
                  key: "version",
                  label: "버전",
                  render: (v) => (
                    <span
                      style={{
                        padding: "2px 8px",
                        backgroundColor: "#f8fafc",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        color: "#4a5568",
                        border: "1px solid #edf2f7",
                      }}
                    >
                      v{v}
                    </span>
                  ),
                },
                {
                  key: "created_at",
                  label: "발행일",
                  render: (v) => (
                    <span style={{ color: "#718096", fontSize: "0.85rem" }}>
                      {new Date(v).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })}
                    </span>
                  ),
                },
                {
                  key: "id",
                  label: "다운로드",
                  render: (_, row) => (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(row)}
                      disabled={downloadingId === row.id}
                      style={{
                        borderColor: "#2a7d55",
                        color: "#2a7d55",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontWeight: "600",
                        fontSize: "0.8rem",
                      }}
                    >
                      <Icon name="download" size={14} /> {downloadingId === row.id ? "생성 중..." : "PDF 받기"}
                    </Button>
                  ),
                },
              ]}
            />

            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "8px",
                  paddingTop: "16px",
                  borderTop: "1px solid #f7fafc",
                }}
              >
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: "1px solid #edf2f7",
                    backgroundColor: currentPage === 1 ? "#f7fafc" : "#ffffff",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    color: currentPage === 1 ? "#cbd5e0" : "#4a5568",
                    fontSize: "0.85rem",
                  }}
                >
                  &lt;
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "6px",
                      border: "1px solid",
                      borderColor: currentPage === page ? "#2a7d55" : "#edf2f7",
                      backgroundColor: currentPage === page ? "#2a7d55" : "#ffffff",
                      color: currentPage === page ? "#ffffff" : "#4a5568",
                      fontWeight: currentPage === page ? "700" : "400",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: "1px solid #edf2f7",
                    backgroundColor: currentPage === totalPages ? "#f7fafc" : "#ffffff",
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                    color: currentPage === totalPages ? "#cbd5e0" : "#4a5568",
                    fontSize: "0.85rem",
                  }}
                >
                  &gt;
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "#8a8f98" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.3 }}>📂</div>
            <p style={{ fontSize: "0.95rem" }}>
              {searchTerm ? "검색 결과와 일치하는 보고서가 없습니다." : "아직 등록된 보고서가 없습니다."}
            </p>
            {searchTerm && (
              <Button variant="outline" size="sm" onClick={() => setSearchTerm("")} style={{ marginTop: "16px" }}>
                검색 초기화
              </Button>
            )}
          </div>
        )}
      </Card>

      <div style={{ fontSize: "0.75rem", color: "#a0aec0", textAlign: "center" }}>
        © {new Date().getFullYear()} ESG Management System. All rights reserved.
      </div>
    </div>
  );
}