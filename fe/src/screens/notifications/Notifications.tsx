import AppHeader from '../../components/common/AppHeader';
import React, { useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store';
import { type AppNotification, markAllAsRead, markAsRead } from '../../store/slices/notificationsSlice';

const filters = [
  { id: 'all', label: 'Tất cả' },
  { id: 'unread', label: 'Chưa đọc' },
  { id: 'flight', label: 'Chuyến bay' },
  { id: 'promotion', label: 'Ưu đãi' },
] as const;

const categories = {
  flight: { icon: 'airplane-outline', color: '#2563EB', background: '#DBEAFE', label: 'Chuyến bay' },
  promotion: { icon: 'pricetag-outline', color: '#EA580C', background: '#FFEDD5', label: 'Ưu đãi' },
  system: { icon: 'shield-checkmark-outline', color: '#059669', background: '#D1FAE5', label: 'SkyJourney' },
} as const;

export default function Notifications() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((state) => state.notifications);
  const [filter, setFilter] = useState<(typeof filters)[number]['id']>('all');
  const [selected, setSelected] = useState<AppNotification | null>(null);
  const unread = notifications.filter((item) => !item.isRead).length;
  const visible = notifications.filter((item) => filter === 'all' || (filter === 'unread' ? !item.isRead : item.category === filter));

  const openNotification = (item: AppNotification) => {
    setSelected(item);
    dispatch(markAsRead(item.id));
  };

  return (
    <SafeAreaView style={styles.page} edges={["left", "right", "bottom"]}>
      <AppHeader title="Thông báo" back />

      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.summary}>
              <View style={styles.summaryIcon}><Ionicons name="notifications" size={29} color="#2563EB" /></View>
              <View style={styles.flex}>
                <Text style={styles.summaryTitle}>Không bỏ lỡ hành trình</Text>
                <Text style={styles.summaryText}>Cập nhật chuyến bay và ưu đãi dành cho bạn.</Text>
              </View>
            </View>
            <View style={styles.toolbar}>
              <Text style={styles.unread} accessibilityLiveRegion="polite">{unread > 0 ? `${unread} thông báo chưa đọc` : 'Bạn đã đọc tất cả thông báo'}</Text>
              <TouchableOpacity
                onPress={() => dispatch(markAllAsRead())}
                disabled={unread === 0}
                accessibilityRole="button"
                accessibilityLabel="Đánh dấu tất cả thông báo đã đọc"
                accessibilityState={{ disabled: unread === 0 }}
                style={styles.readAll}
              >
                <Ionicons name="checkmark-done-outline" size={18} color={unread ? '#2563EB' : '#9CA3AF'} />
                <Text style={[styles.readAllText, !unread && styles.disabled]}>Đọc tất cả</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
              {filters.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setFilter(item.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: filter === item.id }}
                  style={[styles.filter, filter === item.id && styles.activeFilter]}
                >
                  <Text style={[styles.filterText, filter === item.id && styles.activeFilterText]}>{item.label}{item.id === 'unread' && unread > 0 ? ` (${unread})` : ''}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        }
        renderItem={({ item, index }) => {
          const category = categories[item.category];
          return (
            <>
              {(index === 0 || visible[index - 1].group !== item.group) && <Text style={styles.group}>{item.group}</Text>}
              <TouchableOpacity
                onPress={() => openNotification(item)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={`${item.isRead ? 'Đã đọc' : 'Chưa đọc'}. ${item.title}. ${item.message}`}
                style={[styles.card, !item.isRead && styles.unreadCard]}
              >
                <View style={[styles.categoryIcon, { backgroundColor: category.background }]}><Ionicons name={category.icon} size={23} color={category.color} /></View>
                <View style={styles.flex}>
                  <View style={styles.cardHeading}>
                    <Text style={[styles.cardTitle, !item.isRead && styles.bold]}>{item.title}</Text>
                    {!item.isRead && <View style={styles.dot} />}
                  </View>
                  <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
                  <View style={styles.metadata}>
                    <Text style={[styles.categoryLabel, { color: category.color }]}>{category.label}</Text>
                    <Text style={styles.time}>•  {item.time}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}><Ionicons name="notifications-off-outline" size={38} color="#93C5FD" /></View>
            <Text style={styles.emptyTitle}>{filter === 'unread' ? 'Bạn đã xem hết rồi!' : 'Chưa có thông báo'}</Text>
            <Text style={styles.emptyText}>{filter === 'unread' ? 'Các thông báo mới sẽ xuất hiện ở đây. Chúc bạn có những hành trình thật vui!' : 'Những cập nhật mới sẽ được hiển thị tại đây.'}</Text>
            <TouchableOpacity onPress={() => setFilter('all')} accessibilityRole="button" style={styles.emptyButton}><Text style={styles.readAllText}>Xem tất cả thông báo</Text></TouchableOpacity>
          </View>
        }
        ListFooterComponent={<Text style={styles.footer}>Dữ liệu mẫu · SkyJourney</Text>}
      />

      <Modal visible={selected !== null} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelected(null)} accessibilityRole="button" accessibilityLabel="Đóng thông báo" />
          <View style={styles.dialog} accessibilityViewIsModal>
            <View style={styles.dialogHeading}>
              <Text style={styles.dialogLabel}>{selected ? categories[selected.category].label : ''}</Text>
              <TouchableOpacity onPress={() => setSelected(null)} accessibilityRole="button" accessibilityLabel="Đóng thông báo" style={styles.back}><Ionicons name="close" size={23} color="#6B7280" /></TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={styles.dialogTitle}>{selected?.title}</Text>
              <Text style={styles.dialogMessage}>{selected?.message}</Text>
            </ScrollView>
            <TouchableOpacity onPress={() => setSelected(null)} accessibilityRole="button" style={styles.done}><Text style={styles.doneText}>Đã hiểu</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F9FAFB' },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 20, flexGrow: 1, width: '100%', maxWidth: 720, alignSelf: 'center' },
  flex: { flex: 1 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 22, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#DBEAFE' },
  summaryIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: '#1E3A8A', marginBottom: 5 },
  summaryText: { fontSize: 13, lineHeight: 20, color: '#3B6AAB' },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', marginTop: 18, gap: 4 },
  unread: { fontSize: 13, color: '#6B7280' },
  readAll: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 44 },
  readAllText: { fontSize: 13, color: '#2563EB', fontWeight: '600' },
  disabled: { color: '#9CA3AF' },
  filters: { gap: 8, paddingTop: 10, paddingBottom: 8 },
  filter: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 22, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  activeFilter: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  activeFilterText: { color: '#FFFFFF' },
  group: { fontSize: 14, fontWeight: '700', color: '#374151', marginTop: 20, marginBottom: 12 },
  card: { flexDirection: 'row', gap: 12, padding: 16, marginBottom: 10, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  unreadCard: { backgroundColor: '#F0F6FF', borderColor: '#DBEAFE' },
  categoryIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  cardHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, fontSize: 14, lineHeight: 21, fontWeight: '600', color: '#1F2937' },
  bold: { fontWeight: '700', color: '#111827' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#2563EB' },
  message: { fontSize: 13, color: '#6B7280', lineHeight: 20, marginTop: 6 },
  metadata: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  categoryLabel: { fontSize: 11, fontWeight: '600' },
  time: { fontSize: 11, color: '#9CA3AF' },
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 20 },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  emptyText: { fontSize: 14, lineHeight: 22, color: '#6B7280', textAlign: 'center', marginTop: 10 },
  emptyButton: { minHeight: 44, justifyContent: 'center', marginTop: 14 },
  footer: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', paddingVertical: 24 },
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 440, maxHeight: '80%', backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24 },
  dialogHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  dialogLabel: { fontSize: 13, fontWeight: '600', color: '#2563EB' },
  dialogTitle: { fontSize: 22, lineHeight: 30, fontWeight: '700', color: '#111827' },
  dialogMessage: { fontSize: 15, lineHeight: 25, color: '#6B7280', marginTop: 14, marginBottom: 20 },
  done: { backgroundColor: '#2563EB', borderRadius: 14, padding: 15, alignItems: 'center' },
  doneText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
