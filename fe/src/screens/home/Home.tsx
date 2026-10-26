import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// 1. MOCK DATA SÂN BAY
export const MOCK_AIRPORTS = [
  { code: 'SGN', city: 'TP. Hồ Chí Minh', name: 'Sân bay Tân Sơn Nhất' },
  { code: 'HAN', city: 'Hà Nội', name: 'Sân bay Nội Bài' },
  { code: 'DAD', city: 'Đà Nẵng', name: 'Sân bay Quốc tế Đà Nẵng' },
  { code: 'CXR', city: 'Nha Trang', name: 'Sân bay Cam Ranh' },
  { code: 'PQC', city: 'Phú Quốc', name: 'Sân bay Phú Quốc' },
];

// 2. MOCK DATA CHUYẾN BAY
const MOCK_FLIGHT_DEALS = [
  {
    id: '1',
    airlineName: 'Vietnam Airlines',
    flightCode: 'VN123',
    tag: 'Ưu đãi hot',
    tagColor: 'bg-red-100 text-red-600',
    departureTime: '08:30',
    departureAirport: 'SGN',
    departureCity: 'TP.HCM',
    arrivalTime: '10:40',
    arrivalAirport: 'HAN',
    arrivalCity: 'Hà Nội',
    duration: '2g 10p',
    type: 'Bay thẳng',
    baggageInfo: 'Bao gồm 23kg hành lý',
    price: '1.850.000',
    logoUrl: 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-Vietnam-Airlines-VNA.png'
  },
  {
    id: '2',
    airlineName: 'Vietjet Air',
    flightCode: 'VJ628',
    tag: 'Giá tốt',
    tagColor: 'bg-blue-100 text-blue-600',
    departureTime: '14:15',
    departureAirport: 'SGN',
    departureCity: 'TP.HCM',
    arrivalTime: '15:35',
    arrivalAirport: 'DAD',
    arrivalCity: 'Đà Nẵng',
    duration: '1g 20p',
    type: 'Bay thẳng',
    baggageInfo: 'Hành lý xách tay 7kg',
    price: '1.120.000',
    logoUrl: 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-Vietjet-Air.png'
  }
];

