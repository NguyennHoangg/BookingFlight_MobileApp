import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; 
import type { MainTabParamList } from './types';

import HomeScreen from '../screens/home/Home'; 
import SearchScreen from '../screens/search/Search';         // Thêm màn hình Tìm vé
import FavoritesScreen from '../screens/favorites/Favorites'; // Thêm màn hình Yêu thích
import MyTicketsScreen from '../screens/tickets/MyTickets';
import ProfileScreen from '../screens/profile/Profile';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function BottomTabNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            switch (route.name) {
              case 'Home':
                return <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />;
              case 'Search':
                return <Ionicons name={focused ? 'search' : 'search-outline'} size={size} color={color} />;
              case 'Favorites':
                return <Ionicons name={focused ? 'heart' : 'heart-outline'} size={size} color={color} />;
              case 'MyTickets':
                return <MaterialCommunityIcons name={focused ? 'ticket' : 'ticket-outline'} size={size} color={color} />;
              case 'Profile':
                return <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />;
            }
          },
          tabBarActiveTintColor: '#2563EB', // Màu xanh theo thiết kế
          tabBarInactiveTintColor: '#6B7280',
          headerShown: false,
          tabBarStyle: {
            paddingBottom: 8,
            paddingTop: 8,
            height: 65,
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#F3F4F6'
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginTop: -5,
          }
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Trang chủ' }} />
        <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarLabel: 'Tìm vé' }} />
        <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ tabBarLabel: 'Yêu thích' }} />
        <Tab.Screen name="MyTickets" component={MyTicketsScreen} options={{ tabBarLabel: 'Vé của tôi' }} />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Tài khoản' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}