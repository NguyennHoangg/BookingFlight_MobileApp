import AppHeader from '../../components/common/AppHeader';
import { goBack, readRouteData } from "../../navigation/routes";
import { useLocalSearchParams } from "expo-router";
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';


// Dữ liệu mẫu khớp với booking trong MyTickets
const MOCK_TICKETS: Record<string, any> = {
  'bk-1': {
    id: 'bk-1',
    pnrCode: 'SJ8K2P',
    status: 'CONFIRMED',
    statusText: 'Đã xác nhận',
    totalAmount: 2345000,
    gate: '04',
    terminal: 'T1',
    boardingTime: '07:50',
    flight: {
      flightNumber: 'VN123',
      departureTime: '08:30',
      arrivalTime: '10:40',
      date: 'Thứ Tư, 18/11/2026',
      duration: '2g 10p',
      departureAirport: { code: 'SGN', name: 'Tân Sơn Nhất', city: 'Hồ Chí Minh' },
      arrivalAirport: { code: 'HAN', name: 'Nội Bài', city: 'Hà Nội' },
      airline: { name: 'Vietnam Airlines', code: 'VN', logo: 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-Vietnam-Airlines-VNA.png' },
      aircraft: 'Airbus A321'
    },
    ticket: {
      passengerName: 'NGUYEN MINH ANH',
      seatClass: 'Thương gia',
      seatNumber: '12A',
      baggage: '20kg ký gửi + 7kg xách tay'
    }
  },
  'bk-2': {
    id: 'bk-2',
    pnrCode: 'QH9M4L',
    status: 'CONFIRMED',
    statusText: 'Đã xác nhận',
    totalAmount: 1420000,
    gate: '12',
    terminal: 'T1',
    boardingTime: '13:35',
    flight: {
      flightNumber: 'QH204',
      departureTime: '14:15',
      arrivalTime: '15:40',
      date: 'Thứ Bảy, 12/12/2026',
      duration: '1g 25p',
      departureAirport: { code: 'HAN', name: 'Nội Bài', city: 'Hà Nội' },
      arrivalAirport: { code: 'DAD', name: 'Đà Nẵng', city: 'Đà Nẵng' },
      airline: { name: 'Bamboo Airways', code: 'QH', logo: 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-Bamboo-Airways-V.png' },
      aircraft: 'Embraer 190'
    },
    ticket: {
      passengerName: 'NGUYEN MINH ANH',
      seatClass: 'Phổ thông',
      seatNumber: '08F',
      baggage: '07kg xách tay'
    }
  }
};

export default function TicketDetailScreen() {
  const { data, bookingId: directId } = useLocalSearchParams<{ data?: string; bookingId?: string }>();
  const params = readRouteData(data);
  const bookingId = params && typeof params === 'object' && 'bookingId' in params && typeof params.bookingId === 'string' ? params.bookingId : directId;

  const ticketData = bookingId ? MOCK_TICKETS[bookingId] : undefined;
  if (!ticketData) return (
    <SafeAreaView edges={['left', 'right', 'bottom']} className="flex-1 bg-white">
      <AppHeader title="Thẻ lên máy bay" back />
      <View className="flex-1 items-center justify-center">
        <Text>Không tìm thấy vé.</Text>
        <TouchableOpacity onPress={goBack}><Text className="text-blue-600 p-4">Quay lại</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
  const { flight, ticket } = ticketData;

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' ₫';
  };

  const handleDownload = () => {
    Alert.alert('Thành công', 'Vé điện tử đã được lưu vào thiết bị của bạn.');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0F172A]" edges={['left', 'right']}>
      <AppHeader
        title="Thẻ lên máy bay"
        back
        action={{ label: "Chia sẻ vé", icon: "share-social-outline", onPress: () => Alert.alert('Chia sẻ', `Mã đặt chỗ: ${ticketData.pnrCode}`) }}
      />

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* BOARDING PASS CARD */}
        <View className="bg-white rounded-3xl overflow-hidden shadow-2xl mt-2">
          {/* Top banner / Airline header */}
          <View className="p-5 bg-gradient-to-r from-blue-600 to-indigo-700 bg-blue-600">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center space-x-3">
                <View className="w-10 h-10 rounded-xl bg-white p-1.5 items-center justify-center">
                  <Image source={{ uri: flight.airline.logo }} className="w-full h-full" resizeMode="contain" />
                </View>
                <View className="ml-3">
                  <Text className="text-white font-bold text-base">{flight.airline.name}</Text>
                  <Text className="text-blue-100 text-xs">{flight.aircraft} • {flight.flightNumber}</Text>
                </View>
              </View>
              <View className="bg-blue-500/60 px-3 py-1 rounded-full border border-blue-400">
                <Text className="text-white text-xs font-semibold">{ticketData.statusText}</Text>
              </View>
            </View>
          </View>

          {/* Flight Route Details */}
          <View className="p-5">
            <View className="flex-row items-center justify-between">
              {/* Departure */}
              <View className="items-start flex-1">
                <Text className="text-3xl font-black text-gray-900">{flight.departureAirport.code}</Text>
                <Text className="text-sm font-semibold text-gray-700 mt-0.5">{flight.departureAirport.city}</Text>
                <Text className="text-2xl font-bold text-blue-600 mt-2">{flight.departureTime}</Text>
                <Text className="text-xs text-gray-500 mt-0.5">{flight.date}</Text>
              </View>

              {/* Plane & Duration */}
              <View className="items-center px-2">
                <Text className="text-xs font-semibold text-gray-500 mb-1">{flight.duration}</Text>
                <View className="flex-row items-center w-24">
                  <View className="h-[2px] bg-blue-200 flex-1" />
                  <Ionicons name="airplane" size={18} color="#2563EB" className="mx-1" />
                  <View className="h-[2px] bg-blue-200 flex-1" />
                </View>
                <Text className="text-[10px] text-green-600 font-medium mt-1">Bay thẳng</Text>
              </View>

              {/* Arrival */}
              <View className="items-end flex-1">
                <Text className="text-3xl font-black text-gray-900">{flight.arrivalAirport.code}</Text>
                <Text className="text-sm font-semibold text-gray-700 mt-0.5">{flight.arrivalAirport.city}</Text>
                <Text className="text-2xl font-bold text-blue-600 mt-2">{flight.arrivalTime}</Text>
                <Text className="text-xs text-gray-500 mt-0.5">{flight.date}</Text>
              </View>
            </View>

            {/* Flight Key Info Grid */}
            <View className="grid grid-cols-3 bg-gray-50 rounded-2xl p-4 mt-5 flex-row justify-between">
              <View className="items-center flex-1">
                <Text className="text-xs text-gray-500 font-medium">CỬA (GATE)</Text>
                <Text className="text-lg font-black text-gray-900 mt-0.5">{ticketData.gate}</Text>
              </View>
              <View className="w-[1px] bg-gray-200" />
              <View className="items-center flex-1">
                <Text className="text-xs text-gray-500 font-medium">LÊN MÁY BAY</Text>
                <Text className="text-lg font-black text-blue-600 mt-0.5">{ticketData.boardingTime}</Text>
              </View>
              <View className="w-[1px] bg-gray-200" />
              <View className="items-center flex-1">
                <Text className="text-xs text-gray-500 font-medium">GHẾ</Text>
                <Text className="text-lg font-black text-gray-900 mt-0.5">{ticket.seatNumber}</Text>
              </View>
            </View>
          </View>

          {/* Dotted Notch Cutout Divider */}
          <View className="relative w-full h-8 justify-center overflow-hidden">
            <View className="absolute -left-4 w-8 h-8 rounded-full bg-[#0F172A]" />
            <View className="w-full border-t-2 border-dashed border-gray-200" />
            <View className="absolute -right-4 w-8 h-8 rounded-full bg-[#0F172A]" />
          </View>

          {/* Passenger & Ticket Info */}
          <View className="p-5 pt-1">
            <View className="flex-row justify-between mb-4">
              <View>
                <Text className="text-xs text-gray-400 font-semibold uppercase">Hành khách</Text>
                <Text className="text-base font-bold text-gray-900 mt-0.5">{ticket.passengerName}</Text>
              </View>
              <View className="items-end">
                <Text className="text-xs text-gray-400 font-semibold uppercase">Hạng vé</Text>
                <Text className="text-base font-bold text-blue-600 mt-0.5">{ticket.seatClass}</Text>
              </View>
            </View>

            <View className="flex-row justify-between mb-4">
              <View>
                <Text className="text-xs text-gray-400 font-semibold uppercase">Hành lý</Text>
                <Text className="text-sm font-semibold text-gray-800 mt-0.5">{ticket.baggage}</Text>
              </View>
              <View className="items-end">
                <Text className="text-xs text-gray-400 font-semibold uppercase">Mã đặt chỗ (PNR)</Text>
                <Text className="text-base font-black text-indigo-600 tracking-wider mt-0.5">{ticketData.pnrCode}</Text>
              </View>
            </View>

            {/* Barcode Simulation */}
            <View className="items-center justify-center p-4 bg-gray-50 rounded-2xl mt-2 border border-gray-100">
              <View className="flex-row h-14 items-center justify-center w-full px-4">
                {[4, 2, 6, 2, 8, 4, 2, 6, 4, 8, 2, 4, 6, 2, 8, 4, 2, 6, 2, 4, 8, 2, 6, 4, 8].map((w, idx) => (
                  <View
                    key={idx}
                    style={{ width: w, height: '100%', backgroundColor: '#1E293B', marginRight: idx % 2 === 0 ? 3 : 2 }}
                  />
                ))}
              </View>
              <Text className="text-xs text-gray-500 font-mono tracking-widest mt-2">
                {ticketData.pnrCode} • {flight.flightNumber} • {ticket.seatNumber}
              </Text>
            </View>

            {/* Price Info */}
            <View className="flex-row items-center justify-between mt-5 pt-4 border-t border-gray-100">
              <Text className="text-gray-500 font-medium">Tổng thanh toán</Text>
              <Text className="text-xl font-black text-blue-600">{formatCurrency(ticketData.totalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* ACTION BUTTON */}
        <TouchableOpacity
          onPress={handleDownload}
          className="bg-blue-600 py-4 rounded-2xl flex-row items-center justify-center mt-6 shadow-lg shadow-blue-500/30"
        >
          <Ionicons name="download-outline" size={20} color="#FFFFFF" className="mr-2" />
          <Text className="text-white font-bold text-base ml-2">Tải vé điện tử (PDF)</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
