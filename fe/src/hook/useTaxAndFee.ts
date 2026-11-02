import { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { getTaxAndFee, type TaxAndFee } from "../api/airport.api";
import type { FlightFare } from "../api/flight.api";
import { calculateLegTaxAndFee, type LegTaxAndFee } from "../utils/taxAndFee";

type LoadState = {
  key: string;
  status: "loading" | "ready" | "error";
  configs: Record<string, TaxAndFee>;
  error?: string;
};

/** Tải một lần cho mỗi hãng trên hành trình, hủy kết quả cũ khi đổi chuyến/unmount. */
export function useTaxAndFee(fares: FlightFare[], count: number) {
  const key = JSON.stringify([...new Set(fares.map(fare => fare.airline.id ?? ""))].sort());
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<LoadState>({ key: "", status: "loading", configs: {} });
  useEffect(() => {
    const controller = new AbortController();
    const ids = JSON.parse(key) as string[];
    if (!ids.length || ids.some(id => !id)) {
      return () => controller.abort();
    }
    void Promise.all(ids.map(async id => {
      const response = await getTaxAndFee(id, controller.signal);
      return [id, response.data] as const;
    })).then(entries => {
      if (!controller.signal.aborted) setState({ key, status: "ready", configs: Object.fromEntries(entries) });
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      const message = isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : error instanceof Error ? error.message : undefined;
      setState({ key, status: "error", configs: {}, error: message || "Không tải được thuế và phí. Vui lòng thử lại." });
    });
    return () => controller.abort();
  }, [key, attempt]);
  const reload = useCallback(() => {
    setState({ key: "", status: "loading", configs: {} });
    setAttempt(value => value + 1);
  }, []);

  let error = state.key === key ? state.error : undefined;
  let legs: LegTaxAndFee[] = [];
  let total: number | null = null;
  let status = state.key === key ? state.status : "loading";
  if (!fares.length || fares.some(fare => !fare.airline.id)) {
    status = "error";
    error = "Chưa có mã hãng bay để tải thuế và phí. Vui lòng tải lại gói vé.";
  }
  if (status === "ready") {
    try {
      legs = fares.map(fare => calculateLegTaxAndFee(fare, count, state.configs[fare.airline.id!]));
      total = legs.reduce((sum, leg) => sum + leg.total, 0);
      if (!Number.isSafeInteger(total)) throw new Error("Tổng thuế và phí vượt giới hạn cho phép.");
    } catch (cause) {
      status = "error";
      legs = [];
      total = null;
      error = cause instanceof Error ? cause.message : "Cấu hình thuế và phí không hợp lệ.";
    }
  }
  return { status, error, legs, total, reload };
}
