import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-constants";
import { useRouter } from "expo-router";
import { api } from "@/utils/api";
import { useAuth } from "./AuthContext";

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationItem {
  _id?: string;
  id?: string;
  category:
    | "order_confirmation"
    | "payment_update"
    | "shipping_update"
    | "delivery_status"
    | "price_drop"
    | "back_in_stock"
    | "promotional"
    | "abandoned_cart"
    | "system_alert";
  title: string;
  body: string;
  data?: Record<string, any>;
  status?: "delivered" | "pending" | "failed" | "invalid_token" | "skipped_by_user_preference";
  sentAt?: string;
  createdAt?: string;
  isRead?: boolean;
}

export interface NotificationPreferencesType {
  orderUpdates: boolean;
  paymentUpdates: boolean;
  shippingAndDelivery: boolean;
  wishlistPriceDrops: boolean;
  backInStock: boolean;
  promotions: boolean;
  abandonedCart: boolean;
}

interface NotificationContextType {
  expoPushToken: string | null;
  permissionGranted: boolean;
  notificationHistory: NotificationItem[];
  unreadCount: number;
  activeBanner: NotificationItem | null;
  preferences: NotificationPreferencesType;
  isLoadingHistory: boolean;
  dismissBanner: () => void;
  updatePreferences: (newPrefs: Partial<NotificationPreferencesType>) => Promise<void>;
  refreshHistory: () => Promise<void>;
  markAllAsRead: () => void;
  sendTestPush: (category?: string, title?: string, body?: string) => Promise<void>;
  triggerRealtimeEvent: (eventType: string, params?: Record<string, any>) => Promise<void>;
}

const defaultPreferences: NotificationPreferencesType = {
  orderUpdates: true,
  paymentUpdates: true,
  shippingAndDelivery: true,
  wishlistPriceDrops: true,
  backInStock: true,
  promotions: true,
  abandonedCart: true,
};

