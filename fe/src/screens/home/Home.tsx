import { navigate } from "../../navigation/routes";
import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import DateTimePicker from '@react-native-community/datetimepicker';

import FlightDealCard from '../../components/flight/FlightDealCard';
import AirportSelectModal, { Airport } from '../../components/flight/AirportSelectModal';
import OptionSelectModal from '../../components/common/OptionSelectModal';
import PassengerSelectModal, {
  PassengerCounts,
  formatPassengerSummary,
} from '../../components/flight/PassengerSelectModal';
import useAirport from '../../hook/useAirport';



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

const SEAT_CLASS_OPTIONS = ['Phổ thông', 'Thương gia'];

export default function Home() {

  const [tripType, setTripType] = useState<'mot-chieu' | 'khu-hoi'>('khu-hoi');
  const [selectedDeparture, setDeparture] = useState<Airport>();
  const [selectedArrival, setArrival] = useState<Airport>();

  const getFormattedDate = (offsetDays: number = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [departDateRaw, setDepartDateRaw] = useState(getFormattedDate(0));
  const [returnDateRaw, setReturnDateRaw] = useState(getFormattedDate(3));

  const [passengerCounts, setPassengerCounts] = useState<PassengerCounts>({
    adults: 1,
    children: 0,
    infants: 0,
  });
  const [seatClass, setSeatClass] = useState('Phổ thông');

  const departInputRef = useRef<HTMLInputElement>(null);
  const returnInputRef = useRef<HTMLInputElement>(null);
  const [showDepartPicker, setShowDepartPicker] = useState(false);
  const [showReturnPicker, setShowReturnPicker] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectingType, setSelectingType] = useState<'departure' | 'arrival'>('departure');
  const [passengerModalVisible, setPassengerModalVisible] = useState(false);
  const [seatClassModalVisible, setSeatClassModalVisible] = useState(false);

  const {airports} = useAirport();

  const departure = selectedDeparture ?? airports[0];
  const arrival = selectedArrival ?? airports[1];

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

  // Chọn sân bay
  const handleSelectAirport = (airport: Airport) => {
    if (selectingType === 'departure') {
      // Nếu chọn trùng điểm đến hiện tại thì hoán đổi
      if (arrival && airport.code === arrival.code) {
        setArrival(departure);
      }
      setDeparture(airport);
    } else {
      // Nếu chọn trùng điểm đi hiện tại thì hoán đổi
      if (departure && airport.code === departure.code) {
        setDeparture(arrival);
      }
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
    if (!departure || !arrival || departure.code === arrival.code) {
      Alert.alert('Thông báo', 'Vui lòng chọn điểm đi và điểm đến khác nhau.');
      return;
    }
    if (tripType === 'khu-hoi' && returnDateRaw < departDateRaw) {
      Alert.alert('Thông báo', 'Ngày về phải từ ngày đi trở đi.');
      return;
    }
    navigate('SearchFlightResult', {
      tripType,
      departure,
      arrival,
      departDate: departDateRaw,
      returnDate: tripType === 'khu-hoi' ? returnDateRaw : null,
      passengers: passengerCounts,
      passengerSummary: formatPassengerSummary(passengerCounts),
      seatClass,
    });
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

  const handleOpenDepartPicker = () => {
    if (Platform.OS === 'web') {
      openPicker(departInputRef);
    } else {
      setShowDepartPicker(true);
    }
  };

  const handleOpenReturnPicker = () => {
    if (tripType === 'mot-chieu') {
      setTripType('khu-hoi');
    }
    if (Platform.OS === 'web') {
      openPicker(returnInputRef);
    } else {
      setShowReturnPicker(true);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={['left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }}
      >
        {/* SEARCH FLIGHT CARD */}
        <View className="mx-5 mt-4 bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
          
          {/* Trip Type Toggle */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: '#F3F4F6',
              borderRadius: 12,
              padding: 4,
              marginBottom: 16,
            }}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setTripType('mot-chieu')}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                backgroundColor: tripType === 'mot-chieu' ? '#2563EB' : 'transparent',
              }}
            >
              <Text
                style={{
                  fontWeight: '600',
                  fontSize: 14,
                  color: tripType === 'mot-chieu' ? '#FFFFFF' : '#4B5563',
                }}
              >
                Một chiều
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setTripType('khu-hoi')}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                backgroundColor: tripType === 'khu-hoi' ? '#2563EB' : 'transparent',
              }}
            >
              <Text
                style={{
                  fontWeight: '600',
                  fontSize: 14,
                  color: tripType === 'khu-hoi' ? '#FFFFFF' : '#4B5563',
                }}
              >
                Khứ hồi
              </Text>
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
              {departure ? (
                <>
                  <View className="flex-1 ml-2">
                    <Text className="text-gray-800 font-bold text-base">{departure.city}</Text>
                    <Text className="text-gray-500 text-xs" numberOfLines={1}>{departure.name}</Text>
                  </View>
                  <Text className="text-blue-600 font-bold text-lg mr-8">{departure.code}</Text>
                </>
              ) : (
                <View className="flex-1 ml-2">
                  <Text className="text-gray-400 font-medium text-base">Chọn điểm đi</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Điểm đến */}
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => handleOpenSelectAirport('arrival')}
              className="flex-row items-center pt-3"
            >
              <MaterialCommunityIcons name="airplane-landing" size={24} color="#3B82F6" />
              {arrival ? (
                <>
                  <View className="flex-1 ml-2">
                    <Text className="text-gray-800 font-bold text-base">{arrival.city}</Text>
                    <Text className="text-gray-500 text-xs" numberOfLines={1}>{arrival.name}</Text>
                  </View>
                  <Text className="text-blue-600 font-bold text-lg mr-8">{arrival.code}</Text>
                </>
              ) : (
                <View className="flex-1 ml-2">
                  <Text className="text-gray-400 font-medium text-base">Chọn điểm đến</Text>
                </View>
              )}
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
              onPress={handleOpenDepartPicker}
              className="flex-1 border border-gray-200 rounded-2xl p-3 mr-2 flex-row items-center relative overflow-hidden"
            >
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              <View className="ml-2">
                <Text className="text-gray-400 text-xs uppercase text-[10px] font-bold">Ngày đi</Text>
                <Text className="text-gray-800 font-bold">{formatDateVN(departDateRaw)}</Text>
              </View>

              {Platform.OS === 'web' && React.createElement('input', {
                ref: departInputRef,
                type: 'date',
                value: departDateRaw,
                onChange: (e: any) => {
                  if (e.target.value) {
                    setDepartDateRaw(e.target.value);
                    if (tripType === 'khu-hoi' && e.target.value > returnDateRaw) {
                      setReturnDateRaw(e.target.value);
                    }
                  }
                },
                style: {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  pointerEvents: 'none',
                },
              })}
            </TouchableOpacity>

            {/* Ô Ngày về */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleOpenReturnPicker}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderRadius: 16,
                padding: 12,
                marginLeft: 8,
                flexDirection: 'row',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden',
                opacity: tripType === 'mot-chieu' ? 0.45 : 1,
                backgroundColor: tripType === 'mot-chieu' ? '#F9FAFB' : '#FFFFFF',
              }}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={tripType === 'mot-chieu' ? '#9CA3AF' : '#6B7280'}
              />
              <View style={{ marginLeft: 8 }}>
                <Text className="text-gray-400 text-xs uppercase text-[10px] font-bold">Ngày về</Text>
                <Text
                  style={{
                    color: tripType === 'mot-chieu' ? '#9CA3AF' : '#1F2937',
                    fontWeight: '700',
                  }}
                >
                  {tripType === 'mot-chieu' ? '—' : formatDateVN(returnDateRaw)}
                </Text>
              </View>

              {Platform.OS === 'web' && React.createElement('input', {
                ref: returnInputRef,
                type: 'date',
                min: departDateRaw,
                value: returnDateRaw,
                onChange: (e: any) => {
                  if (e.target.value) {
                    setReturnDateRaw(e.target.value);
                  }
                },
                style: {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  pointerEvents: 'none',
                },
              })}
            </TouchableOpacity>
          </View>

          {/* Native Date Pickers */}
          {showDepartPicker && (
            <DateTimePicker
              value={new Date(departDateRaw)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date()}
              onValueChange={(_event, selectedDate) => {
                setShowDepartPicker(Platform.OS === 'ios');
                if (selectedDate) {
                  const yyyy = selectedDate.getFullYear();
                  const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
                  const dd = String(selectedDate.getDate()).padStart(2, '0');
                  const formatted = `${yyyy}-${mm}-${dd}`;
                  setDepartDateRaw(formatted);
                  if (tripType === 'khu-hoi' && formatted > returnDateRaw) {
                    setReturnDateRaw(formatted);
                  }
                }
              }}
              onDismiss={() => setShowDepartPicker(false)}
            />
          )}

          {showReturnPicker && (
            <DateTimePicker
              value={new Date(returnDateRaw)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date(departDateRaw)}
              onValueChange={(_event, selectedDate) => {
                setShowReturnPicker(Platform.OS === 'ios');
                if (selectedDate) {
                  const yyyy = selectedDate.getFullYear();
                  const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
                  const dd = String(selectedDate.getDate()).padStart(2, '0');
                  setReturnDateRaw(`${yyyy}-${mm}-${dd}`);
                }
              }}
              onDismiss={() => setShowReturnPicker(false)}
            />
          )}

          {/* Passengers & Class */}
          <View className="flex-row justify-between mb-4">
            {/* Ô 1: CHỌN SỐ LƯỢNG HÀNH KHÁCH */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setPassengerModalVisible(true)}
              className="flex-1 border border-gray-200 rounded-2xl p-3 mr-2 flex-row items-center justify-between"
            >
              <View className="flex-row items-center flex-1">
                <Ionicons name="people-outline" size={20} color="#6B7280" />
                <View className="ml-2">
                  <Text className="text-gray-400 text-xs uppercase text-[10px] font-bold">Hành khách</Text>
                  <Text className="text-gray-800 font-bold" numberOfLines={1}>{formatPassengerSummary(passengerCounts)}</Text>
                </View>
              </View>
              <Ionicons name="chevron-down" size={16} color="#6B7280" />
            </TouchableOpacity>

            {/* Ô 2: CHỌN HẠNG GHẾ */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSeatClassModalVisible(true)}
              className="flex-1 border border-gray-200 rounded-2xl p-3 ml-2 flex-row items-center justify-between"
            >
              <View className="flex-row items-center flex-1">
                <MaterialCommunityIcons name="seat-passenger" size={20} color="#6B7280" />
                <View className="ml-2">
                  <Text className="text-gray-400 text-xs uppercase text-[10px] font-bold">Hạng ghế</Text>
                  <Text className="text-gray-800 font-bold" numberOfLines={1}>{seatClass}</Text>
                </View>
              </View>
              <Ionicons name="chevron-down" size={16} color="#6B7280" />
            </TouchableOpacity>
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
            <FlightDealCard
              key={flight.id}
              flight={flight}
              onPress={() => navigate('FlightDetail', { flightId: flight.id })}
            />
          ))}
        </View>
      </ScrollView>

      {/* MODAL CHỌN SÂN BAY */}
      <AirportSelectModal
        visible={modalVisible}
        title={selectingType === 'departure' ? 'Chọn điểm khởi hành' : 'Chọn điểm đến'}
        airports={airports}
        excludeCode={selectingType === 'departure' ? arrival?.code : departure?.code}
        onSelect={handleSelectAirport}
        onClose={() => setModalVisible(false)}
      />

      {/* MODAL CHỌN HÀNH KHÁCH */}
      <PassengerSelectModal
        visible={passengerModalVisible}
        value={passengerCounts}
        onApply={setPassengerCounts}
        onClose={() => setPassengerModalVisible(false)}
      />

      {/* MODAL CHỌN HẠNG GHẾ */}
      <OptionSelectModal
        visible={seatClassModalVisible}
        title="Chọn hạng ghế"
        options={SEAT_CLASS_OPTIONS}
        selectedOption={seatClass}
        onSelect={setSeatClass}
        onClose={() => setSeatClassModalVisible(false)}
      />
    </SafeAreaView>
  );
}
