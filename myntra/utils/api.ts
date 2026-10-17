import axios from "axios";
import { Platform } from "react-native";
import Constants from "expo-constants";

// Dynamically determine the machine IP when running on physical device, emulator or web
const getApiBaseUrl = () => {
  if (Platform.OS === "web") {
    if (process.env.EXPO_PUBLIC_API_URL) {
      return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, "");
    }
    if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      return `${window.location.origin}/api`;
    }
    return "http://localhost:5000/api";
  }
  
  // Hardcoded current LAN IP for physical mobile device connectivity
  const LAN_IP = "10.89.122.50";

  // Expo host URI extraction (only if it is a genuine numeric IP, not an exp.direct/ngrok tunnel)
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any)?.manifest2?.extra?.expoClient?.hostUri;
  if (hostUri) {
    const rawHost = hostUri.split(":")[0];
    const isNumericIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(rawHost);
    if (isNumericIp && rawHost !== "127.0.0.1" && rawHost !== "localhost") {
      return `http://${rawHost}:5000/api`;
    }
  }
  
  // Fallback to active LAN IP
  return `http://${LAN_IP}:5000/api`;
};

export const API_BASE_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

