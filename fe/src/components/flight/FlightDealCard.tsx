import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface FlightDeal {
  id: string;
  airlineName: string;
  flightCode: string;
  tag: string;
  tagColor: string;
  departureTime: string;
  departureAirport: string;
  departureCity: string;
  arrivalTime: string;
  arrivalAirport: string;
  arrivalCity: string;
  duration: string;
  type: string;
  baggageInfo: string;
  price: string;
  logoUrl?: string;
}

interface FlightDealCardProps {
  flight: FlightDeal;
  onPress?: () => void;
}

export default function FlightDealCard({ flight, onPress }: FlightDealCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
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

        <View className="px-2.5 py-1 rounded-full bg-opacity-10 border border-gray-100">
          <Text className={flight.tagColor + ' text-xs font-semibold'}>{flight.tag}</Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center">
        <View className="items-start">
          <Text className="text-xl font-black text-gray-900">{flight.departureTime}</Text>
          <Text className="text-gray-500 text-xs mt-1">
            {flight.departureAirport} • {flight.departureCity}
          </Text>
        </View>

        <View className="flex-1 px-4 items-center justify-center">
          <Text className="text-gray-400 text-[10px] mb-1">
            {flight.duration} • {flight.type}
          </Text>
          <View className="flex-row items-center w-full">
            <View className="h-[1px] bg-gray-300 flex-1" />
            <Ionicons name="airplane" size={16} color="#3B82F6" className="mx-1" />
            <View className="h-[1px] bg-gray-300 flex-1" />
          </View>
        </View>

        <View className="items-end">
          <Text className="text-xl font-black text-gray-900">{flight.arrivalTime}</Text>
          <Text className="text-gray-500 text-xs mt-1">
            {flight.arrivalAirport} • {flight.arrivalCity}
          </Text>
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
  );
}
