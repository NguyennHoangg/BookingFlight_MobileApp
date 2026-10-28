import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface FlightFilterState {
  sortBy: 'price_asc' | 'time_asc' | 'time_desc';
  selectedAirlines: string[];
  timeSlot: 'all' | 'early' | 'morning' | 'afternoon' | 'evening';
  hasCheckedBaggage: boolean;
}

export const DEFAULT_FILTER_STATE: FlightFilterState = {
  sortBy: 'price_asc',
  selectedAirlines: [],
  timeSlot: 'all',
  hasCheckedBaggage: false,
};

interface FlightFilterModalProps {
  visible: boolean;
  value: FlightFilterState;
  availableAirlines: string[];
  totalMatchesCount: number;
  onApply: (filters: FlightFilterState) => void;
  onClose: () => void;
}

export default function FlightFilterModal(props: FlightFilterModalProps) {
  if (!props.visible) return null;
  return <FlightFilterModalContent key={JSON.stringify(props.value)} {...props} />;
}

function FlightFilterModalContent({
  visible,
  value,
  availableAirlines,
  totalMatchesCount,
  onApply,
  onClose,
}: FlightFilterModalProps) {
  const [localFilters, setLocalFilters] = useState<FlightFilterState>(value);


  const handleToggleAirline = (airline: string) => {
    setLocalFilters((prev) => {
      const exists = prev.selectedAirlines.includes(airline);
      if (exists) {
        return {
          ...prev,
          selectedAirlines: prev.selectedAirlines.filter((a) => a !== airline),
        };
      } else {
        return {
          ...prev,
          selectedAirlines: [...prev.selectedAirlines, airline],
        };
      }
    });
  };

  const handleReset = () => {
    setLocalFilters(DEFAULT_FILTER_STATE);
  };

  const handleConfirm = () => {
    onApply(localFilters);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl max-h-[85%] overflow-hidden">
          {/* HEADER */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
            <TouchableOpacity onPress={handleReset} activeOpacity={0.7}>
              <Text className="text-gray-500 font-medium text-sm">Đặt lại</Text>
            </TouchableOpacity>

            <Text className="text-gray-900 font-bold text-base">Bộ lọc chuyến bay</Text>

            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
            >
              <Ionicons name="close" size={18} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {/* CONTENT */}
          <ScrollView className="px-5 py-4" showsVerticalScrollIndicator={false}>
            {/* 1. SẮP XẾP THEO */}
            <View className="mb-6">
              <Text className="text-gray-900 font-bold text-sm mb-3">Sắp xếp theo</Text>
              <View className="space-y-2">
                {[
                  { key: 'price_asc', label: 'Giá thấp nhất trước', icon: 'trending-down-outline' },
                  { key: 'time_asc', label: 'Cất cánh sớm nhất', icon: 'time-outline' },
                  { key: 'time_desc', label: 'Cất cánh muộn nhất', icon: 'moon-outline' },
                ].map((item) => {
                  const isSelected = localFilters.sortBy === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      onPress={() =>
                        setLocalFilters((p) => ({ ...p, sortBy: item.key as any }))
                      }
                      activeOpacity={0.7}
                      className={`flex-row items-center justify-between p-3.5 rounded-2xl border mb-2 ${
                        isSelected
                          ? 'bg-blue-50/60 border-blue-600'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <View className="flex-row items-center">
                        <Ionicons
                          name={item.icon as any}
                          size={18}
                          color={isSelected ? '#2563EB' : '#6B7280'}
                          className="mr-2"
                        />
                        <Text
                          className={`font-semibold text-sm ml-2 ${
                            isSelected ? 'text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          {item.label}
                        </Text>
                      </View>
                      <Ionicons
                        name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={isSelected ? '#2563EB' : '#D1D5DB'}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 2. HÃNG HÀNG KHÔNG */}
            <View className="mb-6">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-gray-900 font-bold text-sm">Hãng hàng không</Text>
                {localFilters.selectedAirlines.length > 0 && (
                  <TouchableOpacity
                    onPress={() =>
                      setLocalFilters((p) => ({ ...p, selectedAirlines: [] }))
                    }
                  >
                    <Text className="text-blue-600 text-xs font-semibold">Chọn tất cả</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View className="flex-row flex-wrap gap-2">
                {availableAirlines.map((airline) => {
                  const isSelected = localFilters.selectedAirlines.includes(airline);
                  return (
                    <TouchableOpacity
                      key={airline}
                      onPress={() => handleToggleAirline(airline)}
                      activeOpacity={0.7}
                      className={`px-3.5 py-2.5 rounded-xl border flex-row items-center mr-2 mb-2 ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      {isSelected && (
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color="#FFFFFF"
                          className="mr-1.5"
                        />
                      )}
                      <Text
                        className={`text-xs font-semibold ml-1 ${
                          isSelected ? 'text-white' : 'text-gray-700'
                        }`}
                      >
                        {airline}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 3. KHUNG GIỜ CẤT CÁNH */}
            <View className="mb-6">
              <Text className="text-gray-900 font-bold text-sm mb-3">Giờ cất cánh</Text>
              <View className="flex-row flex-wrap justify-between">
                {[
                  { key: 'all', title: 'Tất cả', desc: 'Bất kỳ giờ nào' },
                  { key: 'early', title: 'Đêm - Sáng sớm', desc: '00:00 - 06:00' },
                  { key: 'morning', title: 'Buổi sáng', desc: '06:00 - 12:00' },
                  { key: 'afternoon', title: 'Buổi chiều', desc: '12:00 - 18:00' },
                  { key: 'evening', title: 'Buổi tối', desc: '18:00 - 24:00' },
                ].map((slot) => {
                  const isSelected = localFilters.timeSlot === slot.key;
                  return (
                    <TouchableOpacity
                      key={slot.key}
                      onPress={() =>
                        setLocalFilters((p) => ({ ...p, timeSlot: slot.key as any }))
                      }
                      activeOpacity={0.7}
                      style={{ width: '48%' }}
                      className={`p-3 rounded-2xl border mb-2.5 ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-600'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <Text
                        className={`font-bold text-xs ${
                          isSelected ? 'text-blue-700' : 'text-gray-800'
                        }`}
                      >
                        {slot.title}
                      </Text>
                      <Text
                        className={`text-[10px] mt-0.5 ${
                          isSelected ? 'text-blue-600' : 'text-gray-400'
                        }`}
                      >
                        {slot.desc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 4. TIỆN ÍCH / HÀNH LÝ */}
            <View className="mb-8">
              <Text className="text-gray-900 font-bold text-sm mb-3">Hành lý</Text>
              <TouchableOpacity
                onPress={() =>
                  setLocalFilters((p) => ({
                    ...p,
                    hasCheckedBaggage: !p.hasCheckedBaggage,
                  }))
                }
                activeOpacity={0.7}
                className={`flex-row items-center justify-between p-3.5 rounded-2xl border ${
                  localFilters.hasCheckedBaggage
                    ? 'bg-blue-50/60 border-blue-600'
                    : 'bg-white border-gray-200'
                }`}
              >
                <View className="flex-row items-center">
                  <Ionicons
                    name="briefcase-outline"
                    size={20}
                    color={localFilters.hasCheckedBaggage ? '#2563EB' : '#6B7280'}
                  />
                  <View className="ml-2.5">
                    <Text
                      className={`font-semibold text-sm ${
                        localFilters.hasCheckedBaggage
                          ? 'text-blue-700'
                          : 'text-gray-800'
                      }`}
                    >
                      Bao gồm hành lý ký gửi
                    </Text>
                    <Text className="text-gray-400 text-xs mt-0.5">
                      Chỉ lọc chuyến bay có từ 20kg ký gửi trở lên
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name={
                    localFilters.hasCheckedBaggage
                      ? 'checkbox'
                      : 'square-outline'
                  }
                  size={22}
                  color={localFilters.hasCheckedBaggage ? '#2563EB' : '#D1D5DB'}
                />
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* BOTTOM BUTTON */}
          <View className="px-5 py-4 border-t border-gray-100 bg-white">
            <TouchableOpacity
              onPress={handleConfirm}
              activeOpacity={0.8}
              className="bg-[#2563EB] py-4 rounded-2xl items-center justify-center shadow-md shadow-blue-300"
            >
              <Text className="text-white font-bold text-base">
                Áp dụng bộ lọc
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
