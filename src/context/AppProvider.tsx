import { hasSeenOnboarding } from "@/constants/storagekeys";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { initializeDatabase } from "@/db/schema";

type AppContextType = {
  isReady: boolean;
  isOnboarded: boolean;
  completeOnboarding: () => Promise<void>;
};

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        await initializeDatabase();
        const value = await AsyncStorage.getItem(hasSeenOnboarding);

        setIsOnboarded(value === "true");
      } catch (error) {
        if (__DEV__) console.warn("Database initialization failed:", error);
      } finally {
        setIsReady(true);
      }
    }

    init();
  }, []);

  const router = useRouter();

  const completeOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(hasSeenOnboarding, "true");
      router.push("/(tabs)");
    } catch (error) {
      // Quietly ignore storage write error in production
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        isReady,
        isOnboarded,
        completeOnboarding,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used inside AppProvider");
  }

  return context;
}
