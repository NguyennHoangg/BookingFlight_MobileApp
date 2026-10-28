import { useCallback, useEffect, useState, useMemo } from "react";
import { getFavorite, setFavorite } from "../api/bookingOptions.api";

interface FavoriteState {
  favorite: boolean;
  busy: boolean;
  error?: string;
}
/** Lưu trạng thái riêng theo flightId để response chậm không đổi trái tim của chặng khác. */
export function useFlightFavorite(flightId: string, authenticated: boolean) {
  const [values, setValues] = useState<Record<string, FavoriteState>>({});
  useEffect(() => {
    if (!authenticated) return;
    const controller = new AbortController();
    void getFavorite(flightId, controller.signal)
      .then((favorite) => {
        if (!controller.signal.aborted)
          setValues((old) => ({
            ...old,
            [flightId]: { favorite, busy: false },
          }));
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setValues((old) => ({
            ...old,
            [flightId]: {
              favorite: old[flightId]?.favorite ?? false,
              busy: false,
              error: "Chưa tải được trạng thái yêu thích.",
            },
          }));
      });
    return () => controller.abort();
  }, [flightId, authenticated]);
  const current = useMemo(
    () => values[flightId] ?? { favorite: false, busy: false },
    [values, flightId],
  );
  const toggle = useCallback(async () => {
    if (!authenticated || current.busy) return;
    setValues((old) => ({
      ...old,
      [flightId]: { ...current, busy: true, error: undefined },
    }));
    try {
      const favorite = await setFavorite(flightId, !current.favorite);
      setValues((old) => ({ ...old, [flightId]: { favorite, busy: false } }));
    } catch {
      setValues((old) => ({
        ...old,
        [flightId]: {
          ...current,
          busy: false,
          error: "Không thể cập nhật yêu thích. Vui lòng thử lại.",
        },
      }));
    }
  }, [authenticated, flightId, current]);
  return { ...current, toggle };
}
