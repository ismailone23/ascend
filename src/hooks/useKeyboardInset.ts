import { useEffect, useRef, useState } from "react";
import { Keyboard, View } from "react-native";

/**
 * Keeps a view clear of the keyboard: spread the result onto a wrapping View.
 * Edge-to-edge Android does not resize for the keyboard, and
 * KeyboardAvoidingView leaves its padding behind after the keyboard closes, so
 * the overlap is measured when it opens and dropped when it closes.
 */
export function useKeyboardInset() {
  const ref = useRef<View>(null);
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (e) =>
      // Only the part of this view the keyboard covers, so a tab bar below
      // the view is not counted twice. pageY, not measureInWindow: on Android
      // that one leaves out the status bar and comes up short.
      ref.current?.measure((_x, _y, _width, height, _pageX, pageY) =>
        setInset(Math.max(0, pageY + height - e.endCoordinates.screenY)),
      ),
    );
    const hide = Keyboard.addListener("keyboardDidHide", () => setInset(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return { ref, style: { flex: 1, paddingBottom: inset } };
}
