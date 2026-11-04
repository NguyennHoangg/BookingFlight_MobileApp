import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { isAxiosError } from "axios";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "../../components/common/AppHeader";
import { BirthdayField, PassengerField } from "../../components/booking/PassengerFields";
import { deleteSavedPassenger, getSavedPassengers, savePassenger, type SavedPassenger, type SavedPassengerInput } from "../../api/bookingOptions.api";
import { parseBirthday } from "../../utils/passengerForm";

const labels = { ADULT: "Người lớn", CHILD: "Trẻ em", INFANT: "Em bé" };
const empty = (): SavedPassengerInput => ({ fullName: "", passengerType: "ADULT", dateOfBirth: "", identityNumber: "" });
export default function SavedPassengers() {
  const [rows, setRows] = useState<SavedPassenger[]>([]);
  const [form, setForm] = useState<SavedPassengerInput | null>(null);
  const [editing, setEditing] = useState<string>();
  const [birthday, setBirthday] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const request = useRef<AbortController | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [deleting, setDeleting] = useState<string>();
  const load = useCallback(async () => {
    if (lock.current) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const signal = controller.signal;
    setLoading(true);
    setError("");
    try {
      const passengers = await getSavedPassengers(signal);
      if (!signal?.aborted) setRows(passengers);
    } catch {
      if (!signal?.aborted) setError("Không thể tải danh bạ. Vui lòng thử lại.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);
  useFocusEffect(useCallback(() => {
    void load();
    return () => request.current?.abort();
  }, [load]));
  const open = (row?: SavedPassenger) => {
    setForm(row ? { fullName: row.fullName, passengerType: row.passengerType, dateOfBirth: row.dateOfBirth.slice(0, 10), identityNumber: row.identityNumber } : empty());
    setEditing(row?.id);
    setBirthday(row ? row.dateOfBirth.slice(0, 10).split("-").reverse().join("/") : "");
    setError(""); setMessage(""); setDeleting(undefined);
  };
  const save = async () => {
    if (!form || lock.current) return;
    const dateOfBirth = parseBirthday(birthday);
    if (!dateOfBirth) { setError("Nhập ngày sinh hợp lệ theo dạng DD/MM/YYYY."); return; }
    lock.current = true; setBusy(true); setError(""); setMessage("");
    request.current?.abort(); setLoading(false);
    try {
      const saved = await savePassenger({ ...form, dateOfBirth }, editing);
      setRows(old => [...old.filter(row => row.id !== saved.id), saved].sort((a, b) => a.fullName.localeCompare(b.fullName)));
      setForm(null); setEditing(undefined); setMessage("Đã lưu hành khách vào danh bạ.");
    } catch (cause) {
      setError(isAxiosError(cause) && typeof cause.response?.data?.message === "string" ? cause.response.data.message : "Không thể lưu hành khách. Vui lòng thử lại.");
    } finally { lock.current = false; setBusy(false); }
  };
  const remove = async (id: string) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(""); setMessage("");
    request.current?.abort(); setLoading(false);
    try {
      await deleteSavedPassenger(id);
      setRows(old => old.filter(row => row.id !== id)); setDeleting(undefined);
      setMessage("Đã xóa hành khách khỏi danh bạ.");
    } catch { setError("Không thể xóa hành khách. Vui lòng thử lại."); }
    finally { lock.current = false; setBusy(false); }
  };
  return (
    <SafeAreaView edges={["left", "right", "bottom"]} className="flex-1 bg-gray-50">
      <AppHeader title="Hành khách đã lưu" back />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { if (!busy) void load(); }} />}>
          <Text className="mb-4 text-sm leading-6 text-gray-500">Lưu thông tin đúng giấy tờ để điền nhanh khi đặt vé. Kiểm tra lại loại hành khách theo tuổi tại ngày bay.</Text>
          {!!error && <View className="mb-4"><Text accessibilityRole="alert" className="text-red-600">{error}</Text>{!form && <Pressable onPress={() => void load()}><Text className="mt-2 text-blue-600">Tải lại danh bạ</Text></Pressable>}</View>}
          {!!message && <Text accessibilityLiveRegion="polite" className="mb-4 text-green-700">{message}</Text>}
          {form ? <View className="mb-5 rounded-2xl bg-white p-4">
            <Text className="text-lg font-bold text-gray-900">{editing ? "Sửa hành khách" : "Thêm hành khách"}</Text>
            <PassengerField label="Họ và tên *" value={form.fullName} editable={!busy} maxLength={150} onChangeText={fullName => setForm(old => old && ({ ...old, fullName }))} />
            <Text className="mb-2 mt-4 text-xs text-gray-600">Loại hành khách</Text>
            <View className="flex-row flex-wrap gap-2">{(Object.keys(labels) as (keyof typeof labels)[]).map(type => <Pressable key={type} disabled={busy} accessibilityRole="radio" accessibilityState={{ checked: form.passengerType === type }} onPress={() => setForm(old => old && ({ ...old, passengerType: type }))} className={`rounded-xl border p-3 ${form.passengerType === type ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}><Text className="text-sm text-gray-800">{labels[type]}</Text></Pressable>)}</View>
            <BirthdayField value={birthday} onChange={value => { if (!busy) setBirthday(value); }} travelDate={new Date().toISOString()} />
            <PassengerField label="CCCD / Hộ chiếu" value={form.identityNumber ?? ""} editable={!busy} autoCapitalize="characters" maxLength={30} onChangeText={identityNumber => setForm(old => old && ({ ...old, identityNumber }))} />
            <Pressable disabled={busy} onPress={() => void save()} className="mt-5 rounded-xl bg-blue-600 p-4">{busy ? <ActivityIndicator color="white" /> : <Text className="text-center font-bold text-white">Lưu hành khách</Text>}</Pressable>
            <Pressable disabled={busy} onPress={() => { setForm(null); setError(""); }} className="mt-2 p-3"><Text className="text-center text-gray-500">Hủy</Text></Pressable>
          </View> : <Pressable disabled={busy} onPress={() => open()} className="mb-5 rounded-xl bg-blue-600 p-4"><Text className="text-center font-bold text-white">Thêm hành khách</Text></Pressable>}
          {loading && !rows.length && <ActivityIndicator color="#2563EB" />}
          {!loading && !rows.length && <Text className="py-6 text-center text-gray-500">Danh bạ chưa có hành khách.</Text>}
          {rows.map(row => <View key={row.id} className="mb-3 rounded-2xl border border-gray-100 bg-white p-4">
            <Text className="font-bold text-gray-900">{row.fullName}</Text>
            <Text className="mt-2 text-sm text-gray-500">{labels[row.passengerType]} · {row.dateOfBirth.slice(0, 10).split("-").reverse().join("/")}</Text>
            {row.identityNumber && <Text className="mt-1 text-sm text-gray-500">Giấy tờ: ••••{row.identityNumber.slice(-4)}</Text>}
            {deleting === row.id ? <View className="mt-3"><Text className="text-sm text-red-600">Xóa hành khách này khỏi danh bạ?</Text><View className="mt-2 flex-row gap-5"><Pressable disabled={busy} onPress={() => void remove(row.id)} className="p-2"><Text className="font-bold text-red-600">Xác nhận xóa</Text></Pressable><Pressable disabled={busy} onPress={() => setDeleting(undefined)} className="p-2"><Text className="text-gray-500">Hủy</Text></Pressable></View></View> : <View className="mt-3 flex-row gap-5"><Pressable disabled={busy} onPress={() => open(row)} className="p-2"><Text className="font-bold text-blue-600">Chỉnh sửa</Text></Pressable><Pressable disabled={busy} onPress={() => { setDeleting(row.id); setError(""); }} className="p-2"><Text className="text-red-600">Xóa</Text></Pressable></View>}
          </View>)}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
