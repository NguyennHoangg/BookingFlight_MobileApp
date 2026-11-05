import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFlightFavorite } from "../../hook/useFlightFavorite";
import { useAppSelector } from "../../store";
import { navigate } from "../../navigation/routes";

export default function FlightFavoriteButton({ flightId, iconOnly = false }: { flightId: string; iconOnly?: boolean }) {
  const authenticated = useAppSelector(state => state.auth.isAuthenticated);
  const favorite = useFlightFavorite(flightId, authenticated);
  const label = favorite.favorite ? "Bỏ yêu thích" : "Thêm vào yêu thích";
  return (
    <View className={iconOnly ? "ml-2 items-end" : "my-2"}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: favorite.busy, selected: favorite.favorite }}
        disabled={favorite.busy}
        onPress={event => {
          event.stopPropagation();
          if (!authenticated) { navigate("Login"); return; }
          void favorite.toggle();
        }}
        className={iconOnly
          ? "h-11 w-11 items-center justify-center rounded-full bg-blue-50"
          : "flex-row items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-3"}
      >
        {favorite.busy ? <ActivityIndicator size="small" color="#2563EB" /> : (
          <Ionicons name={favorite.favorite ? "heart" : "heart-outline"} size={iconOnly ? 23 : 18} color={favorite.favorite ? "#DC2626" : "#2563EB"} />
        )}
        {!iconOnly && <Text className="text-xs font-semibold text-blue-600">{label}</Text>}
      </Pressable>
      {!!favorite.error && <Text accessibilityRole="alert" className={`${iconOnly ? "max-w-[140px] " : ""}mt-2 text-xs text-red-600`}>{favorite.error}</Text>}
    </View>
  );
}
