import { useCallback, useRef, useState, useMemo } from "react";
import { useFocusEffect } from "expo-router";
import { getFavorite, setFavorite } from "../api/bookingOptions.api";

interface FavoriteState {
  favorite: boolean;
  busy: boolean;
  error?: string;
}
/** Lưu trạng thái riêng theo flightId để response chậm không đổi trái tim của chặng khác. */
export function useFlightFavorite(flightId: string, authenticated: boolean) {
  const [values, setValues] = useState<Record<string, FavoriteState>>({});
  const pending = useRef(new Set<string>());
  const updates = useRef(new Map<string, Promise<boolean>>());
  const active = useRef<AbortController | null>(null);
  useFocusEffect(useCallback(() => {
    if (!authenticated) { setValues({}); return; }
    const controller = new AbortController();
    active.current = controller;
    setValues(old => ({ ...old, [flightId]: { favorite: old[flightId]?.favorite ?? false, busy: true } }));
    const update = updates.current.get(flightId);
    const read = update
      ? update.catch(() => undefined).then(() => getFavorite(flightId, controller.signal))
      : getFavorite(flightId, controller.signal);
    void read
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
  }, [flightId, authenticated]));
  const current = useMemo(
    () => values[flightId] ?? { favorite: false, busy: authenticated },
    [values, flightId, authenticated],
  );
  const toggle = useCallback(async () => {
    if (!authenticated || current.busy || pending.current.has(flightId)) return;
    pending.current.add(flightId);
    const controller = active.current;
    setValues((old) => ({
      ...old,
      [flightId]: { ...current, busy: true, error: undefined },
    }));
    try {
      const previous = current.error ? await getFavorite(flightId, controller?.signal) : current.favorite;
      if (controller?.signal.aborted) return;
      const update = setFavorite(flightId, !previous);
      updates.current.set(flightId, update);
      const favorite = await update;
      if (controller?.signal.aborted) return;
      setValues((old) => ({ ...old, [flightId]: { favorite, busy: false } }));
    } catch {
      if (controller?.signal.aborted) return;
      setValues((old) => ({
        ...old,
        [flightId]: {
          ...current,
          busy: false,
          error: "Không thể cập nhật yêu thích. Vui lòng thử lại.",
        },
      }));
    } finally { pending.current.delete(flightId); updates.current.delete(flightId); }
  }, [authenticated, flightId, current]);
  return { ...current, toggle };
}
