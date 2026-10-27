import React from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface Airport {
  id:string;
  code: string;
  city: string;
  name: string;
  country: string;
}

interface AirportSelectModalProps {
  visible: boolean;
  title?: string;
  airports: Airport[];
  excludeCode?: string;
  onSelect: (airport: Airport) => void;
  onClose: () => void;
}

export default function AirportSelectModal({
  visible,
  title = 'Chọn sân bay',
  airports,
  excludeCode,
  onSelect,
  onClose,
}: AirportSelectModalProps) {
  const filteredAirports = excludeCode
    ? airports.filter((a) => a.code !== excludeCode)
    : airports;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '70%' }}>
          <View className="flex-row justify-between items-center pb-3 border-b border-gray-100">
            <Text className="text-lg font-bold text-gray-800">{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#4B5563" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={filteredAirports}
            keyExtractor={(item) => item.code}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => onSelect(item)}
                className="flex-row items-center justify-between py-3.5 border-b border-gray-50"
              >
                <View>
                  <Text className="font-bold text-base text-gray-800">{item.city}, {item.country}</Text>
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
  );
}
