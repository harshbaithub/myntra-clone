import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo } from "react";
import "react-native-reanimated";

import { AuthProvider } from "@/context/AuthContext";
import { ActivityProvider } from "@/context/ActivityContext";
import { ThemeProvider as AppThemeProvider, useTheme } from "@/context/ThemeContext";
import { NotificationProvider } from "@/context/NotificationContext";
import NotificationBanner from "@/components/NotificationBanner";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const { colors, isDark } = useTheme();

  const navTheme = useMemo(() => {
    const baseTheme = isDark ? DarkTheme : DefaultTheme;
    return {
      ...baseTheme,
      dark: isDark,
      colors: {
        ...baseTheme.colors,
        primary: colors.primary,
        background: colors.bg,
        card: colors.card,
        text: colors.text,
        border: colors.divider,
        notification: colors.badge,
      },
    };
  }, [isDark, colors]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = "Myntra - Online Shopping";
      let styleEl = document.getElementById("myntra-global-input-fix") as HTMLStyleElement | null;
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "myntra-global-input-fix";
        document.head.appendChild(styleEl);
      }
      styleEl.innerHTML = `
        input, textarea, select {
          color: ${colors.text} !important;
          caret-color: #ff3f6c !important;
        }
        input::placeholder, textarea::placeholder {
          color: ${colors.placeholderText} !important;
          opacity: 1 !important;
          -webkit-text-fill-color: ${colors.placeholderText} !important;
        }
        /* Fix Chrome/Edge/Brave dark mode autofill text invisibility */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-text-fill-color: ${colors.text} !important;
          -webkit-box-shadow: 0 0 0px 1000px ${colors.inputBg} inset !important;
          box-shadow: 0 0 0px 1000px ${colors.inputBg} inset !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `;
    }
  }, [colors]);

  return (
    <NavigationThemeProvider value={navTheme}>
      <AuthProvider>
        <NotificationProvider>
          <ActivityProvider>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="settings" />
              <Stack.Screen name="notifications" />
              <Stack.Screen name="recently-viewed" />
              <Stack.Screen name="orders" />
              <Stack.Screen name="addresses" />
              <Stack.Screen name="checkout" />
              <Stack.Screen name="product/[id]" />
            </Stack>
            <NotificationBanner />
            <StatusBar style={isDark ? "light" : "dark"} backgroundColor={colors.header} />
          </ActivityProvider>
        </NotificationProvider>
      </AuthProvider>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AppThemeProvider>
      <RootLayoutContent />
    </AppThemeProvider>
  );
}
