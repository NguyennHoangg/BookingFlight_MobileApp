import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

export interface PassengerCounts {
  adults: number;
  children: number;
  infants: number;
}

export const formatPassengerSummary = (counts: PassengerCounts): string => {
  const parts: string[] = [];
  if (counts.adults > 0) parts.push(`${counts.adults} Người lớn`);
  if (counts.children > 0) parts.push(`${counts.children} Trẻ em`);
  if (counts.infants > 0) parts.push(`${counts.infants} Em bé`);
  return parts.join(', ') || '1 Người lớn';
};

interface PassengerSelectModalProps {
  visible: boolean;
  value: PassengerCounts;
  onApply: (counts: PassengerCounts) => void;
  onClose: () => void;
}

export default function PassengerSelectModal({
  visible,
  value,
  onApply,
  onClose,
}: PassengerSelectModalProps) {
  const [counts, setCounts] = useState<PassengerCounts>(value);

  // Sync state whenever modal opens
  useEffect(() => {
    if (visible) {
      setCounts(value);
    }
  }, [visible, value]);

  const totalPassengers = counts.adults + counts.children;
  const MAX_TOTAL = 9;

  const handleUpdate = (type: keyof PassengerCounts, delta: number) => {
    setCounts((prev) => {
      const next = { ...prev };
      if (type === 'adults') {
        const newVal = next.adults + delta;
        if (newVal < 1 || newVal + next.children > MAX_TOTAL) return prev;
        next.adults = newVal;
        // Số em bé không được vượt quá số người lớn
        if (next.infants > next.adults) {
          next.infants = next.adults;
        }
      } else if (type === 'children') {
        const newVal = next.children + delta;
        if (newVal < 0 || next.adults + newVal > MAX_TOTAL) return prev;
        next.children = newVal;
      } else if (type === 'infants') {
        const newVal = next.infants + delta;
        if (newVal < 0 || newVal > next.adults) return prev;
        next.infants = newVal;
      }
      return next;
    });
  };

  const passengerTypes = [
    {
      key: 'adults' as const,
      label: 'Người lớn',
      desc: 'Từ 12 tuổi trở lên',
      value: counts.adults,
      canMinus: counts.adults > 1,
      canPlus: totalPassengers < MAX_TOTAL,
    },
    {
      key: 'children' as const,
      label: 'Trẻ em',
      desc: 'Từ 2 - 11 tuổi',
      value: counts.children,
      canMinus: counts.children > 0,
      canPlus: totalPassengers < MAX_TOTAL,
    },
    {
      key: 'infants' as const,
      label: 'Em bé',
      desc: 'Dưới 2 tuổi (ngồi cùng người lớn)',
      value: counts.infants,
      canMinus: counts.infants > 0,
      canPlus: counts.infants < counts.adults,
    },
  ];

  const handleConfirm = () => {
    onApply(counts);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }}>
          {/* Header */}
          <View className="flex-row justify-between items-center pb-3 border-b border-gray-100">
            <View>
              <Text className="text-lg font-bold text-gray-800">Chọn số lượng hành khách</Text>
              <Text className="text-xs text-gray-400 mt-0.5">Tối đa {MAX_TOTAL} hành khách (không tính em bé)</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons name="close" size={24} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {/* List passenger categories */}
          <View className="py-2">
            {passengerTypes.map((item) => (
              <View
                key={item.key}
                className="flex-row items-center justify-between py-4 border-b border-gray-100"
              >
                <View className="flex-1 mr-4">
                  <Text className="text-base font-bold text-gray-800">{item.label}</Text>
                  <Text className="text-xs text-gray-400 mt-0.5">{item.desc}</Text>
                </View>

                {/* Counter controls */}
                <View className="flex-row items-center">
                  {/* Minus button */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    disabled={!item.canMinus}
                    onPress={() => handleUpdate(item.key, -1)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1.5,
                      borderColor: item.canMinus ? '#2563EB' : '#E5E7EB',
                      backgroundColor: item.canMinus ? '#EFF6FF' : '#F9FAFB',
                    }}
                  >
                    <Feather
                      name="minus"
                      size={18}
                      color={item.canMinus ? '#2563EB' : '#9CA3AF'}
                    />
                  </TouchableOpacity>

                  {/* Value */}
                  <View style={{ width: 40, alignItems: 'center' }}>
                    <Text className="text-base font-bold text-gray-800">{item.value}</Text>
                  </View>

                  {/* Plus button */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    disabled={!item.canPlus}
                    onPress={() => handleUpdate(item.key, 1)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1.5,
                      borderColor: item.canPlus ? '#2563EB' : '#E5E7EB',
                      backgroundColor: item.canPlus ? '#2563EB' : '#F9FAFB',
                    }}
                  >
                    <Feather
                      name="plus"
                      size={18}
                      color={item.canPlus ? '#FFFFFF' : '#9CA3AF'}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Confirm Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleConfirm}
            className="bg-[#2563EB] rounded-2xl py-3.5 items-center justify-center mt-4 shadow-sm"
          >
            <Text className="text-white font-bold text-base">Xác nhận</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
