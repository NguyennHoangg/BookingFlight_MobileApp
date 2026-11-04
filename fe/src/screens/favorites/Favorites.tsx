import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getFavoriteFlights, setFavorite, type FavoriteFlight } from "../../api/bookingOptions.api";
import { navigate } from "../../navigation/routes";
import { useAppSelector } from "../../store";
import { flightDate, flightTime } from "../../utils/fare";

export default function FavoritesScreen() {
  const userId = useAppSelector(state => state.auth.user?.id);
  const [favorites, setFavorites] = useState<FavoriteFlight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState<string[]>([]);
  const request = useRef<AbortController | null>(null);
  const pending = useRef(new Set<string>());
  const focusVersion = useRef(0);
  const load = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    if (!userId) { setFavorites([]); setError(""); setLoading(false); return; }
    setLoading(true);
    setError("");
    try {
      const rows = await getFavoriteFlights(controller.signal);
      if (!controller.signal.aborted) setFavorites(rows);
    } catch {
      if (!controller.signal.aborted) setError("Không thể tải chuyến bay yêu thích. Vui lòng thử lại.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [userId]);
  useFocusEffect(useCallback(() => {
    focusVersion.current += 1;
    setFavorites([]);
    void load();
    return () => { focusVersion.current += 1; request.current?.abort(); };
  }, [load]));
  const remove = async (id: string) => {
    if (pending.current.has(id)) return;
    pending.current.add(id);
    setRemoving([...pending.current]);
    setError("");
    const version = focusVersion.current;
    try {
      await setFavorite(id, false);
      if (version !== focusVersion.current) return;
      await load();
    } catch {
      if (version === focusVersion.current)
        setError("Chưa bỏ được yêu thích. Vui lòng thử lại.");
    } finally {
      pending.current.delete(id);
      setRemoving([...pending.current]);
    }
  };
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["left", "right"]}>
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingTop: 20, paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}>
        <Text className="text-2xl font-bold text-gray-900">Chuyến bay yêu thích</Text>
        <Text className="mb-5 mt-2 text-sm text-gray-500">{favorites.length} chuyến đã lưu</Text>
        {!userId && <Pressable onPress={() => navigate("Login")} className="rounded-xl bg-blue-600 p-4"><Text className="text-center font-bold text-white">Đăng nhập để xem yêu thích</Text></Pressable>}
        {!!error && <View className="mb-4 rounded-xl bg-red-50 p-4"><Text accessibilityRole="alert" className="text-red-600">{error}</Text><Pressable onPress={() => void load()} className="mt-3"><Text className="font-bold text-blue-600">Tải lại</Text></Pressable></View>}
        {loading && !favorites.length && <ActivityIndicator color="#2563EB" />}
        {!!userId && !loading && !error && !favorites.length && <View className="items-center py-12"><Ionicons name="heart-outline" size={44} color="#94A3B8" /><Text className="my-4 text-gray-500">Bạn chưa lưu chuyến bay nào.</Text><Pressable onPress={() => navigate("Home")}><Text className="font-bold text-blue-600">Tìm chuyến bay</Text></Pressable></View>}
        {favorites.map(flight => (
          <View key={flight.flightId} className="mb-4 rounded-2xl border border-gray-100 bg-white p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1"><Text className="font-bold text-gray-900">{flight.airlineName}</Text><Text className="mt-1 text-xs text-gray-500">{flight.flightNumber} · {flight.aircraft}</Text></View>
              <Pressable accessibilityRole="button" accessibilityLabel={`Bỏ yêu thích ${flight.flightNumber}`} disabled={removing.includes(flight.flightId)} onPress={() => void remove(flight.flightId)} className="p-3">
                {removing.includes(flight.flightId) ? <ActivityIndicator color="#DC2626" /> : <Ionicons name="heart" size={24} color="#DC2626" />}
              </Pressable>
            </View>
            <Text className="mt-4 text-xl font-bold text-gray-900">{flight.departureCode} → {flight.arrivalCode}</Text>
            <Text className="mt-1 text-sm text-gray-500">{flight.departureCity} → {flight.arrivalCity}</Text>
            <Text className="mt-3 text-sm text-gray-700">{flightDate(flight.departureTime)} · {flightTime(flight.departureTime)} – {flightTime(flight.arrivalTime)}</Text>
            <Text className="mt-2 text-xs text-gray-500">{flight.status === "SCHEDULED" ? "Đã lên lịch" : flight.status === "CANCELLED" ? "Đã hủy" : "Lịch bay đã thay đổi"}</Text>
            <Pressable accessibilityRole="button" onPress={() => navigate("FlightDetail", { flightId: flight.flightId })} className="mt-4 rounded-xl bg-blue-50 p-3"><Text className="text-center font-bold text-blue-600">Xem chi tiết và giá vé</Text></Pressable>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
