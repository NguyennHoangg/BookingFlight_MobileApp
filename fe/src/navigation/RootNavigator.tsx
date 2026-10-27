import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; 
import type { RootStackParamList, MainTabParamList } from './types';
import { useAppDispatch, useAppSelector } from '../store';
import { initAuth } from '../store/slices/authSlice';

// Tab screens
import HomeScreen from '../screens/home/Home'; 
import SearchScreen from '../screens/search/Search';
import FavoritesScreen from '../screens/favorites/Favorites';
import MyTicketsScreen from '../screens/tickets/MyTickets';
import ProfileScreen from '../screens/profile/Profile';

// Stack screens
import LoginScreen from '../screens/auth/Login';
import RegisterScreen from '../screens/auth/Register';
import FlightDetailScreen from '../screens/flight/FlightDetail';
import TicketDetailScreen from '../screens/tickets/TicketDetail';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function BottomTabNavigator() {
  return (
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
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#6B7280',
        headerShown: false,
        tabBarStyle: {
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: -5,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Trang chủ' }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarLabel: 'Tìm vé' }} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ tabBarLabel: 'Yêu thích' }} />
      <Tab.Screen name="MyTickets" component={MyTicketsScreen} options={{ tabBarLabel: 'Vé của tôi' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Tài khoản' }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isInitialized } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(initAuth());
  }, [dispatch]);

  // Trong khi đang đọc token từ AsyncStorage thì hiển thị loading
  if (!isInitialized) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        // Đã đăng nhập: Chỉ hiển thị các màn hình chính (MainTabs, FlightDetail, EditProfile)
        <>
          <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
          <Stack.Screen name="FlightDetail" component={FlightDetailScreen} />
          <Stack.Screen name="TicketDetail" component={TicketDetailScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        </>
      ) : (
        // Chưa đăng nhập: Mở Login trước, có thể chuyển sang Register
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}