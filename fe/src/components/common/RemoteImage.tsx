import React, { useState, useEffect } from 'react';
import { View, Image, Platform, ImageResizeMode, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SvgCss } from 'react-native-svg/css';
import { isSvgUrl, fetchSvgXml, DEFAULT_IMAGE_HEADERS } from '../../utils/svg';

interface RemoteImageProps {
  uri?: string | null;
  alt?: string;
  width?: number | string;
  height?: number | string;
  resizeMode?: ImageResizeMode;
  containerStyle?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  fallbackIconName?: keyof typeof Ionicons.glyphMap;
  fallbackIconSize?: number;
  fallbackIconColor?: string;
}

export default function RemoteImage(props: RemoteImageProps) {
  return <RemoteImageContent key={props.uri || "empty"} {...props} />;
}

function RemoteImageContent({
  uri,
  alt,
  width = '100%',
  height = '100%',
  resizeMode = 'contain',
  containerStyle,
  imageStyle,
  fallbackIconName = 'airplane',
  fallbackIconSize = 16,
  fallbackIconColor = '#3B82F6',
}: RemoteImageProps) {
  const [svgXml, setSvgXml] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(() => Platform.OS !== 'web' && isSvgUrl(uri));

  // Browsers load SVG as an image, without XML parsing or a CORS fetch.
  const isSvg = Platform.OS !== 'web' && isSvgUrl(uri);
  const frameStyle: StyleProp<ViewStyle> = [
    { width: width as ViewStyle['width'], height: height as ViewStyle['height'], overflow: 'hidden' },
    containerStyle,
  ];
  const fallback = (
    <View style={[frameStyle, { alignItems: 'center', justifyContent: 'center' }]} accessibilityLabel={alt}>
      <Ionicons
        name={fallbackIconName}
        size={fallbackIconSize}
        color={fallbackIconColor}
        style={{ transform: [{ rotate: '270deg' }] }}
      />
    </View>
  );

  useEffect(() => {
    if (!uri) return;

    let cancelled = false;
    if (isSvg) {
      fetchSvgXml(uri)
        .then((xml) => {
          if (cancelled) return;
          setSvgXml(xml);
          setLoading(false);
        })
        .catch((err) => {
          if (cancelled) return;
          console.log('[RemoteImage] Lỗi tải SVG:', err.message);
          setError(true);
          setLoading(false);
        });
    }
    return () => { cancelled = true; };
  }, [uri, isSvg]);

  // Nếu không có URI hoặc bị lỗi -> Hiển thị icon fallback
  if (!uri || error) {
    return fallback;
  }

  // Nếu là file SVG
  if (isSvg) {
    if (loading || !svgXml) {
      return fallback;
    }
    return (
      <View style={frameStyle} accessibilityLabel={alt}>
        <SvgCss
          xml={svgXml}
          width="100%"
          height="100%"
          fallback={fallback}
          // SvgCss calls onError during render; use its fallback instead of setting state here.
          onError={() => undefined}
        />
      </View>
    );
  }

  // Nếu là ảnh thông thường (PNG, JPG, WebP)
  return (
    <View style={frameStyle}>
      <Image
        source={{
          uri,
          ...(Platform.OS === 'web' ? {} : { headers: DEFAULT_IMAGE_HEADERS }),
        }}
        style={[{ width: '100%', height: '100%' }, imageStyle]}
        resizeMode={resizeMode}
        accessibilityLabel={alt}
        onError={(e) => {
          console.log('[RemoteImage] Lỗi tải ảnh:', e.nativeEvent?.error);
          setError(true);
        }}
      />
    </View>
  );
}
