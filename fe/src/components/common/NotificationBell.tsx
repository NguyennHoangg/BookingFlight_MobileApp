import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { navigate } from '../../navigation/routes';
import { useAppSelector } from '../../store';

export default function NotificationBell() {
  const unread = useAppSelector((state) => state.notifications.filter((item) => !item.isRead).length);
  return (
    <TouchableOpacity
      onPress={() => navigate('Notifications')}
      accessibilityRole="button"
      accessibilityLabel={`Thông báo, ${unread} chưa đọc`}
      style={styles.button}
    >
      <Ionicons name="notifications-outline" size={24} color="#4B5563" />
      {unread > 0 && <View style={styles.badge}><Text style={styles.count}>{unread > 99 ? '99+' : unread}</Text></View>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderRadius: 22, borderWidth: 1, borderColor: '#F3F4F6' },
  badge: { position: 'absolute', top: 0, right: 0, minWidth: 18, height: 18, paddingHorizontal: 3, backgroundColor: '#EF4444', borderRadius: 9, borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  count: { fontSize: 10, lineHeight: 12, fontWeight: '700', color: '#FFFFFF' },
});
