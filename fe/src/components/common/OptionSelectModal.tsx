import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OptionSelectModalProps {
  visible: boolean;
  title: string;
  options: string[];
  selectedOption: string;
  onSelect: (option: string) => void;
  onClose: () => void;
}

export default function OptionSelectModal({
  visible,
  title,
  options,
  selectedOption,
  onSelect,
  onClose,
}: OptionSelectModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }}>
          <View className="flex-row justify-between items-center pb-3 border-b border-gray-100">
            <Text className="text-lg font-bold text-gray-800">{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#4B5563" />
            </TouchableOpacity>
          </View>
          <View className="py-2">
            {options.map((item) => {
              const isSelected = selectedOption === item;
              return (
                <TouchableOpacity
                  key={item}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className="flex-row items-center justify-between py-3.5 border-b border-gray-50"
                >
                  <Text className={`text-base ${isSelected ? 'font-bold text-blue-600' : 'text-gray-800'}`}>
                    {item}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color="#2563EB" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}
