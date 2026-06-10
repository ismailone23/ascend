import { hasSeenOnboarding } from "@/constants/storagekeys";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type AppContextType = {
  isReady: boolean;
  isOnboarded: boolean;
  completeOnboarding: () => Promise<void>;
};
const AppContext = createContext<AppContextType | undefined>(undefined);
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const value = await AsyncStorage.getItem(hasSeenOnboarding);

        setIsOnboarded(value === "true");
      } finally {
        setIsReady(true);
      }
    }

    init();
  }, []);

  const completeOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(hasSeenOnboarding, "true");
    } catch (error) {
      console.log({ error });
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
