import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const useWebStorage = Platform.OS === "web";

const setItem = async (key: string, value: string) => {
  if (useWebStorage) {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
};

const getItem = async (key: string) => {
  if (useWebStorage) {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
};

const deleteItem = async (key: string) => {
  if (useWebStorage) {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
};

export const THEME_PREFERENCE_KEY = "myntra_theme_preference";

export const saveUserData = async (
  _id: string,
  name: string,
  email: string,
  themePreference?: string
) => {
  await setItem("userid", _id);
  await setItem("userName", name);
  await setItem("userEmail", email);
  if (themePreference) {
    await setItem(THEME_PREFERENCE_KEY, themePreference);
  }
};

export const getUserData = async () => {
  const _id = await getItem("userid");
  const name = await getItem("userName");
  const email = await getItem("userEmail");
  const themePreference = await getItem(THEME_PREFERENCE_KEY);
  return { _id, name, email, themePreference };
};

export const clearUserData = async () => {
  await deleteItem("userid");
  await deleteItem("userName");
  await deleteItem("userEmail");
};

export const saveThemePreference = async (theme: string): Promise<void> => {
  try {
    await setItem(THEME_PREFERENCE_KEY, theme);
  } catch (error) {
    console.error("Error saving theme preference:", error);
  }
};

export const getThemePreference = async (): Promise<string | null> => {
  try {
    return await getItem(THEME_PREFERENCE_KEY);
  } catch (error) {
    console.error("Error reading theme preference:", error);
    return null;
  }
};

const RECENTLY_VIEWED_KEY = "myntra_recently_viewed";

export const getLocalRecentlyViewed = async (): Promise<any[]> => {
  try {
    const raw = await getItem(RECENTLY_VIEWED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error reading local recently viewed:", error);
    return [];
  }
};

export const saveLocalRecentlyViewed = async (products: any[]): Promise<void> => {
  try {
    // Store compact payload (IDs and key metadata) to stay within SecureStore 2048-byte limit
    const compactList = (products || []).slice(0, 50).map((p) => ({
      _id: p._id,
      name: p.name?.substring(0, 30),
      brand: p.brand?.substring(0, 20),
      price: p.price,
      discount: p.discount,
      images: Array.isArray(p.images) && p.images[0] ? [p.images[0]] : [],
      viewedAt: p.viewedAt,
    }));
    await setItem(RECENTLY_VIEWED_KEY, JSON.stringify(compactList));
  } catch (error) {
    console.error("Error saving local recently viewed:", error);
  }
};

export const clearLocalRecentlyViewed = async (): Promise<void> => {
  try {
    await deleteItem(RECENTLY_VIEWED_KEY);
  } catch (error) {
    console.error("Error clearing local recently viewed:", error);
  }
};

