import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { useColorScheme } from "react-native";
import {
  ThemeMode,
  ConcreteThemeId,
  ThemeConfig,
  ThemeColors,
  THEMES,
  THEME_OPTIONS,
  LIGHT_THEME,
  DARK_THEME,
} from "@/constants/Themes";
import { getThemePreference, saveThemePreference } from "@/utils/storage";
import { api } from "@/utils/api";

type ThemeContextType = {
  themeMode: ThemeMode;
  activeThemeId: ConcreteThemeId;
  theme: ThemeConfig;
  colors: ThemeColors;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  syncThemeWithUser: (userTheme?: string, userId?: string) => Promise<void>;
  availableThemes: typeof THEME_OPTIONS;
};

const ThemeContext = createContext<ThemeContextType>({
  themeMode: "system",
  activeThemeId: "light",
  theme: LIGHT_THEME,
  colors: LIGHT_THEME.colors,
  isDark: false,
  setThemeMode: async () => {},
  syncThemeWithUser: async () => {},
  availableThemes: THEME_OPTIONS,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme(); // 'light' | 'dark' | null | undefined
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Load saved theme preference on launch
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const saved = await getThemePreference();
        if (isMounted && saved) {
          const validModes: ThemeMode[] = ["system", "light", "dark", "midnight", "sunset", "emerald"];
          if (validModes.includes(saved as ThemeMode)) {
            setThemeModeState(saved as ThemeMode);
          }
        }
      } catch (err) {
        console.warn("Error loading theme preference:", err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute the active concrete theme
  const activeThemeId: ConcreteThemeId = useMemo(() => {
    if (themeMode === "system") {
      return systemColorScheme === "dark" ? "dark" : "light";
    }
    return themeMode;
  }, [themeMode, systemColorScheme]);

  const theme: ThemeConfig = useMemo(() => {
    return THEMES[activeThemeId] || LIGHT_THEME;
  }, [activeThemeId]);

  // Set theme mode and persist locally + optionally sync backend
  const setThemeMode = useCallback(
    async (newMode: ThemeMode) => {
      setThemeModeState(newMode);
      await saveThemePreference(newMode);

      // If user is currently logged in, sync to backend
      if (currentUserId) {
        try {
          await api.put("/user/theme", {
            userId: currentUserId,
            themePreference: newMode,
          });
        } catch (error) {
          console.warn("Failed to sync theme preference to backend:", error);
        }
      }
    },
    [currentUserId]
  );

  // Synchronize theme when user logs in or switches account
  const syncThemeWithUser = useCallback(
    async (userTheme?: string, userId?: string) => {
      if (userId) {
        setCurrentUserId(userId);
      }
      if (userTheme) {
        const validModes: ThemeMode[] = ["system", "light", "dark", "midnight", "sunset", "emerald"];
        if (validModes.includes(userTheme as ThemeMode)) {
          setThemeModeState(userTheme as ThemeMode);
          await saveThemePreference(userTheme);
        }
      }
    },
    []
  );

  const value = useMemo(
    () => ({
      themeMode,
      activeThemeId,
      theme,
      colors: theme.colors,
      isDark: theme.isDark,
      setThemeMode,
      syncThemeWithUser,
      availableThemes: THEME_OPTIONS,
    }),
    [themeMode, activeThemeId, theme, setThemeMode, syncThemeWithUser]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

// Backward-compatibility token exports
export const LIGHT = LIGHT_THEME.colors;
export const DARK = DARK_THEME.colors;
export type Theme = typeof LIGHT_THEME.colors;