const NotificationContext = createContext<NotificationContextType>({
  expoPushToken: null,
  permissionGranted: false,
  notificationHistory: [],
  unreadCount: 0,
  activeBanner: null,
  preferences: defaultPreferences,
  isLoadingHistory: false,
  dismissBanner: () => {},
  updatePreferences: async () => {},
  refreshHistory: async () => {},
  markAllAsRead: () => {},
  sendTestPush: async () => {},
  triggerRealtimeEvent: async () => {},
});

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeBanner, setActiveBanner] = useState<NotificationItem | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferencesType>(defaultPreferences);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const bannerTimeoutRef = useRef<NodeJS.Timeout>();

  const showBanner = useCallback((item: NotificationItem) => {
    if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
    setActiveBanner(item);
    bannerTimeoutRef.current = setTimeout(() => {
      setActiveBanner(null);
    }, 5000);
  }, []);

  const dismissBanner = useCallback(() => {
    if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
    setActiveBanner(null);
  }, []);

  // 1. Register for push notifications
  const registerForPushNotificationsAsync = useCallback(async () => {
    let token = null;

    if (Platform.OS === "web") {
      // In web, create a mock token to allow in-app notifications
      token = "ExponentPushToken[web-client-token-" + (user?._id || "guest") + "]";
      setExpoPushToken(token);
      setPermissionGranted(true);
      return token;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        setPermissionGranted(false);
        return null;
      }

      setPermissionGranted(true);
      const pushTokenData = await Notifications.getExpoPushTokenAsync();
      token = pushTokenData.data;
      setExpoPushToken(token);
    } catch (err) {
      console.warn("Could not retrieve native push token:", err);
      token = "ExponentPushToken[local-simulated-" + (user?._id || "device") + "]";
      setExpoPushToken(token);
      setPermissionGranted(true);
    }

    return token;
  }, [user]);

  // 2. Sync push token with backend when user or token changes
  useEffect(() => {
    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (token && user?._id) {
        try {
          await api.post("/notification/register-token", {
            userId: user._id,
            token,
            platform: Platform.OS,
            deviceModel: Platform.OS === "web" ? "Web Browser" : "Mobile Device",
          });
        } catch (err) {
          console.warn("Failed to register token with backend:", err);
        }
      }
    })();
  }, [user?._id, registerForPushNotificationsAsync]);

  // 3. Fetch notification preferences
  const fetchPreferences = useCallback(async () => {
    if (!user?._id) return;
    try {
      const res = await api.get(`/notification/preferences/${user._id}`);
      if (res.data?.preferences) {
        const { _id, userId, createdAt, updatedAt, __v, ...purePrefs } = res.data.preferences;
        setPreferences({ ...defaultPreferences, ...purePrefs });
      }
    } catch (err) {
      console.warn("Failed to fetch notification preferences:", err);
    }
  }, [user?._id]);

  // 4. Fetch notification history
  const refreshHistory = useCallback(async () => {
    if (!user?._id) return;
    try {
      setIsLoadingHistory(true);
      const res = await api.get(`/notification/history/${user._id}`);
      if (res.data?.history) {
        setNotificationHistory(res.data.history);
      }
    } catch (err) {
      console.warn("Failed to fetch notification history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user?._id]);

  useEffect(() => {
    if (user?._id) {
      fetchPreferences();
      refreshHistory();
    }
  }, [user?._id, fetchPreferences, refreshHistory]);

  // 5. Setup foreground & background notification listeners
  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      const content = notification.request.content;
      const data = content.data || {};
      const newItem: NotificationItem = {
        id: notification.request.identifier,
        category: (data.category as any) || "system_alert",
        title: content.title || "Notification",
        body: content.body || "",
        data,
        status: "delivered",
        createdAt: new Date().toISOString(),
        isRead: false,
      };

      setNotificationHistory((prev) => [newItem, ...prev]);
      setUnreadCount((c) => c + 1);
      showBanner(newItem);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data || {};
      if (data.route) {
        router.push(data.route as any);
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [router, showBanner]);

  // 6. Update notification preferences
  const updatePreferences = async (newPrefs: Partial<NotificationPreferencesType>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    if (user?._id) {
      try {
        await api.put(`/notification/preferences/${user._id}`, updated);
      } catch (err) {
        console.warn("Failed to update preferences on server:", err);
      }
    }
  };

  // 7. Mark all notifications as read
  const markAllAsRead = () => {
    setUnreadCount(0);
    setNotificationHistory((prev) => prev.map((item) => ({ ...item, isRead: true })));
  };

  // 8. Send test push notification
  const sendTestPush = async (category = "promotional", title?: string, body?: string) => {
    try {
      const res = await api.post("/notification/send-test", {
        userId: user?._id || undefined,
        category,
        title: title || "🔔 Real-Time Push Notification",
        body: body || "Your real-time notification engine is active with live delivery tracking.",
        data: { route: "/notifications", type: "test" },
      });

      // Show in-app banner for instant visual confirmation
      const item: NotificationItem = {
        id: "local-" + Date.now(),
        category: category as any,
        title: title || "🔔 Real-Time Push Notification",
        body: body || "Your real-time notification engine is active with live delivery tracking.",
        status: "delivered",
        createdAt: new Date().toISOString(),
      };
      setNotificationHistory((prev) => [item, ...prev]);
      showBanner(item);
      refreshHistory();
    } catch (err) {
      console.warn("Failed to send test push:", err);
    }
  };

  // 9. Trigger real-time simulated events (Order, Shipping, Price Drop, etc.)
  const triggerRealtimeEvent = async (eventType: string, params: Record<string, any> = {}) => {
    try {
      await api.post("/notification/trigger-event", {
        userId: user?._id || undefined,
        eventType,
        ...params,
      });
      await refreshHistory();
    } catch (err) {
      console.warn("Failed to trigger event:", err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        permissionGranted,
        notificationHistory,
        unreadCount,
        activeBanner,
        preferences,
        isLoadingHistory,
        dismissBanner,
        updatePreferences,
        refreshHistory,
        markAllAsRead,
        sendTestPush,
        triggerRealtimeEvent,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
