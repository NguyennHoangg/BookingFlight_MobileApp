import React, { useState, useEffect } from 'react';
import { View, Image, ImageResizeMode, StyleProp, ViewStyle, ImageStyle } from 'react-native';
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
  const [loading, setLoading] = useState(() => isSvgUrl(uri));

  const isSvg = isSvgUrl(uri);

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
    return (
      <View style={[{ alignItems: 'center', justifyContent: 'center' }, containerStyle]}>
        <Ionicons
          name={fallbackIconName}
          size={fallbackIconSize}
          color={fallbackIconColor}
          style={{ transform: [{ rotate: '270deg' }] }}
        />
      </View>
    );
  }

  // Nếu là file SVG
  if (isSvg) {
    if (loading || !svgXml) {
      return (
        <View style={[{ alignItems: 'center', justifyContent: 'center' }, containerStyle]}>
          <Ionicons
            name={fallbackIconName}
            size={fallbackIconSize}
            color="#9CA3AF"
            style={{ transform: [{ rotate: '270deg' }] }}
          />
        </View>
      );
    }
    return (
      <View style={[{ width: width as any, height: height as any, overflow: 'hidden' }, containerStyle]}>
        <SvgCss xml={svgXml} width="100%" height="100%" />
      </View>
    );
  }

  // Nếu là ảnh thông thường (PNG, JPG, WebP)
  return (
    <View style={[{ width: width as any, height: height as any, overflow: 'hidden' }, containerStyle]}>
      <Image
        source={{
          uri,
          headers: DEFAULT_IMAGE_HEADERS,
        }}
        style={[{ width: '100%', height: '100%' }, imageStyle]}
        resizeMode={resizeMode}
        onError={(e) => {
          console.log('[RemoteImage] Lỗi tải ảnh:', e.nativeEvent?.error);
          setError(true);
        }}
      />
    </View>
  );
}