export default function Home() {
  const navigation = useNavigation();

  const [tripType, setTripType] = useState<'mot-chieu' | 'khu-hoi'>('khu-hoi');
  const [departure, setDeparture] = useState(MOCK_AIRPORTS[0]);
  const [arrival, setArrival] = useState(MOCK_AIRPORTS[1]);

  const [departDateRaw, setDepartDateRaw] = useState('2026-10-24');
  const [returnDateRaw, setReturnDateRaw] = useState('2026-10-27');

  const [passengers, setPassengers] = useState('1 Người lớn');
  const [seatClass, setSeatClass] = useState('Phổ thông');

  const departInputRef = useRef<HTMLInputElement>(null);
  const returnInputRef = useRef<HTMLInputElement>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectingType, setSelectingType] = useState<'departure' | 'arrival'>('departure');

  // Đổi chiều sân bay
  const handleSwapAirports = () => {
    const temp = departure;
    setDeparture(arrival);
    setArrival(temp);
  };

  const handleOpenSelectAirport = (type: 'departure' | 'arrival') => {
    setSelectingType(type);
    setModalVisible(true);
  };

  const handleSelectAirport = (airport: typeof MOCK_AIRPORTS[0]) => {
    if (selectingType === 'departure') {
      setDeparture(airport);
    } else {
      setArrival(airport);
    }
    setModalVisible(false);
  };

  const formatDateVN = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const dayOfWeek = days[date.getDay()];
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${dayOfWeek}, ${day} Th${month}`;
  };

  const handleSearch = () => {
    navigation.navigate('Search' as never, {
      tripType,
      departure,
      arrival,
      departDate: departDateRaw,
      returnDate: tripType === 'khu-hoi' ? returnDateRaw : null,
      passengers,
      seatClass,
    } as never);
  };

  const openPicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    if (ref.current) {
      if (typeof ref.current.showPicker === 'function') {
        ref.current.showPicker();
      } else {
        ref.current.click();
      }
    }
  };

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }}
      >
        {/* HEADER */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
          <View className="flex-row items-center">
            <Image
              source={{ uri: 'https://i.pravatar.cc/150?img=32' }}
              className="w-12 h-12 rounded-full mr-3"
            />
            <View>
              <Text className="text-gray-800 text-lg font-bold">Chào buổi sáng! 👋</Text>
              <Text className="text-gray-500 text-sm">Khám phá thế giới cùng SkyJourney</Text>
            </View>
          </View>
          <TouchableOpacity className="relative bg-white p-2 rounded-full border border-gray-100 shadow-sm">
            <Ionicons name="notifications-outline" size={24} color="#4B5563" />
            <View className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
          </TouchableOpacity>
        </View>

        {/* SEARCH FLIGHT CARD */}
        <View className="mx-5 mt-4 bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
          
          {/* Trip Type Toggle */}
          <View className="flex-row bg-gray-100 rounded-xl p-1 mb-4">
            <TouchableOpacity
              className={`flex-1 py-2.5 items-center rounded-lg ${tripType === 'mot-chieu' ? 'bg-[#2563EB] shadow-sm' : ''}`}
              onPress={() => setTripType('mot-chieu')}
            >
              <Text className={`font-semibold ${tripType === 'mot-chieu' ? 'text-white' : 'text-gray-500'}`}>Một chiều</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2.5 items-center rounded-lg ${tripType === 'khu-hoi' ? 'bg-[#2563EB] shadow-sm' : ''}`}
              onPress={() => setTripType('khu-hoi')}
            >
              <Text className={`font-semibold ${tripType === 'khu-hoi' ? 'text-white' : 'text-gray-500'}`}>Khứ hồi</Text>
            </TouchableOpacity>
          </View>

          {/* Locations Container */}
          <View className="relative border border-gray-200 rounded-2xl p-3 mb-3">
            {/* Điểm đi */}
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => handleOpenSelectAirport('departure')}
              className="flex-row items-center pb-3 border-b border-gray-100"
            >
              <MaterialCommunityIcons name="airplane-takeoff" size={24} color="#3B82F6" />
              <View className="flex-1 ml-2">
                <Text className="text-gray-800 font-bold text-base">{departure.city}</Text>
                <Text className="text-gray-500 text-xs">{departure.name}</Text>
              </View>
              <Text className="text-blue-600 font-bold text-lg">{departure.code}</Text>
            </TouchableOpacity>

            {/* Điểm đến */}
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => handleOpenSelectAirport('arrival')}
              className="flex-row items-center pt-3"
            >
              <MaterialCommunityIcons name="airplane-landing" size={24} color="#3B82F6" />
              <View className="flex-1 ml-2">
                <Text className="text-gray-800 font-bold text-base">{arrival.city}</Text>
                <Text className="text-gray-500 text-xs">{arrival.name}</Text>
              </View>
              <Text className="text-blue-600 font-bold text-lg">{arrival.code}</Text>
            </TouchableOpacity>

            {/* Swap Button */}
            <TouchableOpacity
              onPress={handleSwapAirports}
              className="absolute right-6 top-[48px] bg-blue-600 w-8 h-8 rounded-full items-center justify-center border-2 border-white shadow-sm z-10"
            >
              <Ionicons name="swap-vertical" size={16} color="white" />
            </TouchableOpacity>
          </View>

          {/* Dates */}
          <View className="flex-row justify-between mb-3">
            {/* Ô Ngày đi */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => openPicker(departInputRef)}
              className="flex-1 border border-gray-200 rounded-2xl p-3 mr-2 flex-row items-center relative overflow-hidden"
            >
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              <View className="ml-2">
                <Text className="text-gray-400 text-xs uppercase text-[10px] font-bold">Ngày đi</Text>
                <Text className="text-gray-800 font-bold">{formatDateVN(departDateRaw)}</Text>
              </View>

              <input
                ref={departInputRef}
                type="date"
                value={departDateRaw}
                onChange={(e) => {
                  if (e.target.value) {
                    setDepartDateRaw(e.target.value);
                    if (tripType === 'khu-hoi' && e.target.value > returnDateRaw) {
                      setReturnDateRaw(e.target.value);
                    }
                  }
                }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  pointerEvents: 'none',
                }}
              />
            </TouchableOpacity>

            {/* Ô Ngày về */}
            <TouchableOpacity
              activeOpacity={0.7}
              disabled={tripType === 'mot-chieu'}
              onPress={() => openPicker(returnInputRef)}
              className={`flex-1 border border-gray-200 rounded-2xl p-3 ml-2 flex-row items-center relative overflow-hidden ${
                tripType === 'mot-chieu' ? 'opacity-40 bg-gray-50' : ''
              }`}
            >
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              <View className="ml-2">
                <Text className="text-gray-400 text-xs uppercase text-[10px] font-bold">Ngày về</Text>
                <Text className="text-gray-800 font-bold">
                  {tripType === 'mot-chieu' ? '—' : formatDateVN(returnDateRaw)}
                </Text>
              </View>

              {tripType === 'khu-hoi' && (
                <input
                  ref={returnInputRef}
                  type="date"
                  min={departDateRaw}
                  value={returnDateRaw}
                  onChange={(e) => {
                    if (e.target.value) {
                      setReturnDateRaw(e.target.value);
                    }
                  }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Passengers & Class */}
          <View className="flex-row justify-between mb-4">
            {/* Ô 1: CHỌN SỐ LƯỢNG HÀNH KHÁCH */}
            <View className="flex-1 border border-gray-200 rounded-2xl p-3 mr-2 flex-row items-center justify-between relative overflow-hidden">
              <View className="flex-row items-center flex-1">
                <Ionicons name="people-outline" size={20} color="#6B7280" />
                <View className="ml-2">
                  <Text className="text-gray-400 text-xs uppercase text-[10px] font-bold">Hành khách</Text>
                  <Text className="text-gray-800 font-bold" numberOfLines={1}>{passengers}</Text>
                </View>
              </View>
              <Ionicons name="chevron-down" size={16} color="#6B7280" />

              <select
                value={passengers}
                onChange={(e) => setPassengers(e.target.value)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                  zIndex: 10,
                }}
              >
                <option value="1 Người lớn">1 Người lớn</option>
                <option value="2 Người lớn">2 Người lớn</option>
                <option value="3 Người lớn">3 Người lớn</option>
                <option value="4 Người lớn">4 Người lớn</option>
              </select>
            </View>

            {/* Ô 2: CHỌN HẠNG GHẾ */}
            <View className="flex-1 border border-gray-200 rounded-2xl p-3 ml-2 flex-row items-center justify-between relative overflow-hidden">
              <View className="flex-row items-center flex-1">
                <MaterialCommunityIcons name="seat-passenger" size={20} color="#6B7280" />
                <View className="ml-2">
                  <Text className="text-gray-400 text-xs uppercase text-[10px] font-bold">Hạng ghế</Text>
                  <Text className="text-gray-800 font-bold" numberOfLines={1}>{seatClass}</Text>
                </View>
              </View>
              <Ionicons name="chevron-down" size={16} color="#6B7280" />

              <select
                value={seatClass}
                onChange={(e) => setSeatClass(e.target.value)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                  zIndex: 10,
                }}
              >
                <option value="Phổ thông">Phổ thông</option>
                <option value="Thương gia">Thương gia</option>
              </select>
            </View>
          </View>

          {/* NÚT TÌM CHUYẾN BAY */}
          <TouchableOpacity
            onPress={handleSearch}
            className="bg-[#2563EB] rounded-2xl py-4 items-center justify-center flex-row shadow-md shadow-blue-300"
          >
            <Ionicons name="search" size={20} color="white" className="mr-2" />
            <Text className="text-white font-bold text-base ml-2">Tìm chuyến bay</Text>
          </TouchableOpacity>
        </View>

        {/* PROMO BANNER */}
        <View className="mx-5 mt-6 bg-[#2563EB] rounded-2xl p-5 flex-row justify-between items-center shadow-sm">
          <View>
            <Text className="text-blue-100 text-xs font-bold uppercase mb-1">Khuyến mãi mùa thu</Text>
            <Text className="text-white text-lg font-bold">Giảm đến 25% vé nội địa</Text>
            <Text className="text-blue-100 text-xs mt-1">Đặt ngay hôm nay cho chuyến đi mơ ước</Text>
          </View>
          <MaterialCommunityIcons name="ticket-percent-outline" size={40} color="white" opacity={0.8} />
        </View>

        {/* POPULAR FLIGHTS SECTION */}
        <View className="mx-5 mt-6 mb-2 flex-row justify-between items-end">
          <View>
            <Text className="text-gray-900 text-lg font-bold">Chặng bay phổ biến & Ưu đãi</Text>
            <Text className="text-gray-500 text-xs mt-1">Giá tốt nhất được cập nhật theo thời gian thực</Text>
          </View>
          <TouchableOpacity>
            <Text className="text-[#2563EB] text-sm font-semibold">Xem tất cả ›</Text>
          </TouchableOpacity>
        </View>

        {/* RENDER MOCK DATA */}
        <View className="px-5 pb-10">
          {MOCK_FLIGHT_DEALS.map((flight) => (
            <TouchableOpacity 
              key={flight.id} 
              activeOpacity={0.7}
              onPress={() => navigation.navigate('FlightDetail' as never, { flightId: flight.id } as never)}
              className="bg-white rounded-2xl p-4 mt-4 shadow-sm border border-gray-100"
            >
              <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                  <View className="w-6 h-6 rounded-full bg-blue-100 items-center justify-center">
                    <Ionicons
                      name="airplane"
                      size={16}
                      color="#3B82F6"
                      style={{ transform: [{ rotate: '270deg' }] }}
                    />
                  </View>
                  <Text className="text-gray-800 font-semibold text-sm ml-2">{flight.airlineName}</Text>
                  <Text className="text-gray-400 text-xs ml-2">{flight.flightCode}</Text>
                </View>
                <View className={`px-2 py-1 rounded text-xs font-bold ${flight.tagColor}`}>
                  <Text className={flight.tagColor + ' text-xs font-semibold'}>{flight.tag}</Text>
                </View>
              </View>

              <View className="flex-row justify-between items-center">
                <View className="items-start">
                  <Text className="text-xl font-black text-gray-900">{flight.departureTime}</Text>
                  <Text className="text-gray-500 text-xs mt-1">{flight.departureAirport} • {flight.departureCity}</Text>
                </View>

                <View className="flex-1 px-4 items-center justify-center">
                  <Text className="text-gray-400 text-[10px] mb-1">{flight.duration} • {flight.type}</Text>
                  <View className="flex-row items-center w-full">
                    <View className="h-[1px] bg-gray-300 flex-1" />
                    <Ionicons name="airplane" size={16} color="#3B82F6" className="mx-1" />
                    <View className="h-[1px] bg-gray-300 flex-1" />
                  </View>
                </View>

                <View className="items-end">
                  <Text className="text-xl font-black text-gray-900">{flight.arrivalTime}</Text>
                  <Text className="text-gray-500 text-xs mt-1">{flight.arrivalAirport} • {flight.arrivalCity}</Text>
                </View>
              </View>

              <View className="flex-row justify-between items-center mt-5 pt-3 border-t border-gray-100">
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
                  <Text className="text-gray-500 text-xs ml-1">{flight.baggageInfo}</Text>
                </View>
                <View className="flex-row items-baseline">
                  <Text className="text-gray-500 text-xs mr-1">giá từ</Text>
                  <Text className="text-blue-600 text-xl font-black">{flight.price} ₫</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* MODAL CHỌN SÂN BAY */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '70%' }}>
            <View className="flex-row justify-between items-center pb-3 border-b border-gray-100">
              <Text className="text-lg font-bold text-gray-800">
                {selectingType === 'departure' ? 'Chọn điểm khởi hành' : 'Chọn điểm đến'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={MOCK_AIRPORTS.filter((airport) =>
                selectingType === 'departure'
                  ? airport.code !== arrival.code
                  : airport.code !== departure.code
              )}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectAirport(item)}
                  className="flex-row items-center justify-between py-3.5 border-b border-gray-50"
                >
                  <View>
                    <Text className="font-bold text-base text-gray-800">{item.city}</Text>
                    <Text className="text-xs text-gray-500 mt-0.5">{item.name}</Text>
                  </View>
                  <View className="bg-blue-50 px-3 py-1 rounded-lg">
                    <Text className="font-bold text-blue-600">{item.code}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}