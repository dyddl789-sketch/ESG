import { useEffect, useRef, useState } from "react";
import apiClient from "../../api/apiClient";
import Button from "../Button";
import StatusBadge from "../StatusBadge";
import { subscribeEsgEvents } from "../../realtime/esgSocket";

const errorMessageOf = (error, fallback) =>
  error?.response?.data?.error?.message
  || error?.response?.data?.message
  || error?.message
  || fallback;

const localEvent = (type, domain, status, progress, message, jobId = null) => ({
  type,
  domain,
  jobId,
  status,
  progress,
  message,
});

const isTerminalAiEvent = (message) =>
  message.type === "AI_ANALYSIS_COMPLETED" || message.type === "AI_ANALYSIS_FAILED";

export default function OperationalToolbar({ domain, canManage, aiPrompt, uploadLabel = "수동 파일 업로드" }) {
  const inputRef = useRef(null);
  const activeAiJobRef = useRef(null);
  const [event, setEvent] = useState(null);
  const [busy, setBusy] = useState(false);
  const [aiResult, setAiResult] = useState("");

  useEffect(() => subscribeEsgEvents((message) => {
    if (message.domain && message.domain !== domain) return;

    const activeJobId = activeAiJobRef.current;
    const isAiEvent = message.type?.startsWith("AI_ANALYSIS_");
    if (isAiEvent && activeJobId && message.jobId && message.jobId !== activeJobId) return;

    setEvent(message);

    if (message.type === "AI_ANALYSIS_COMPLETED") {
      setAiResult(message.result || "AI 분석이 완료되었습니다.");
    }

    if (message.type === "AI_ANALYSIS_FAILED") {
      setAiResult(message.message || "Gemini AI 분석에 실패했습니다.");
    }

    if (isAiEvent && isTerminalAiEvent(message)) {
      activeAiJobRef.current = null;
      setBusy(false);
    }
  }), [domain]);

  const upload = async (file) => {
    if (!file) return;

    const body = new FormData();
    body.append("file", file);
    body.append("domain", domain);
    setBusy(true);
    setEvent(localEvent("FILE_UPLOAD_STARTED", domain, "PROCESSING", 10, "수동 파일을 업로드하고 있습니다."));

    try {
      await apiClient.post("/manager/operations/files", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setEvent(localEvent("FILE_VALIDATED", domain, "COMPLETED", 100, "수동 파일 업로드가 완료되었습니다."));
    } catch (error) {
      const message = errorMessageOf(error, "수동 파일 업로드에 실패했습니다.");
      setEvent(localEvent("FILE_UPLOAD_FAILED", domain, "FAILED", 100, message));
      setAiResult(message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const startCollection = async () => {
    setBusy(true);
    setEvent(localEvent("COLLECTION_STARTED", domain, "PROCESSING", 10, "데이터 수집을 시작했습니다."));

    try {
      await apiClient.post(`/manager/operations/collect/${domain}`);
    } catch (error) {
      const message = errorMessageOf(
        error,
        "수집 작업을 시작하지 못했습니다. Redis 연결과 백엔드 로그를 확인하세요.",
      );
      setEvent(localEvent("COLLECTION_FAILED", domain, "FAILED", 100, message));
      setAiResult(message);
    } finally {
      setBusy(false);
    }
  };

  const analyze = async () => {
    setBusy(true);
    setAiResult("");
    setEvent(localEvent("AI_ANALYSIS_STARTED", domain, "PROCESSING", 10, "Gemini AI 분석 요청을 접수하고 있습니다."));

    try {
      const response = await apiClient.post("/manager/ai/analyze", {
        domain,
        prompt: aiPrompt,
      });
      const jobId = response.data?.data?.jobId;
      activeAiJobRef.current = jobId || null;
      setEvent(localEvent(
        "AI_ANALYSIS_STARTED",
        domain,
        "PROCESSING",
        15,
        "분석 요청이 접수되었습니다. 완료 결과는 WebSocket으로 전달됩니다.",
        jobId,
      ));

      if (!jobId) {
        setBusy(false);
        setAiResult("AI 분석 작업 번호를 받지 못했습니다. 백엔드 응답을 확인하세요.");
      }
    } catch (error) {
      const message = errorMessageOf(
        error,
        "Gemini AI 분석 작업을 시작하지 못했습니다.",
      );
      activeAiJobRef.current = null;
      setAiResult(message);
      setEvent(localEvent("AI_ANALYSIS_FAILED", domain, "FAILED", 100, message));
      setBusy(false);
    }
  };

  return (
    <section className="ops-toolbar">
      <div>
        <span className="ops-eyebrow">REALTIME OPERATIONS</span>
        <strong>WebSocket 실시간 상태 · Redis 작업 잠금 · Gemini AI 보조</strong>
        <p>{event?.message || "수집·분석 작업이 시작되면 진행 상태가 이 영역에 실시간으로 표시됩니다."}</p>
        {event && <div className="ops-progress"><i style={{ width: `${event.progress || 0}%` }} /></div>}
        {aiResult && <div className="ops-ai-result"><b>AI 검토 요약</b><span>{aiResult}</span></div>}
      </div>
      <div className="ops-actions">
        <StatusBadge status={event?.status || "READY"} label={event?.status || "연결 대기"} />
        <input
          ref={inputRef}
          hidden
          type="file"
          accept=".csv,.xlsx,.xls,.pdf"
          onChange={(e) => upload(e.target.files?.[0])}
        />
        <Button variant="light" disabled={!canManage || busy} onClick={startCollection}>실시간 수집 실행</Button>
        <Button variant="outline" disabled={!canManage || busy} onClick={() => inputRef.current?.click()}>{uploadLabel}</Button>
        <Button disabled={!canManage || busy} onClick={analyze}>Gemini AI 분석</Button>
      </div>
    </section>
  );
}
