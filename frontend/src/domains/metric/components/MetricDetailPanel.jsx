import React from "react";

export default function MetricDetailPanel({ metric }) {
  if (!metric) return null;

  return (
    <div className="detail-panel">
      <section>
        <h4>기본 정보</h4>
        <div className="info-grid">
          <div className="item"><span>지표 코드</span><strong>{metric.indicatorCode}</strong></div>
          <div className="item"><span>카테고리</span><strong>{metric.category} / {metric.subCategory}</strong></div>
          <div className="item"><span>보고 주기</span><strong>{metric.year}년 {metric.period}</strong></div>
          <div className="item"><span>단위</span><strong>{metric.unit}</strong></div>
        </div>
      </section>

      <section>
        <h4>측정 데이터</h4>
        <div className="value-display">
          <span className="label">실제 측정값</span>
          <strong className="value">{metric.value?.toLocaleString()} {metric.unit}</strong>
        </div>
        <div className="source-info">
          <p>데이터 출처: <span>{metric.source}</span></p>
          <p>수집 방법: <span>{metric.method}</span></p>
        </div>
      </section>

      <section>
        <h4>증빙 및 참고자료</h4>
        {metric.evidence ? (
          <a href={metric.evidence} target="_blank" rel="noreferrer" className="evidence-link">
            📄 첨부파일 확인하기
          </a>
        ) : (
          <p className="no-data">등록된 증빙 자료가 없습니다.</p>
        )}
      </section>

      {metric.status === "REJECTED" && (
        <section className="reject-section">
          <h4>반려 사유</h4>
          <div className="reject-box">
            <p>{metric.aiFinding || "사유가 등록되지 않았습니다."}</p>
          </div>
        </section>
      )}
    </div>
  );
}
