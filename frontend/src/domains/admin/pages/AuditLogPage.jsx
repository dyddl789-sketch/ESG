import React, { useState, useEffect } from "react";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import DataTable from "../../../shared/components/DataTable";
import apiClient from "../../../shared/api/apiClient"; 
import Swal from "sweetalert2";

export default function AuditLogPage() {
  const [auditRows, setAuditRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRealAuditLogs = async () => {
      try {
        const response = await apiClient.get("/audit-logs");
        const actualLogs = response.data?.data ? response.data.data : response.data;
        setAuditRows(actualLogs || []);
      } catch (err) {
        console.error("데이터베이스 감사 로그 로드 실패:", err);
        Swal.fire("오류", "데이터베이스에 공시된 최종 승인 이력을 불러오지 못했습니다.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchRealAuditLogs();
  }, []);

  if (loading) {
    return (
      <div className="page-stack">
        <p style={{ padding: "40px", textAlign: "center" }}>
          데이터베이스로부터 실시간 최종 공시 이력을 조회 중입니다...
        </p>
      </div>
    );
  }
  return (
    <div className="page-stack">
      <PageHeader 
        breadcrumbs={["운영 관리", "감사 로그"]} 
        title="감사 로그" 
        description="데이터베이스 트리거 기반으로 추적성 및 무결성이 검증된 최종 승인(APPROVED) 공시 실행 이력을 조회합니다."
      />
      <Card>
        {/* 💡 [컬럼 다듬기 완결] 단일 사용자 칸을 '보고자'와 '승인자'로 쪼개어 금융 감사 추적성을 극대화합니다. */}
        <DataTable 
          rows={auditRows} 
          columns={[
            { key: "at", label: "처리일시" },
            { key: "reporter", label: "보고자" }, // 💡 백엔드 DTO reporter 필드와 자동 매칭
            { key: "approver", label: "승인자" }, // 💡 백엔드 DTO approver 필드와 자동 매칭
            { key: "action", label: "작업" },
            { key: "target", label: "대상 지표" },
            { key: "detail", label: "상세 내용" }
          ]} 
        />
      </Card>
    </div>
  );
}
