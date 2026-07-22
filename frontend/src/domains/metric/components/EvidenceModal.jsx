import { useEffect, useMemo, useState } from "react";
import Button from "../../../shared/components/Button";
import { fileApi } from "../../../shared/api/fileApi";
import { formatDateTime, formatFileSize } from "../../../shared/utils/esgFormat";

const fileNameOf = (metric, status) => {
  if (metric?.evidenceOriginalFilename) return metric.evidenceOriginalFilename;
  if (status?.originalFilename) return status.originalFilename;
  const saved = String(metric?.evidence || "").split("/").pop() || "증빙자료.pdf";
  const separator = saved.indexOf("_");
  return separator > 30 ? saved.slice(separator + 1) : saved;
};

const uniqueEvidenceUrls = (metrics) => [...new Set(
  metrics.map((metric) => metric?.evidence).filter(Boolean),
)];

export default function EvidenceModal({ title, metrics = [], labels = {}, onClose }) {
  const [busy, setBusy] = useState("");
  const [statusByUrl, setStatusByUrl] = useState({});
  const evidenceUrls = useMemo(() => uniqueEvidenceUrls(metrics), [metrics]);

  useEffect(() => {
    let active = true;
    if (!evidenceUrls.length) return () => { active = false; };

    Promise.all(evidenceUrls.map(async (url) => {
      try {
        const status = await fileApi.status(url);
        return [url, { ...status, loading: false }];
      } catch (error) {
        return [url, {
          exists: false,
          loading: false,
          error: error?.response?.data?.message || "파일 상태를 확인하지 못했습니다.",
        }];
      }
    })).then((entries) => {
      if (active) setStatusByUrl(Object.fromEntries(entries));
    });

    return () => { active = false; };
  }, [evidenceUrls]);

  const handle = async (mode, metric) => {
    if (!metric?.evidence) return;
    const status = statusByUrl[metric.evidence];
    if (status && !status.loading && status.exists === false) return;
    setBusy(`${mode}-${metric.id}`);
    try {
      if (mode === "open") await fileApi.open(metric.evidence);
      else await fileApi.download(metric.evidence);
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <section className="evidence-modal" onClick={(event) => event.stopPropagation()}>
        <header>
          <div>
            <span className="section-kicker">ACTUAL EVIDENCE FILES</span>
            <h2>{title}</h2>
            <p>실제 ESG 실적에 연결된 PDF와 서버 저장 상태를 확인합니다.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="닫기">×</button>
        </header>
        <div className="evidence-modal-list">
          {metrics.map((metric) => {
            const status = metric.evidence ? statusByUrl[metric.evidence] : null;
            const fileExists = Boolean(metric.evidence) && status?.exists !== false;
            const checking = Boolean(metric.evidence) && (!status || status.loading);
            const fileSize = status?.size ?? metric.evidenceFileSize;
            const uploadedAt = metric.evidenceUploadedAt || status?.lastModifiedAt || metric.updatedAt;

            return (
              <article key={`${metric.indicatorCode}-${metric.id || metric.facilityId || "none"}`}>
                <div className="evidence-category">
                  <strong>{labels[metric.indicatorCode] || metric.title}</strong>
                  <span>{metric.facility || (["IND_G_ATTENDANCE", "IND_G_OUTSIDE"].includes(metric.indicatorCode) ? "전체 · 기업 기준" : "사업장 기준")}</span>
                </div>
                {metric.evidence ? (
                  <div className={`evidence-file-row ${fileExists ? "" : "is-missing"}`}>
                    <div>
                      <strong>{fileNameOf(metric, status)}</strong>
                      <span>
                        {checking
                          ? "서버 파일 확인 중"
                          : fileExists
                            ? `${formatFileSize(fileSize)} · 업로드 ${formatDateTime(uploadedAt)}`
                            : status?.error || "DB에는 연결되어 있지만 실제 파일을 찾을 수 없습니다."}
                      </span>
                      {!checking && fileExists && <small>{metric.evidenceContentType || status?.contentType || "application/pdf"}</small>}
                    </div>
                    <div>
                      <Button size="sm" variant="outline" disabled={Boolean(busy) || checking || !fileExists} onClick={() => void handle("open", metric)}>미리보기</Button>
                      <Button size="sm" disabled={Boolean(busy) || checking || !fileExists} onClick={() => void handle("download", metric)}>다운로드</Button>
                    </div>
                  </div>
                ) : (
                  <div className="evidence-unavailable">
                    <strong>증빙 미등록</strong>
                    <span>이전 시연 데이터에는 실제 업로드 파일이 없습니다.</span>
                  </div>
                )}
              </article>
            );
          })}
          {!metrics.length && <div className="evidence-unavailable"><strong>등록된 증빙문서가 없습니다.</strong></div>}
        </div>
      </section>
    </div>
  );
}
