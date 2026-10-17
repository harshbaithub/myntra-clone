import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Package,
  CreditCard,
  Truck,
  CheckCircle2,
  Heart,
  Sparkles,
  ShoppingBag,
  Bell,
  X,
  ChevronRight,
} from "lucide-react-native";
import { useNotifications, NotificationItem } from "@/context/NotificationContext";
import { useTheme } from "@/context/ThemeContext";

export default function NotificationBanner() {
  const router = useRouter();
  const { activeBanner, dismissBanner } = useNotifications();
  const { colors } = useTheme();

  if (!activeBanner) return null;

  const getCategoryDetails = (category?: string) => {
    switch (category) {
      case "order_confirmation":
        return {
          icon: <Package size={20} color="#fff" />,
          bgColor: colors.primary,
          label: "Order Confirmed",
        };
      case "payment_update":
        return {
          icon: <CreditCard size={20} color="#fff" />,
          bgColor: colors.success,
          label: "Payment Success",
        };
      case "shipping_update":
        return {
          icon: <Truck size={20} color="#fff" />,
          bgColor: colors.info,
          label: "Shipped",
        };
      case "delivery_status":
        return {
          icon: <CheckCircle2 size={20} color="#fff" />,
          bgColor: colors.success,
          label: "Delivered",
        };
      case "price_drop":
        return {
          icon: <Heart size={20} color="#fff" />,
          bgColor: "#f43f5e",
          label: "Price Drop Alert",
        };
      case "back_in_stock":
        return {
          icon: <Sparkles size={20} color="#fff" />,
          bgColor: "#10b981",
          label: "Back in Stock",
        };
      case "abandoned_cart":
        return {
          icon: <ShoppingBag size={20} color="#fff" />,
          bgColor: "#ff9800",
          label: "Bag Reminder",
        };
      case "promotional":
      default:
        return {
          icon: <Bell size={20} color="#fff" />,
          bgColor: colors.primary,
          label: "Special Offer",
        };
    }
  };

  const details = getCategoryDetails(activeBanner.category);

  const handlePress = () => {
    const route = activeBanner.data?.route || "/notifications";
    dismissBanner();
    router.push(route as any);
  };

  return (
    <View style={styles.bannerWrapper} pointerEvents="box-none">
      <TouchableOpacity
        style={[
          styles.bannerCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.divider,
            shadowColor: colors.shadowColor,
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <View style={[styles.iconContainer, { backgroundColor: details.bgColor }]}>
          {details.icon}
        </View>

        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.categoryBadge, { color: details.bgColor }]}>
              {details.label.toUpperCase()}
            </Text>
            <Text style={[styles.timeText, { color: colors.sub }]}>Just now</Text>
          </View>
          <Text style={[styles.title, { color: colors.title }]} numberOfLines={1}>
            {activeBanner.title}
          </Text>
          <Text style={[styles.body, { color: colors.sub }]} numberOfLines={2}>
            {activeBanner.body}
          </Text>
        </View>

        <TouchableOpacity style={styles.closeBtn} onPress={dismissBanner}>
          <X size={16} color={colors.sub} />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerWrapper: {
    position: "absolute",
    top: Platform.OS === "web" ? 20 : 50,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  bannerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  categoryBadge: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  timeText: {
    fontSize: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  body: {
    fontSize: 12,
    lineHeight: 16,
  },
  closeBtn: {
    padding: 6,
    marginLeft: 6,
  },
});
