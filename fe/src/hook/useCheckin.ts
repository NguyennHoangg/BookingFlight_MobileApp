import { useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { lookupCheckin, confirmCheckin, type CheckinCredentials, type CheckinResult } from "../api/checkin.api";
import { validateCheckinForm } from "../utils/checkin";

function errorMessage(error: unknown, fallback: string) {
  return isAxiosError<{ message?: string }>(error)
    ? error.response?.data?.message || fallback
    : error instanceof Error ? error.message : fallback;
}

/** PNR/họ chỉ ở RAM; mutation gọi lặp an toàn và không cho hai lần submit chồng nhau. */
export function useCheckin() {
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "lookup" | "confirm">("idle");
  const [error, setError] = useState<string | null>(null);
  const credentials = useRef<CheckinCredentials | null>(null);
  const request = useRef<AbortController | null>(null);
  const pending = useRef(false);
  useEffect(() => () => request.current?.abort(), []);

  async function lookup(input: CheckinCredentials) {
    if (pending.current) return;
    setError(null);
    let values: CheckinCredentials;
    try { values = validateCheckinForm(input); }
    catch (cause) { setError(errorMessage(cause, "Thông tin tra cứu chưa hợp lệ.")); return; }
    const controller = new AbortController();
    request.current = controller;
    pending.current = true;
    setStatus("lookup");
    setResult(null);
    setSelectedIds([]);
    credentials.current = values;
    try {
      const data = await lookupCheckin(values, controller.signal);
      if (!controller.signal.aborted) setResult(data);
    } catch (cause) {
      if (!controller.signal.aborted) setError(errorMessage(cause, "Không tải được đặt chỗ. Vui lòng kiểm tra kết nối và thử lại."));
    } finally {
      pending.current = false;
      if (!controller.signal.aborted) setStatus("idle");
    }
  }

  function toggleTicket(id: string) {
    if (pending.current || !result?.tickets.some(t => t.id === id && t.eligibility.state === "OPEN")) return;
    setSelectedIds(previous => previous.includes(id) ? previous.filter(value => value !== id) : previous.length < 18 ? [...previous, id] : previous);
    setError(null);
  }

  async function confirm(acceptedConditions: boolean): Promise<boolean> {
    if (pending.current || !credentials.current || !selectedIds.length) return false;
    if (!acceptedConditions) { setError("Vui lòng xác nhận đã kiểm tra thông tin."); return false; }
    const controller = new AbortController();
    request.current = controller;
    pending.current = true;
    setStatus("confirm");
    setError(null);
    try {
      const data = await confirmCheckin(credentials.current, selectedIds, true, controller.signal);
      if (controller.signal.aborted) return false;
      setResult(data);
      setSelectedIds([]);
      return true;
    } catch (cause) {
      if (!controller.signal.aborted) setError(errorMessage(cause, "Chưa nhận được kết quả check-in. Vui lòng tra cứu lại để kiểm tra trạng thái trước khi thử tiếp."));
      return false;
    } finally {
      pending.current = false;
      if (!controller.signal.aborted) setStatus("idle");
    }
  }

  function reset() {
    if (pending.current) return;
    credentials.current = null;
    setResult(null); setSelectedIds([]); setError(null);
  }
  const refresh = () => credentials.current ? lookup(credentials.current) : Promise.resolve();
  return { result, selectedIds, status, error, lookup, toggleTicket, confirm, reset, refresh };
}
