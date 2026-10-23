import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MOCK_TICKETS = [
  {
    id: "1",
    from: "HAN",
    to: "SGN",
    fromCity: "Hà Nội",
    toCity: "TP. HCM",
    date: "25/10/2026",
    time: "07:00 → 09:20",
    airline: "Vietnam Airlines",
    code: "VN123",
    status: "upcoming",
    price: "1.250.000đ",
  },
  {
    id: "2",
    from: "SGN",
    to: "DAD",
    fromCity: "TP. HCM",
    toCity: "Đà Nẵng",
    date: "15/09/2026",
    time: "14:30 → 16:00",
    airline: "VietJet Air",
    code: "VJ456",
    status: "completed",
    price: "680.000đ",
  },
];

const statusConfig = {
  upcoming: { label: "Sắp tới", bg: "bg-primary-light", text: "text-primary" },
  completed: { label: "Đã hoàn thành", bg: "bg-slate-100", text: "text-slate-500" },
  cancelled: { label: "Đã hủy", bg: "bg-red-50", text: "text-red-500" },
};

export default function MyTicketsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-white px-5 pt-4 pb-4 border-b border-slate-100">
        <Text className="text-slate-900 text-xl font-extrabold">Vé của tôi 🎫</Text>
        <Text className="text-slate-400 text-sm mt-0.5">Quản lý hành trình của bạn</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="px-4 pt-4">
        {MOCK_TICKETS.map((ticket) => {
          const status = statusConfig[ticket.status as keyof typeof statusConfig];
          return (
            <TouchableOpacity
              key={ticket.id}
              className="bg-white rounded-2xl mb-4 overflow-hidden shadow-sm"
              activeOpacity={0.85}
            >
              {/* Ticket top */}
              <View className="px-5 pt-4 pb-3">
                <View className="flex-row justify-between items-start mb-3">
                  <Text className="text-slate-400 text-xs font-semibold">{ticket.airline}</Text>
                  <View className={`px-3 py-1 rounded-full ${status.bg}`}>
                    <Text className={`text-xs font-bold ${status.text}`}>{status.label}</Text>
                  </View>
                </View>

                {/* Route */}
                <View className="flex-row items-center justify-between">
                  <View className="items-start">
                    <Text className="text-slate-900 text-3xl font-extrabold">{ticket.from}</Text>
                    <Text className="text-slate-400 text-xs mt-0.5">{ticket.fromCity}</Text>
                  </View>
                  <View className="items-center flex-1 px-4">
                    <Text className="text-primary text-xl">✈️</Text>
                    <View className="flex-row items-center mt-1">
                      <View className="flex-1 h-px bg-slate-200" />
                    </View>
                    <Text className="text-slate-400 text-xs mt-1">{ticket.time}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-slate-900 text-3xl font-extrabold">{ticket.to}</Text>
                    <Text className="text-slate-400 text-xs mt-0.5">{ticket.toCity}</Text>
                  </View>
                </View>
              </View>

              {/* Divider with notches */}
              <View className="flex-row items-center px-2">
                <View className="w-4 h-4 rounded-full bg-slate-100" />
                <View className="flex-1 border-t border-dashed border-slate-200 mx-1" />
                <View className="w-4 h-4 rounded-full bg-slate-100" />
              </View>

              {/* Ticket bottom */}
              <View className="flex-row justify-between items-center px-5 py-3">
                <View>
                  <Text className="text-slate-400 text-xs">Ngày bay</Text>
                  <Text className="text-slate-800 font-semibold text-sm">{ticket.date}</Text>
                </View>
                <View>
                  <Text className="text-slate-400 text-xs">Mã vé</Text>
                  <Text className="text-slate-800 font-semibold text-sm">{ticket.code}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-slate-400 text-xs">Tổng tiền</Text>
                  <Text className="text-primary font-extrabold text-sm">{ticket.price}</Text>
                </View>
              </View>

              {ticket.status === "upcoming" && (
                <TouchableOpacity className="bg-primary-light mx-4 mb-4 rounded-xl py-3 items-center">
                  <Text className="text-primary font-bold text-sm">Xem thẻ lên máy bay</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        })}

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
