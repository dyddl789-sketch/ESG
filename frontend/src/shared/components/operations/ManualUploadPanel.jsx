import { useRef, useState } from "react";
import apiClient from "../../api/apiClient";
import { useRealtime } from "../../../app/providers/RealtimeProvider";
import Button from "../Button";
import StatusBadge from "../StatusBadge";

const errorMessageOf = (error) => (
  error?.response?.data?.error?.message
  || error?.response?.data?.message
  || error?.message
  || "파일 업로드에 실패했습니다."
);

export default function ManualUploadPanel({
  domain,
  canManage,
  title = "수동 파일 업로드",
  description,
  accept = ".csv,.xlsx,.xls,.pdf",
}) {
  const inputRef = useRef(null);
  const { eventFor } = useRealtime();
  const realtimeEvent = eventFor(domain);
  const [selectedFile, setSelectedFile] = useState(null);
  const [localStatus, setLocalStatus] = useState("READY");
  const [message, setMessage] = useState("파일을 선택하면 형식과 필수값을 검증한 뒤 등록합니다.");
  const [busy, setBusy] = useState(false);

  const upload = async () => {
    if (!selectedFile || !canManage) {
      return;
    }

    const body = new FormData();
    body.append("domain", domain);
    body.append("file", selectedFile);

    setBusy(true);
    setLocalStatus("PROCESSING");
    setMessage("파일 형식과 필수 컬럼을 검증하고 있습니다.");

    try {
      await apiClient.post("/manager/operations/files", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setLocalStatus("COMPLETED");
      setMessage("파일 검증이 완료되었습니다. 정상 데이터만 등록 대상으로 처리됩니다.");
      setSelectedFile(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (error) {
      setLocalStatus("FAILED");
      setMessage(errorMessageOf(error));
    } finally {
      setBusy(false);
    }
  };

  const displayEvent = realtimeEvent?.type?.startsWith("FILE_") ? realtimeEvent : null;
  const status = displayEvent?.status || localStatus;
  const statusMessage = displayEvent?.message || message;

  return (
    <section className="manual-upload-panel">
      <div className="manual-upload-copy">
        <span className="section-kicker">MANUAL DATA IMPORT</span>
        <h3>{title}</h3>
        <p>{description || "자동 연동이 불가능한 경우 CSV·XLSX 파일로 월간 데이터를 보완합니다."}</p>
        <div className="upload-rules">
          <span>① 사업장·기준월 확인</span>
          <span>② 필수 컬럼 검증</span>
          <span>③ 오류 행 분리</span>
          <span>④ 정상 데이터 등록</span>
        </div>
      </div>

      <div className="manual-upload-actions">
        <div className="selected-file-box">
          <strong>{selectedFile?.name || "선택된 파일 없음"}</strong>
          <small>{statusMessage}</small>
        </div>
        <div className="manual-upload-buttons">
          <StatusBadge status={status} label={status === "READY" ? "대기" : status} />
          <input
            ref={inputRef}
            hidden
            type="file"
            accept={accept}
            onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
          />
          <Button
            variant="outline"
            disabled={!canManage || busy}
            onClick={() => inputRef.current?.click()}
          >
            파일 선택
          </Button>
          <Button disabled={!canManage || busy || !selectedFile} onClick={upload}>
            {busy ? "검증 중" : "업로드·검증"}
          </Button>
        </div>
      </div>
    </section>
  );
}
