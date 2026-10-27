import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../../hook/useAuth";
import type { RootStackParamList } from "../../navigation/types";

type ChangePasswordProps = NativeStackScreenProps<RootStackParamList, "ChangePassword">;

export default function ChangePasswordScreen({ navigation }: ChangePasswordProps) {
  const { changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // Kiem tra du lieu va thuc hien doi mat khau
  const handleSubmit = async () => {
    if (!currentPassword) {
      Alert.alert("Lỗi", "Vui lòng nhập mật khẩu hiện tại.");
      return;
    }

    if (!newPassword) {
      Alert.alert("Lỗi", "Vui lòng nhập mật khẩu mới.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu mới phải có độ dài từ 6 ký tự trở lên.");
      return;
    }

    if (newPassword === currentPassword) {
      Alert.alert("Lỗi", "Mật khẩu mới không được trùng với mật khẩu hiện tại.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Lỗi", "Xác nhận mật khẩu mới không khớp.");
      return;
    }

    try {
      setSubmitting(true);
      const result = await changePassword({
        currentPassword,
        newPassword,
      });

      if (result.success) {
        Alert.alert("Thành công", result.message || "Đổi mật khẩu thành công.", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert("Thất bại", result.message || "Không thể đổi mật khẩu.");
      }
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Đã xảy ra lỗi khi đổi mật khẩu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={["top"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-3 pb-3 bg-white border-b border-gray-100">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-2 -ml-2"
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">Đổi mật khẩu</Text>
          <View className="w-8" />
        </View>

        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        >
          {/* Form doi mat khau */}
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mt-6 mb-6">
            <Text className="text-xs font-bold text-gray-500 uppercase mb-4">
              Cập nhật mật khẩu
            </Text>

            {/* Mat khau hien tai */}
            <View className="mb-4">
              <Text className="text-xs text-gray-600 font-medium mb-1.5">
                Mật khẩu hiện tại
              </Text>
              <View className="flex-row items-center border border-gray-200 rounded-2xl px-3 py-3 bg-white">
                <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 ml-3 text-gray-900 font-medium text-sm"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Nhập mật khẩu hiện tại"
                  secureTextEntry={!showCurrent}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
                  <Ionicons
                    name={showCurrent ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Mat khau moi */}
            <View className="mb-4">
              <Text className="text-xs text-gray-600 font-medium mb-1.5">
                Mật khẩu mới
              </Text>
              <View className="flex-row items-center border border-gray-200 rounded-2xl px-3 py-3 bg-white">
                <Ionicons name="key-outline" size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 ml-3 text-gray-900 font-medium text-sm"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  secureTextEntry={!showNew}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                  <Ionicons
                    name={showNew ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Xac nhan mat khau moi */}
            <View className="mb-2">
              <Text className="text-xs text-gray-600 font-medium mb-1.5">
                Xác nhận mật khẩu mới
              </Text>
              <View className="flex-row items-center border border-gray-200 rounded-2xl px-3 py-3 bg-white">
                <Ionicons name="shield-checkmark-outline" size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 ml-3 text-gray-900 font-medium text-sm"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Nhập lại mật khẩu mới"
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                  <Ionicons
                    name={showConfirm ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Huong dan bao mat */}
          <View className="bg-blue-50 rounded-2xl p-4 border border-blue-100 mb-8">
            <Text className="text-xs font-semibold text-blue-800 mb-2">
              Quy tắc bảo mật:
            </Text>
            <Text className="text-xs text-blue-700 leading-5">
              - Độ dài tối thiểu 6 ký tự.{"\n"}
              - Mật khẩu mới không được trùng với mật khẩu hiện tại.{"\n"}
              - Nên kết hợp chữ hoa, chữ thường và số để tăng tính bảo mật.
            </Text>
          </View>

          {/* Nut xac nhan */}
          <TouchableOpacity
            className="bg-[#2563EB] rounded-2xl py-4 items-center justify-center flex-row shadow-md shadow-blue-300"
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-base">
                Xác nhận đổi mật khẩu
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
