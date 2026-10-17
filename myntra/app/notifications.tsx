import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Bell,
  Package,
  CreditCard,
  Truck,
  CheckCircle2,
  Heart,
  Sparkles,
  ShoppingBag,
  CheckCheck,
  Send,
  Sliders,
} from "lucide-react-native";
import { useNotifications, NotificationItem } from "@/context/NotificationContext";
import { useTheme } from "@/context/ThemeContext";

const filterTabs = [
  { id: "all", label: "All" },
  { id: "orders", label: "Orders" },
  { id: "shipping", label: "Shipping" },
  { id: "price_drop", label: "Price Drops" },
  { id: "promos", label: "Offers" },
  { id: "cart", label: "Cart" },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    notificationHistory,
    isLoadingHistory,
    refreshHistory,
    markAllAsRead,
    sendTestPush,
  } = useNotifications();

  const [selectedFilter, setSelectedFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshHistory();
    setRefreshing(false);
  };

  const getFilteredList = () => {
    if (selectedFilter === "all") return notificationHistory;
    if (selectedFilter === "orders") {
      return notificationHistory.filter(
        (i) => i.category === "order_confirmation" || i.category === "payment_update"
      );
    }
    if (selectedFilter === "shipping") {
      return notificationHistory.filter(
        (i) => i.category === "shipping_update" || i.category === "delivery_status"
      );
    }
    if (selectedFilter === "price_drop") {
      return notificationHistory.filter(
        (i) => i.category === "price_drop" || i.category === "back_in_stock"
      );
    }
    if (selectedFilter === "promos") {
      return notificationHistory.filter((i) => i.category === "promotional");
    }
    if (selectedFilter === "cart") {
      return notificationHistory.filter((i) => i.category === "abandoned_cart");
    }
    return notificationHistory;
  };

  const filteredItems = getFilteredList();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "order_confirmation":
        return <Package size={18} color={colors.primary} />;
      case "payment_update":
        return <CreditCard size={18} color={colors.success} />;
      case "shipping_update":
        return <Truck size={18} color={colors.info} />;
      case "delivery_status":
        return <CheckCircle2 size={18} color={colors.success} />;
      case "price_drop":
        return <Heart size={18} color="#f43f5e" />;
      case "back_in_stock":
        return <Sparkles size={18} color="#10b981" />;
      case "abandoned_cart":
        return <ShoppingBag size={18} color="#ff9800" />;
      case "promotional":
      default:
        return <Bell size={18} color={colors.primary} />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "delivered":
        return { label: "Delivered", bg: "rgba(3, 166, 133, 0.15)", text: colors.success };
      case "pending":
        return { label: "Pending", bg: "rgba(255, 152, 0, 0.15)", text: colors.warning };
      case "invalid_token":
        return { label: "Cleaned Up", bg: "rgba(229, 57, 53, 0.15)", text: colors.error };
      case "skipped_by_user_preference":
        return { label: "Muted", bg: colors.surface, text: colors.sub };
      case "failed":
        return { label: "Failed", bg: "rgba(229, 57, 53, 0.15)", text: colors.error };
      default:
        return { label: "Sent", bg: colors.primaryLight, text: colors.primary };
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "Just now";
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + ", " + date.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
      return "Recent";
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.header, borderBottomColor: colors.headerBorder },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.title} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.title }]}>Notification Center</Text>
          <Text style={[styles.headerSubtitle, { color: colors.sub }]}>
            Real-time delivery & tracking log
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.headerActionBtn, { backgroundColor: colors.surface }]}
          onPress={() => router.push("/settings")}
        >
          <Sliders size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.tabsWrap, { borderBottomColor: colors.divider }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {filterTabs.map((tab) => {
            const isActive = selectedFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tabChip,
                  {
                    backgroundColor: isActive ? colors.primary : colors.surface,
                    borderColor: isActive ? colors.primary : colors.divider,
                  },
                ]}
                onPress={() => setSelectedFilter(tab.id)}
              >
                <Text
                  style={[
                    styles.tabChipText,
                    {
                      color: isActive ? "#fff" : colors.title,
                      fontWeight: isActive ? "700" : "500",
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Notifications List */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {isLoadingHistory && !refreshing ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconCircle, { backgroundColor: colors.surface }]}>
              <Bell size={48} color={colors.sub} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.title }]}>No Notifications</Text>
            <Text style={[styles.emptySub, { color: colors.sub }]}>
              You're all caught up! Order updates, delivery tracking, and price drop alerts will appear here.
            </Text>
            <TouchableOpacity
              style={[styles.testPushBtn, { backgroundColor: colors.primary }]}
              onPress={() => sendTestPush()}
            >
              <Send size={16} color="#fff" />
              <Text style={styles.testPushBtnText}>Send Sample Notification</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listContainer}>
            <View style={styles.listHeaderRow}>
              <Text style={[styles.listHeaderCount, { color: colors.sub }]}>
                {filteredItems.length} {filteredItems.length === 1 ? "notification" : "notifications"}
              </Text>
              <TouchableOpacity onPress={markAllAsRead} style={styles.markReadBtn}>
                <CheckCheck size={16} color={colors.primary} />
                <Text style={[styles.markReadText, { color: colors.primary }]}>Mark all read</Text>
              </TouchableOpacity>
            </View>

            {filteredItems.map((item, index) => {
              const badge = getStatusBadge(item.status);
              return (
                <TouchableOpacity
                  key={item._id || item.id || index}
                  style={[
                    styles.notificationCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.divider,
                    },
                  ]}
                  onPress={() => {
                    if (item.data?.route) {
                      router.push(item.data.route as any);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardCategoryRow}>
                      <View style={[styles.iconCircle, { backgroundColor: colors.surface }]}>
                        {getCategoryIcon(item.category)}
                      </View>
                      <Text style={[styles.cardTime, { color: colors.sub }]}>
                        {formatTime(item.createdAt || item.sentAt)}
                      </Text>
                    </View>
                    <View style={[styles.statusTag, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.statusTagText, { color: badge.text }]}>
                        {badge.label}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.cardTitle, { color: colors.title }]}>{item.title}</Text>
                  <Text style={[styles.cardBody, { color: colors.sub }]}>{item.body}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    marginRight: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  tabsWrap: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabChipText: {
    fontSize: 13,
  },
  content: {
    flex: 1,
  },
  loaderBox: {
    paddingTop: 60,
    alignItems: "center",
  },
  emptyState: {
    padding: 30,
    alignItems: "center",
    marginTop: 40,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  testPushBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  testPushBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  listContainer: {
    padding: 16,
  },
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  listHeaderCount: {
    fontSize: 12,
    fontWeight: "600",
  },
  markReadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  markReadText: {
    fontSize: 12,
    fontWeight: "600",
  },
  notificationCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTime: {
    fontSize: 11,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: "700",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 18,
  },
});
