import { useEffect, useMemo, useState, useCallback } from "react";
import { isAxiosError } from "axios";
import { getFlightFares, type FlightFare } from "../api/flight.api";
import { calculateFareTotal, resolveSelectedFare } from "../utils/fare";

export interface FareLegRequest {
  flightId: string;
  preferredFareId?: string;
}
type LoadState = {
  status: "loading" | "ready" | "error";
  options: FlightFare[][];
  error?: string;
};

/**
 * Tách việc tải tồn chỗ/giá mới khỏi UI. Mỗi lần đổi hành trình sẽ hủy request cũ,
 * tránh response của chặng trước ghi đè giá/chặng đang được xem.
 */
export function useFareSelection(legs: FareLegRequest[], count: number) {
  const [state, setState] = useState<LoadState>({
    status: "loading",
    options: [],
  });
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void Promise.all(
      legs.map((leg) => getFlightFares(leg.flightId, count, controller.signal)),
    )
      .then((options) => {
        if (!controller.signal.aborted) setState({ status: "ready", options });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const message = isAxiosError<{ message?: string }>(error)
          ? error.response?.data?.message
          : undefined;
        setState({
          status: "error",
          options: [],
          error:
            message ||
            "Không tải được gói vé. Vui lòng kiểm tra kết nối và thử lại.",
        });
      });
    return () => controller.abort();
  }, [legs, count, version]);

  const selected = useMemo(
    () =>
      legs.map((leg, index) =>
        resolveSelectedFare(
          state.options[index] ?? [],
          choices[leg.flightId] ?? leg.preferredFareId,
          count,
        ),
      ),
    [legs, state.options, choices, count],
  );
  const select = useCallback(
    (fare: FlightFare) =>
      setChoices((previous) => ({
        ...previous,
        [fare.flightId]: fare.ticket.fareClassId,
      })),
    [],
  );
  const reload = useCallback(() => {
    setState({ status: "loading", options: [] });
    setVersion((value) => value + 1);
  }, []);
  return {
    ...state,
    selected,
    select,
    reload,
    total:
      state.status === "ready" ? calculateFareTotal(selected, count) : null,
  };
}
