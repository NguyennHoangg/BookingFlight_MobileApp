import React, { type ComponentProps } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { goBack } from '../../navigation/routes';
import NotificationBell from './NotificationBell';

type HeaderAction = {
  label: string;
  onPress: () => void;
  icon?: ComponentProps<typeof Ionicons>['name'];
  disabled?: boolean;
};

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  back?: boolean;
  onBack?: () => void;
  notifications?: boolean;
  action?: HeaderAction;
};

/** Owns the top safe area; screen containers should exclude the top edge. */
export default function AppHeader({ title, subtitle, back = false, onBack = goBack, notifications = false, action }: AppHeaderProps) {
  const { top } = useSafeAreaInsets();
  return (
    <View style={[styles.safeArea, { paddingTop: top }]}>
      <View style={styles.container}>
        {back ? (
          <View style={styles.side}>
            <TouchableOpacity onPress={onBack} accessibilityRole="button" accessibilityLabel="Quay lại" style={styles.button}>
              <Ionicons name="arrow-back" size={22} color="#1F2937" />
            </TouchableOpacity>
          </View>
        ) : (
          <Image source={require('../../../assets/Splash_icon.png')} style={styles.logo} resizeMode="contain" accessibilityIgnoresInvertColors />
        )}
        <View style={[styles.heading, back && styles.centered]}>
          <Text accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} style={[styles.title, back && styles.centerText]}>{title}</Text>
          {subtitle ? <Text numberOfLines={1} style={[styles.subtitle, back && styles.centerText]}>{subtitle}</Text> : null}
        </View>
        <View style={[styles.side, styles.right]}>
          {action ? (
            <TouchableOpacity
              onPress={action.onPress}
              disabled={action.disabled}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              accessibilityState={{ disabled: !!action.disabled }}
              style={[styles.button, action.disabled && styles.disabled]}
            >
              {action.icon ? <Ionicons name={action.icon} size={22} color="#2563EB" /> : <Text style={styles.actionText}>{action.label}</Text>}
            </TouchableOpacity>
          ) : notifications ? <NotificationBell /> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flexShrink: 0, backgroundColor: '#FFFFFF', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB' },
  container: { width: '100%', maxWidth: 720, alignSelf: 'center', height: 72, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  side: { width: 56, minHeight: 44, justifyContent: 'center', alignItems: 'flex-start' },
  right: { alignItems: 'flex-end' },
  button: { minWidth: 44, minHeight: 44, paddingHorizontal: 6, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 40, height: 40, marginRight: 4 },
  heading: { flex: 1, minWidth: 0, gap: 4 },
  centered: { alignItems: 'center' },
  title: { fontSize: 18, lineHeight: 24, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 12, lineHeight: 17, color: '#6B7280' },
  centerText: { textAlign: 'center' },
  actionText: { fontSize: 13, fontWeight: '600', color: '#2563EB' },
  disabled: { opacity: 0.4 },
});
