import { themeKey } from "@/constants/storagekeys";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useColorScheme } from "react-native";

type ThemeContextType = {
  isDark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

type ThemeProviderProps = {
  children: ReactNode;
};

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const colorScheme = useColorScheme();
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(themeKey);

        if (storedTheme !== null) {
          setIsDark(JSON.parse(storedTheme));
        } else {
          const systemDark = colorScheme === "dark";
          setIsDark(systemDark);
          await AsyncStorage.setItem(themeKey, JSON.stringify(systemDark));
        }
      } catch {
        setIsDark(colorScheme === "dark");
      }
    };
    loadData();
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(themeKey, JSON.stringify(next)).catch(console.error);
      return next;
    });
  }, []);

  if (isDark === null) return null;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}
