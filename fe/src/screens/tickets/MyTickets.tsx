import { SafeAreaView } from 'react-native-safe-area-context';
import { shadows } from "../../styles/shadows";
import { navigate } from "../../navigation/routes";
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Clipboard, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';


// MOCK DATA: Kết hợp từ các bảng Booking, Ticket, Flight, Airline, Airport trong Prisma Schema
const MOCK_BOOKINGS = [
  // --- 2 CHUYẾN SẮP TỚI ---
  {
    id: 'bk-1',
    pnrCode: 'SJ8K2P',
    status: 'CONFIRMED', // BookingStatus
    totalAmount: 2345000,
    category: 'upcoming',
    flight: {
      flightNumber: 'VN123',
      departureTime: '08:30',
      arrivalTime: '10:40',
      date: 'Thứ Tư, 18/11/2026',
      duration: '2g 10p',
      type: 'Bay thẳng',
      statusTag: 'Đúng giờ',
      statusColor: 'text-green-600',
      departureAirport: { code: 'SGN', name: 'Tân Sơn Nhất' },
      arrivalAirport: { code: 'HAN', name: 'Nội Bài T1' },
      airline: { name: 'Vietnam Airlines', code: 'VN', logo: 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-Vietnam-Airlines-VNA.png' },
      aircraft: 'Airbus A321'
    },
    ticket: {
      passengerName: 'N. Minh Anh',
      seatClass: 'Thương gia', // SeatClass.BUSINESS
      seatNumber: '12A',
      baggage: '20kg ký gửi'
    }
  },
  {
    id: 'bk-2',
    pnrCode: 'QH9M4L',
    status: 'CONFIRMED', 
    totalAmount: 1420000,
    category: 'upcoming',
    flight: {
      flightNumber: 'QH204',
      departureTime: '14:15',
      arrivalTime: '15:40',
      date: 'Thứ Bảy, 12/12/2026',
      duration: '1g 25p',
      type: 'Bay thẳng',
      statusTag: 'Dự kiến chuẩn giờ',
      statusColor: 'text-gray-500',
      departureAirport: { code: 'HAN', name: 'Nội Bài T1' },
      arrivalAirport: { code: 'DAD', name: 'Đà Nẵng T1' },
      airline: { name: 'Bamboo Airways', code: 'QH', logo: 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-Bamboo-Airways-V.png' },
      aircraft: 'Embraer 190'
    },
    ticket: {
      passengerName: 'N. Minh Anh',
      seatClass: 'Phổ thông', // SeatClass.ECONOMY
      seatNumber: '08F',
      baggage: '07kg xách tay'
    }
  },
  // --- 1 CHUYẾN ĐÃ HOÀN THÀNH ---
  {
    id: 'bk-3',
    pnrCode: 'VJ882X',
    status: 'COMPLETED', // Tương đương FlightStatus.COMPLETED
    totalAmount: 1150000,
    category: 'completed',
    flight: {
      flightNumber: 'VJ168',
      departureTime: '09:00',
      arrivalTime: '10:15',
      date: 'Thứ Hai, 10/10/2026',
      duration: '1g 15p',
      type: 'Bay thẳng',
      statusTag: 'Đã hạ cánh',
      statusColor: 'text-gray-500',
      departureAirport: { code: 'DAD', name: 'Đà Nẵng T1' },
      arrivalAirport: { code: 'SGN', name: 'Tân Sơn Nhất' },
      airline: { name: 'Vietjet Air', code: 'VJ', logo: 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-Vietjet-Air.png' },
      aircraft: 'Airbus A321'
    },
    ticket: {
      passengerName: 'N. Minh Anh',
      seatClass: 'Phổ thông',
      seatNumber: '14B',
      baggage: '15kg ký gửi'
    }
  },
  // --- 1 CHUYẾN ĐÃ HỦY ---
  {
    id: 'bk-4',
    pnrCode: 'VN001C',
    status: 'CANCELLED', // BookingStatus.CANCELLED
    totalAmount: 1850000,
    category: 'cancelled',
    flight: {
      flightNumber: 'VN222',
      departureTime: '18:00',
      arrivalTime: '19:05',
      date: 'Chủ Nhật, 15/09/2026',
      duration: '1g 05p',
      type: 'Bay thẳng',
      statusTag: 'Đã hủy',
      statusColor: 'text-red-500',
      departureAirport: { code: 'SGN', name: 'Tân Sơn Nhất' },
      arrivalAirport: { code: 'PQC', name: 'Phú Quốc' },
      airline: { name: 'Vietnam Airlines', code: 'VN', logo: 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-Vietnam-Airlines-VNA.png' },
      aircraft: 'Boeing 787'
    },
    ticket: {
      passengerName: 'N. Minh Anh',
      seatClass: 'Phổ thông',
      seatNumber: '—',
      baggage: '23kg ký gửi'
    }
  }
];

export default function MyTicketsScreen() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');

  // Lọc danh sách theo tab hiện tại
  const filteredBookings = MOCK_BOOKINGS.filter(b => b.category === activeTab);
  // Đếm số lượng vé sắp tới cho Badge
  const upcomingCount = MOCK_BOOKINGS.filter(b => b.category === 'upcoming').length;

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' ₫';
  };

  const copyToClipboard = (text: string) => {
    // Trên web dùng navigator.clipboard.writeText, trên mobile dùng Clipboard
    Alert.alert('Thành công', `Đã sao chép mã PNR: ${text}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={["left", "right"]}>
      <View className="px-5 pb-4 bg-white">
        {/* TAB SWITCHER */}
        <View className="flex-row bg-gray-100 rounded-xl p-1 mt-4">
          <TouchableOpacity 
            className={`flex-1 py-2.5 flex-row items-center justify-center rounded-lg ${activeTab === 'upcoming' ? 'bg-[#2563EB]' : ''}`}
            style={activeTab === 'upcoming' ? shadows.small : undefined}
            onPress={() => setActiveTab('upcoming')}
          >
            <Text className={`font-semibold text-sm ${activeTab === 'upcoming' ? 'text-white' : 'text-gray-500'}`}>Sắp tới</Text>
            
          </TouchableOpacity>
          
          <TouchableOpacity 
            className={`flex-1 py-2.5 items-center justify-center rounded-lg ${activeTab === 'completed' ? 'bg-[#2563EB]' : ''}`}
            style={activeTab === 'completed' ? shadows.small : undefined}
            onPress={() => setActiveTab('completed')}
          >
            <Text className={`font-semibold text-sm ${activeTab === 'completed' ? 'text-white' : 'text-gray-500'}`}>Đã hoàn thành</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className={`flex-1 py-2.5 items-center justify-center rounded-lg ${activeTab === 'cancelled' ? 'bg-[#2563EB]' : ''}`}
            style={activeTab === 'cancelled' ? shadows.small : undefined}
            onPress={() => setActiveTab('cancelled')}
          >
            <Text className={`font-semibold text-sm ${activeTab === 'cancelled' ? 'text-white' : 'text-gray-500'}`}>Đã hủy</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-5 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* DANH SÁCH VÉ */}
        {filteredBookings.length > 0 ? (
          filteredBookings.map((booking) => (
            <View key={booking.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 mb-5 p-5">
              
              {/* Top: Hãng bay & Trạng thái */}
              <View className="flex-row justify-between items-start mb-4">
                <View className="flex-row items-center flex-1 pr-2">
                  <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center border border-blue-100">
                    <Ionicons name="airplane" size={20} color="#2563EB" />
                  </View>
                  <View className="ml-3 flex-1">
                    <View className="flex-row items-center">
                      <Text className="font-bold text-gray-900 text-base mr-2">{booking.flight.airline.name}</Text>
                      <View className="bg-blue-50 px-1.5 py-0.5 rounded">
                        <Text className="text-[10px] font-bold text-blue-600">{booking.flight.flightNumber}</Text>
                      </View>
                    </View>
                    <Text className="text-xs text-gray-500 mt-0.5">{booking.flight.aircraft} • {booking.ticket.seatClass}</Text>
                  </View>
                </View>
                
                <View className={`px-2.5 py-1.5 rounded-full flex-row items-center border ${
                  booking.status === 'CONFIRMED' ? 'bg-emerald-50 border-emerald-100' :
                  booking.status === 'CANCELLED' ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-200'
                }`}>
                  <View className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    booking.status === 'CONFIRMED' ? 'bg-emerald-500' :
                    booking.status === 'CANCELLED' ? 'bg-red-500' : 'bg-gray-400'
                  }`} />
                  <Text className={`text-[10px] font-bold ${
                    booking.status === 'CONFIRMED' ? 'text-emerald-700' :
                    booking.status === 'CANCELLED' ? 'text-red-700' : 'text-gray-600'
                  }`}>
                    {booking.status === 'CONFIRMED' ? 'Đã xác nhận' : 
                     booking.status === 'CANCELLED' ? 'Đã hủy' : 'Hoàn thành'}
                  </Text>
                </View>
              </View>

              {/* Date & PNR */}
              <View className="flex-row items-center justify-between py-3 border-y border-gray-50 mb-4">
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={16} color="#2563EB" />
                  <Text className="text-sm font-bold text-gray-800 ml-2">{booking.flight.date}</Text>
                </View>
                <TouchableOpacity 
                  className="flex-row items-center bg-gray-50 px-2 py-1 rounded border border-gray-200"
                  onPress={() => copyToClipboard(booking.pnrCode)}
                >
                  <Text className="text-[10px] text-gray-500 mr-1">Mã PNR:</Text>
                  <Text className="text-[12px] font-black text-blue-700 mr-1.5 tracking-wider">{booking.pnrCode}</Text>
                  <Ionicons name="copy-outline" size={12} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Tuyến bay (SGN -> HAN) */}
              <View className="flex-row justify-between items-center mb-5">
                <View className="items-start">
                  <Text className="text-2xl font-black text-gray-900">{booking.flight.departureTime}</Text>
                  <Text className="font-bold text-blue-600 text-lg mt-0.5">{booking.flight.departureAirport.code}</Text>
                  <Text className="text-xs text-gray-500 mt-0.5">{booking.flight.departureAirport.name}</Text>
                </View>

                <View className="flex-1 px-4 items-center justify-center relative">
                  <Text className="text-[10px] text-gray-500 mb-1 font-medium">{booking.flight.duration} • {booking.flight.type}</Text>
                  <View className="flex-row items-center w-full relative">
                    <View className="w-1.5 h-1.5 rounded-full border border-blue-600 bg-white" />
                    <View className="flex-1 h-[1px] border-b border-dashed border-gray-300 mx-1" />
                    <View className="bg-blue-600 w-6 h-6 rounded-full items-center justify-center shadow-sm relative z-10 mx-1">
                      <Ionicons name="airplane" size={14} color="white" />
                    </View>
                    <View className="flex-1 h-[1px] border-b border-dashed border-gray-300 mx-1" />
                    <View className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  </View>
                  <Text className={`text-[10px] font-bold mt-2 ${booking.flight.statusColor}`}>{booking.flight.statusTag}</Text>
                </View>

                <View className="items-end">
                  <Text className="text-2xl font-black text-gray-900">{booking.flight.arrivalTime}</Text>
                  <Text className="font-bold text-blue-600 text-lg mt-0.5">{booking.flight.arrivalAirport.code}</Text>
                  <Text className="text-xs text-gray-500 mt-0.5">{booking.flight.arrivalAirport.name}</Text>
                </View>
              </View>

              {/* Thông tin khách hàng (3 cột) */}
              <View className="flex-row bg-gray-50 rounded-2xl py-3 px-2 border border-gray-100 mb-4">
                <View className="flex-1 items-center border-r border-gray-200">
                  <Text className="text-[10px] text-gray-500 font-medium mb-1">Hành khách</Text>
                  <Text className="text-xs font-bold text-gray-900">{booking.ticket.passengerName}</Text>
                </View>
                <View className="flex-1 items-center border-r border-gray-200">
                  <Text className="text-[10px] text-gray-500 font-medium mb-1">Số ghế</Text>
                  <Text className="text-xs font-bold text-blue-600">{booking.ticket.seatNumber}</Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-[10px] text-gray-500 font-medium mb-1">Hành lý</Text>
                  <Text className="text-xs font-bold text-gray-900">{booking.ticket.baggage}</Text>
                </View>
              </View>

              {/* Nét đứt phân cách */}
              <View className="w-full border-t border-dashed border-gray-200 mb-4" />

              {/* Bottom: Giá tiền & Nút xem chi tiết */}
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-[10px] text-gray-500 font-medium mb-0.5">Tổng thanh toán</Text>
                  <Text className="text-lg font-black text-gray-900">{formatCurrency(booking.totalAmount)}</Text>
                </View>
                <TouchableOpacity 
                  className={`px-5 py-2.5 rounded-xl border flex-row items-center ${
                    booking.status === 'CONFIRMED' ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                  }`}
                  style={booking.status !== 'CONFIRMED' ? shadows.small : undefined}
                  onPress={() => navigate('TicketDetail', { bookingId: booking.id })}
                >
                  <Text className={`font-bold text-sm mr-1 ${booking.status === 'CONFIRMED' ? 'text-blue-700' : 'text-gray-700'}`}>Chi tiết vé</Text>
                  <Ionicons name="chevron-forward" size={16} color={booking.status === 'CONFIRMED' ? '#1D4ED8' : '#374151'} />
                </TouchableOpacity>
              </View>

            </View>
          ))
        ) : (
          <View className="items-center justify-center py-20">
            <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
            <Text className="text-base font-bold text-gray-400 mt-4">Không có vé nào trong mục này</Text>
          </View>
        )}

        {/* CÁC BANNER QUẢNG CÁO & HỖ TRỢ (Chỉ hiện ở Sắp tới / Hoàn thành) */}
        {activeTab !== 'cancelled' && (
          <>
            <View className="bg-[#2563EB] rounded-3xl p-5 mb-4 shadow-sm border border-blue-600 relative overflow-hidden">
              <View className="flex-row items-center bg-white/20 self-start px-2.5 py-1 rounded-full mb-3">
                <Ionicons name="compass-outline" size={14} color="white" />
                <Text className="text-white text-[10px] font-bold ml-1">ƯU ĐÃI CHẶNG BAY MỚI</Text>
              </View>
              <Text className="text-white text-xl font-bold mb-2">Lên kế hoạch cho hành trình tiếp theo?</Text>
              <Text className="text-blue-100 text-xs mb-4">Hơn 120 điểm đến nội địa và quốc tế đang chờ đón bạn.</Text>
              <TouchableOpacity className="bg-white rounded-xl py-3 px-4 flex-row items-center justify-center self-start shadow-sm">
                <Text className="font-bold text-blue-700 mr-2 text-sm">Tìm vé ngay</Text>
                <Ionicons name="arrow-forward" size={16} color="#1D4ED8" />
              </TouchableOpacity>
            </View>

            <View className="bg-white border border-gray-100 shadow-sm rounded-3xl p-5 mb-5 flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 pr-4">
                <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center">
                  <Ionicons name="headset-outline" size={20} color="#2563EB" />
                </View>
                <Text className="text-sm font-medium text-gray-700 ml-3 leading-5">Cần trợ giúp đổi chuyến hoặc hoàn vé?</Text>
              </View>
              <TouchableOpacity>
                <Text className="text-blue-600 font-bold text-sm text-center">Hỗ trợ{'\n'}24/7</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
