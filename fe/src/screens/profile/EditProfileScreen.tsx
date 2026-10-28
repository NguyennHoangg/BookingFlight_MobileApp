import { navigate, goBack } from "../../navigation/routes";
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../hook/useAuth";

// Chuyen doi gia tri gioi tinh giua boolean va chuoi hien thi
const formatGenderToString = (genderVal: boolean | string | number | null | undefined): string => {
  if (genderVal === true || genderVal === "Nam" || genderVal === "true" || genderVal === 1) return "Nam";
  if (genderVal === false || genderVal === "Nữ" || genderVal === "false" || genderVal === 0) return "Nữ";
  return "Nam"; // Mac dinh luon la Nam neu chua duoc thiet lap
};

const formatGenderToBoolean = (genderStr: string): boolean => {
  return genderStr === "Nam";
};

// Dinh dang chuoi ngay sinh thanh dang YYYY-MM-DD
const formatDateToString = (rawDate: any): string => {
  if (!rawDate) return "";
  try {
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return "";
  }
};


export default function EditProfileScreen() {
  const { user, updateProfile } = useAuth();

  // Khoi tao state form tu thong tin user hien tai
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || user?.phoneNumber || "");
  const [dateOfBirth, setDateOfBirth] = useState(formatDateToString(user?.dateOfBirth));
  const [gender, setGender] = useState(formatGenderToString(user?.gender));
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const dateInputRef = useRef<any>(null);


  // Khoi phuc lai thong tin ban dau
  const handleReset = () => {
    if (user) {
      setFullName(user.fullName || "");
      setPhone(user.phone || user.phoneNumber || "");
      setDateOfBirth(formatDateToString(user.dateOfBirth));
      setGender(formatGenderToString(user.gender));
      setAvatarUrl(user.avatarUrl || "");
    }
  };

  // Luu thong tin ho so da cap nhat
  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert("Lỗi", "Họ và tên không được để trống.");
      return;
    }

    if (!phone.trim()) {
      Alert.alert("Lỗi", "Số điện thoại không được để trống.");
      return;
    }

    try {
      setSubmitting(true);
      const result = await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        avatarUrl: avatarUrl.trim() || undefined,
        gender: formatGenderToBoolean(gender),
        dateOfBirth: dateOfBirth || null,
      });

      if (result.success) {
        Alert.alert("Thành công", "Thông tin hồ sơ đã được cập nhật.", [
          { text: "OK", onPress: () => goBack() },
        ]);
      } else {
        Alert.alert("Thất bại", result.message || "Cập nhật hồ sơ thất bại.");
      }
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Đã xảy ra lỗi khi cập nhật hồ sơ.");
    } finally {
      setSubmitting(false);
    }
  };

  // Chuc nang cap nhat URL anh dai dien
  const handleChangeAvatar = () => {
    Alert.prompt
      ? Alert.prompt(
          "Cập nhật ảnh đại diện",
          "Nhập đường dẫn URL ảnh đại diện mới:",
          [
            { text: "Hủy", style: "cancel" },
            {
              text: "Lưu",
              onPress: (url?: string) => {
                if (url && url.trim()) {
                  setAvatarUrl(url.trim());
                }
              },
            },
          ],
          "plain-text",
          avatarUrl
        )
      : Alert.alert(
          "Thay đổi ảnh đại diện",
          "Vui lòng nhập đường dẫn URL ảnh trên máy chủ hoặc sử dụng thư viện chọn ảnh."
        );
  };

  // Mo bo chon ngay sinh
  const openDatePicker = () => {
    if (Platform.OS === "web") {
      if (dateInputRef.current) {
        if (typeof dateInputRef.current.showPicker === "function") {
          dateInputRef.current.showPicker();
        } else {
          dateInputRef.current.click();
        }
      }
    } else {
      setShowDatePicker(true);
    }
  };

  const defaultAvatar =
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80";

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={["top"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-3 pb-3 bg-white border-b border-gray-100">
          <TouchableOpacity
            onPress={() => goBack()}
            className="p-2 -ml-2"
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">
            Chỉnh sửa hồ sơ
          </Text>
          <TouchableOpacity onPress={handleReset}>
            <Text className="text-sm font-medium text-gray-500">Đặt lại</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        >
          {/* Anh dai dien */}
          <View className="items-center mt-6 mb-6">
            <View className="relative">
              <Image
                source={{ uri: avatarUrl || defaultAvatar }}
                className="w-24 h-24 rounded-full border-4 border-white shadow-sm"
              />
              <TouchableOpacity
                onPress={handleChangeAvatar}
                className="absolute bottom-0 right-0 bg-blue-600 w-8 h-8 rounded-full items-center justify-center border-2 border-white shadow-sm"
              >
                <Ionicons name="camera" size={14} color="white" />
              </TouchableOpacity>
            </View>
            <Text className="text-xs text-gray-500 mt-3">
              Chạm vào máy ảnh để đổi URL ảnh đại diện
            </Text>

            <View className="bg-blue-50 px-4 py-1.5 rounded-full mt-3 flex-row items-center border border-blue-100">
              <Ionicons name="star" size={14} color="#2563EB" />
              <Text className="text-xs font-semibold text-blue-600 ml-1">
                Hội viên {user?.membershipTier || "MEMBER"}
              </Text>
            </View>
          </View>

          {/* Form thong tin ca nhan */}
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
            <Text className="text-xs font-bold text-gray-500 uppercase mb-4">
              Thông tin cá nhân
            </Text>

            {/* Ho va ten */}
            <View className="mb-4">
              <Text className="text-xs text-gray-600 font-medium mb-1.5">
                Họ và tên
              </Text>
              <View className="flex-row items-center border border-gray-200 rounded-2xl px-3 py-3 bg-white">
                <Ionicons name="person-outline" size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 ml-3 text-gray-900 font-medium text-sm"
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Nhập họ và tên"
                />
              </View>
            </View>

            {/* Email (Chi doc, khong cho sua de dam bao an toan tai khoan) */}
            <View className="mb-4">
              <Text className="text-xs text-gray-600 font-medium mb-1.5">
                Email đăng nhập
              </Text>
              <View className="flex-row items-center border border-gray-100 rounded-2xl px-3 py-3 bg-gray-50">
                <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-gray-500 font-medium text-sm"
                  value={user?.email || ""}
                  editable={false}
                />
                <Ionicons name="lock-closed" size={16} color="#9CA3AF" />
              </View>
              <Text className="text-[11px] text-gray-400 mt-1 ml-1">
                Email dùng để đăng nhập và nhận vé, không thể thay đổi
              </Text>
            </View>

            {/* So dien thoai */}
            <View className="mb-4">
              <Text className="text-xs text-gray-600 font-medium mb-1.5">
                Số điện thoại
              </Text>
              <View className="flex-row items-center border border-gray-200 rounded-2xl px-3 py-3 bg-white">
                <Ionicons name="call-outline" size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 ml-3 text-gray-900 font-medium text-sm"
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Nhập số điện thoại"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Ngay sinh */}
            <View className="mb-4">
              <Text className="text-xs text-gray-600 font-medium mb-1.5">
                Ngày sinh
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={openDatePicker}
                className="flex-row items-center border border-gray-200 rounded-2xl px-3 py-3 bg-white relative overflow-hidden"
              >
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                <Text className="flex-1 ml-3 text-gray-900 font-medium text-sm">
                  {dateOfBirth
                    ? dateOfBirth.split("-").reverse().join("/")
                    : "Chọn ngày sinh"}
                </Text>

                {Platform.OS === "web" &&
                  React.createElement("input", {
                    ref: dateInputRef,
                    type: "date",
                    value: dateOfBirth,
                    onChange: (e: any) => {
                      if (e.target.value) setDateOfBirth(e.target.value);
                    },
                    style: {
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      opacity: 0,
                      pointerEvents: "none",
                    },
                  })}
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={
                    dateOfBirth ? new Date(dateOfBirth) : new Date(1995, 0, 1)
                  }
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  maximumDate={new Date()}
                  onChange={(_event, date) => {
                    setShowDatePicker(Platform.OS === "ios");
                    if (date) {
                      const yyyy = date.getFullYear();
                      const mm = String(date.getMonth() + 1).padStart(2, "0");
                      const dd = String(date.getDate()).padStart(2, "0");
                      setDateOfBirth(`${yyyy}-${mm}-${dd}`);
                    }
                  }}
                />
              )}
            </View>

            {/* Gioi tinh */}
            <View>
              <Text className="text-xs text-gray-600 font-medium mb-1.5">
                Giới tính
              </Text>
              <View className="flex-row bg-gray-50 rounded-xl p-1 border border-gray-100">
                {(["Nam", "Nữ"] as const).map((g) => {
                  const isSelected = gender === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      activeOpacity={0.8}
                      className="flex-1 py-2.5 items-center rounded-lg"
                      style={{
                        backgroundColor: isSelected ? "#2563EB" : "transparent",
                      }}
                      onPress={() => setGender(g)}
                    >
                      <Text
                        className="font-semibold text-sm"
                        style={{
                          color: isSelected ? "#FFFFFF" : "#6B7280",
                        }}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Bao mat va doi mat khau */}
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
            <Text className="text-xs font-bold text-gray-500 uppercase mb-4">
              Bảo mật tài khoản
            </Text>
            <TouchableOpacity
              onPress={() => navigate("ChangePassword")}
              className="flex-row items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-white items-center justify-center border border-gray-100 shadow-sm">
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#4B5563"
                  />
                </View>
                <View className="ml-3">
                  <Text className="text-sm font-bold text-gray-900">
                    Đổi mật khẩu
                  </Text>
                  <Text className="text-xs text-gray-500 mt-0.5">
                    Quản lý mật khẩu đăng nhập của bạn
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Nut luu thay doi */}
          <TouchableOpacity
            className="bg-[#2563EB] rounded-2xl py-4 items-center justify-center flex-row shadow-md shadow-blue-300 mb-10"
            onPress={handleSave}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons
                  name="save-outline"
                  size={20}
                  color="white"
                  className="mr-2"
                />
                <Text className="text-white font-bold text-base ml-2">
                  Lưu thay đổi
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
