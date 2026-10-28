import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  category: 'flight' | 'promotion' | 'system';
  time: string;
  group: string;
  isRead: boolean;
};

// Sample inbox until the backend exposes notification endpoints.
const initialState: AppNotification[] = [
  { id: 'demo-1', title: 'Đặt vé thành công!', message: 'Hành trình TP. Hồ Chí Minh → Hà Nội của bạn đã được xác nhận. Bạn có thể xem lại thông tin hành khách, hành lý và lịch trình trong mục Vé của tôi.', category: 'flight', time: '09:30', group: 'Mới nhất', isRead: false },
  { id: 'demo-2', title: 'Sẵn sàng cho chuyến đi tiếp theo?', message: 'Khám phá các chặng bay nội địa với ưu đãi lên đến 25%. Giá vé và điều kiện áp dụng được hiển thị khi bạn tìm kiếm chuyến bay.', category: 'promotion', time: '08:15', group: 'Mới nhất', isRead: false },
  { id: 'demo-3', title: 'Làm thủ tục trực tuyến thật dễ dàng', message: 'Tiết kiệm thời gian tại sân bay bằng cách làm thủ tục trực tuyến. Chuẩn bị mã đặt chỗ và kiểm tra thời gian mở check-in theo quy định của hãng hàng không.', category: 'flight', time: '07:00', group: 'Mới nhất', isRead: false },
  { id: 'demo-4', title: 'Chào mừng đến với SkyJourney', message: 'Cảm ơn bạn đã đồng hành cùng SkyJourney! Tìm chuyến bay, lưu hành trình yêu thích và quản lý vé của bạn ngay trong ứng dụng.', category: 'system', time: '16:45', group: 'Trước đó', isRead: true },
  { id: 'demo-5', title: 'Một hành trình mới đang chờ bạn', message: 'Biển xanh Đà Nẵng hay nhịp sống Hà Nội? Khám phá các chặng bay phổ biến trên trang chủ để lên kế hoạch cho kỳ nghỉ tiếp theo.', category: 'promotion', time: '10:20', group: 'Trước đó', isRead: true },
];

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    markAsRead(state, action: PayloadAction<string>) {
      const item = state.find((notification) => notification.id === action.payload);
      if (item) item.isRead = true;
    },
    markAllAsRead(state) {
      state.forEach((item) => { item.isRead = true; });
    },
  },
});

export const { markAsRead, markAllAsRead } = notificationsSlice.actions;
export default notificationsSlice.reducer;
