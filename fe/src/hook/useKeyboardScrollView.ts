import { useState, useEffect, useRef } from "react";
import { Keyboard, Platform, ScrollView } from "react-native";

interface UseKeyboardScrollViewOptions {
  initialPadding?: number;
  extraPadding?: number;
  scrollDelay?: number;
}

/**
 * Custom hook giúp tự động điều chỉnh padding bottom khi mở/đóng bàn phím
 * và cuộn mượt mà đến vị trí input đang focus, tái sử dụng cho mọi màn hình.
 */
export const useKeyboardScrollView = (options?: UseKeyboardScrollViewOptions) => {
  const initialPadding = options?.initialPadding ?? 40;
  const extraPadding = options?.extraPadding ?? 60;
  const scrollDelay = options?.scrollDelay ?? 150;

  const scrollViewRef = useRef<ScrollView>(null);
  const [keyboardPadding, setKeyboardPadding] = useState(initialPadding);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardPadding(e.endCoordinates.height + extraPadding);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardPadding(initialPadding);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [initialPadding, extraPadding]);

  const scrollToInput = (yOffset: number) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: yOffset, animated: true });
    }, scrollDelay);
  };

  return {
    scrollViewRef,
    keyboardPadding,
    scrollToInput,
  };
};

export default useKeyboardScrollView;
