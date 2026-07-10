import { useState, useEffect, useMemo } from "react";
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

  // 검색, 정렬, 페이지네이션 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("latest"); // 'latest' | 'oldest'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await publicReportApi.list();
        // res.data.data가 실제 배열임을 보장
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

  // 검색 및 정렬 로직 (useMemo로 최적화)
  const processedReports = useMemo(() => {
    let result = [...reports];

    // 1. 검색 필터링
    if (searchTerm) {
      result = result.filter((report) =>
        report.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 2. 정렬
    result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "latest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [reports, searchTerm, sortOrder]);

  // 페이지네이션 로직
  const totalPages = Math.ceil(processedReports.length / itemsPerPage);
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedReports.slice(start, start + itemsPerPage);
  }, [processedReports, currentPage]);

  // 검색어나 정렬 변경 시 페이지 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortOrder]);

  const handleDownload = (fileUrl) => {
    window.open(fileUrl, "_blank");
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="page-stack">
        <PageHeader breadcrumbs={["공개 ESG 정보", "공개 보고서"]} title="ESG 공개 보고서" />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
          <div style={{ color: "#2a7d55", fontWeight: "600" }}>보고서 목록을 불러오는 중...</div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="page-stack">
        <PageHeader breadcrumbs={["공개 ESG 정보", "공개 보고서"]} title="ESG 공개 보고서" />
        <Card>
          <div style={{ textAlign: "center", padding: "60px", color: "#e53e3e" }}>
            <p>{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline" style={{ marginTop: "12px" }}>다시 시도</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-stack" style={{ gap: "24px" }}>
      <PageHeader
        breadcrumbs={["공개 ESG 정보", "공개 보고서"]}
        title="ESG 공개 보고서"
        description="회사의 ESG 성과를 담은 공식 지속가능경영 보고서 목록입니다."
      />

      {/* 검색 및 필터 컨트롤 바 */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        backgroundColor: "#ffffff",
        padding: "16px 20px",
        borderRadius: "12px",
        border: "1px solid #edf2f7",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
      }}>
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
              fontSize: "0.9rem",
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => e.target.style.borderColor = "#2a7d55"}
            onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "0.85rem", color: "#718096", fontWeight: "500" }}>정렬 기준:</span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              fontSize: "0.9rem",
              backgroundColor: "#ffffff",
              cursor: "pointer",
              outline: "none"
            }}
          >
            <option value="latest">최신순</option>
            <option value="oldest">오래된순</option>
          </select>
        </div>
      </div>

      <Card>
        {processedReports.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <DataTable
              rows={paginatedReports}
              columns={[
                { 
                  key: "title", 
                  label: "보고서명",
                  render: (v) => (
                    <div style={{ fontWeight: "600", color: "#2d3748" }}>{v}</div>
                  )
                },
                { 
                  key: "version", 
                  label: "버전",
                  render: (v) => (
                    <span style={{ 
                      padding: "2px 8px", 
                      backgroundColor: "#f7fafc", 
                      borderRadius: "4px", 
                      fontSize: "0.8rem",
                      color: "#4a5568",
                      border: "1px solid #edf2f7"
                    }}>
                      v{v}
                    </span>
                  )
                },
                {
                  key: "created_at",
                  label: "발행일",
                  render: (v) => (
                    <span style={{ color: "#718096", fontSize: "0.9rem" }}>
                      {new Date(v).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
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
                      onClick={() => handleDownload(row.file_url)}
                      style={{ 
                        borderColor: "#2a7d55", 
                        color: "#2a7d55",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontWeight: "600"
                      }}
                    >
                      <Icon name="download" size={14} /> PDF 받기
                    </Button>
                  ),
                },
              ]}
            />

            {/* 페이지네이션 UI */}
            {totalPages > 1 && (
              <div style={{ 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center", 
                gap: "8px",
                marginTop: "10px",
                paddingTop: "20px",
                borderTop: "1px solid #f7fafc"
              }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                    backgroundColor: currentPage === 1 ? "#f7fafc" : "#ffffff",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    color: currentPage === 1 ? "#cbd5e0" : "#4a5568"
                  }}
                >
                  &lt;
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "6px",
                      border: "1px solid",
                      borderColor: currentPage === page ? "#2a7d55" : "#e2e8f0",
                      backgroundColor: currentPage === page ? "#2a7d55" : "#ffffff",
                      color: currentPage === page ? "#ffffff" : "#4a5568",
                      fontWeight: currentPage === page ? "700" : "400",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                    backgroundColor: currentPage === totalPages ? "#f7fafc" : "#ffffff",
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                    color: currentPage === totalPages ? "#cbd5e0" : "#4a5568"
                  }}
                >
                  &gt;
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "100px 20px", color: "#8a8f98" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1.5rem", opacity: 0.3 }}>📂</div>
            <p style={{ fontSize: "1.1rem" }}>
              {searchTerm ? "검색 결과와 일치하는 보고서가 없습니다." : "아직 등록된 보고서가 없습니다."}
            </p>
            {searchTerm && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSearchTerm("")}
                style={{ marginTop: "16px" }}
              >
                검색 초기화
              </Button>
            )}
          </div>
        )}
      </Card>

      <div style={{ fontSize: "0.85rem", color: "#a0aec0", textAlign: "center" }}>
        © {new Date().getFullYear()} ESG Management System. All rights reserved.
      </div>
    </div>
  );
}
