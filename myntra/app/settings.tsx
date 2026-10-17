import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Bell,
  Shield,
  HelpCircle,
  Info,
  Trash2,
  LogOut,
  Palette,
  Package,
  CreditCard,
  Truck,
  Heart,
  Sparkles,
  ShoppingBag,
  Send,
  Zap,
} from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useNotifications } from "@/context/NotificationContext";
import ThemeSelector from "@/components/ThemeSelector";

export default function Settings() {
  const router = useRouter();
  const { logout } = useAuth();
  const { colors } = useTheme();
  const {
    preferences,
    updatePreferences,
    sendTestPush,
    triggerRealtimeEvent,
    unreadCount,
  } = useNotifications();

  const [masterPush, setMasterPush] = useState(true);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/");
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action is permanent and cannot be undone. All your data will be erased.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => Alert.alert("Account Deleted"),
        },
      ]
    );
  };

  const Section = ({ title, icon }: { title: string; icon?: React.ReactNode }) => (
    <View style={styles.sectionHeaderRow}>
      {icon}
      <Text style={[styles.sectionTitle, { color: colors.sub }]}>{title}</Text>
    </View>
  );

  const ToggleItem = ({
    icon,
    label,
    sublabel,
    value,
    onToggle,
    labelColor,
  }: {
    icon: React.ReactNode;
    label: string;
    sublabel?: string;
    value: boolean;
    onToggle: (v: boolean) => void;
    labelColor?: string;
  }) => (
    <View style={[styles.row, { backgroundColor: colors.card }]}>
      <View style={styles.rowLeft}>
        {icon}
        <View style={{ marginLeft: 14, flex: 1 }}>
          <Text style={[styles.rowLabel, { color: labelColor ?? colors.title }]}>{label}</Text>
          {sublabel && <Text style={[styles.rowSub, { color: colors.sub }]}>{sublabel}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.inputBorder, true: colors.primary }}
        thumbColor="#ffffff"
      />
    </View>
  );

  const LinkItem = ({
    icon,
    label,
    sublabel,
    onPress,
    labelColor,
    badge,
  }: {
    icon: React.ReactNode;
    label: string;
    sublabel?: string;
    onPress: () => void;
    labelColor?: string;
    badge?: string | number;
  }) => (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.rowLeft}>
        {icon}
        <View style={{ marginLeft: 14, flex: 1 }}>
          <Text style={[styles.rowLabel, { color: labelColor ?? colors.title }]}>{label}</Text>
          {sublabel && <Text style={[styles.rowSub, { color: colors.sub }]}>{sublabel}</Text>}
        </View>
      </View>
      {badge ? (
        <View style={[styles.badgePill, { backgroundColor: colors.primary }]}>
          <Text style={styles.badgePillText}>{badge}</Text>
        </View>
      ) : null}
      <Text style={[styles.arrow, { color: colors.arrow }]}>›</Text>
    </TouchableOpacity>
  );

  const Divider = () => (
    <View style={[styles.divider, { backgroundColor: colors.divider }]} />
  );

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
        <Text style={[styles.headerTitle, { color: colors.title }]}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Dynamic Theme & Personalization System */}
        <Section title="DYNAMIC THEME & PERSONALIZATION" icon={<Palette size={16} color={colors.primary} />} />
        <ThemeSelector />

        {/* Real-Time Push Notification Categories */}
        <Section title="PUSH NOTIFICATION CATEGORIES" icon={<Bell size={16} color={colors.primary} />} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.divider }]}>
          <LinkItem
            icon={<Bell size={22} color={colors.primary} />}
            label="Notification Center & History"
            sublabel="View real-time delivery logs & tracking status"
            onPress={() => router.push("/notifications")}
            badge={unreadCount > 0 ? unreadCount : undefined}
          />
          <Divider />
          <ToggleItem
            icon={<Package size={22} color={colors.primary} />}
            label="Order Confirmations"
            sublabel="Instant alerts when your order is placed"
            value={preferences.orderUpdates}
            onToggle={(val) => updatePreferences({ orderUpdates: val })}
          />
          <Divider />
          <ToggleItem
            icon={<CreditCard size={22} color={colors.success} />}
            label="Payment Updates"
            sublabel="Receipts & transaction confirmations"
            value={preferences.paymentUpdates}
            onToggle={(val) => updatePreferences({ paymentUpdates: val })}
          />
          <Divider />
          <ToggleItem
            icon={<Truck size={22} color={colors.info} />}
            label="Shipping & Delivery"
            sublabel="Dispatch, carrier tracking & delivery status"
            value={preferences.shippingAndDelivery}
            onToggle={(val) => updatePreferences({ shippingAndDelivery: val })}
          />
          <Divider />
          <ToggleItem
            icon={<Heart size={22} color="#f43f5e" />}
            label="Wishlist Price Drops"
            sublabel="Real-time discount alerts on saved items"
            value={preferences.wishlistPriceDrops}
            onToggle={(val) => updatePreferences({ wishlistPriceDrops: val })}
          />
          <Divider />
          <ToggleItem
            icon={<Sparkles size={22} color="#10b981" />}
            label="Back in Stock Alerts"
            sublabel="Restock alerts for out-of-stock styles"
            value={preferences.backInStock}
            onToggle={(val) => updatePreferences({ backInStock: val })}
          />
          <Divider />
          <ToggleItem
            icon={<Bell size={22} color={colors.warning} />}
            label="Promotional Campaigns"
            sublabel="Flash sales, coupons & tailored offers"
            value={preferences.promotions}
            onToggle={(val) => updatePreferences({ promotions: val })}
          />
          <Divider />
          <ToggleItem
            icon={<ShoppingBag size={22} color="#ff9800" />}
            label="Abandoned Cart Reminders"
            sublabel="Gentle alerts when items are left in bag"
            value={preferences.abandonedCart}
            onToggle={(val) => updatePreferences({ abandonedCart: val })}
          />
        </View>

        {/* Live Notification Event Simulator */}
        <Section title="TEST NOTIFICATION DISPATCHER" icon={<Zap size={16} color={colors.warning} />} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.divider, padding: 14 }]}>
          <Text style={[styles.testPanelTitle, { color: colors.title }]}>
            Simulate Real-Time Push Events
          </Text>
          <Text style={[styles.testPanelSub, { color: colors.sub }]}>
            Tap any event below to trigger real-time push notification dispatch and test backend logging.
          </Text>

          <View style={styles.testGrid}>
            <TouchableOpacity
              style={[styles.testBtn, { backgroundColor: colors.surface, borderColor: colors.divider }]}
              onPress={() => triggerRealtimeEvent("order_confirmation")}
            >
              <Package size={16} color={colors.primary} />
              <Text style={[styles.testBtnText, { color: colors.title }]}>Order Placed</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testBtn, { backgroundColor: colors.surface, borderColor: colors.divider }]}
              onPress={() => triggerRealtimeEvent("payment_update")}
            >
              <CreditCard size={16} color={colors.success} />
              <Text style={[styles.testBtnText, { color: colors.title }]}>Payment</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testBtn, { backgroundColor: colors.surface, borderColor: colors.divider }]}
              onPress={() => triggerRealtimeEvent("shipping_update")}
            >
              <Truck size={16} color={colors.info} />
              <Text style={[styles.testBtnText, { color: colors.title }]}>Shipped</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testBtn, { backgroundColor: colors.surface, borderColor: colors.divider }]}
              onPress={() => triggerRealtimeEvent("delivery_status")}
            >
              <Truck size={16} color={colors.success} />
              <Text style={[styles.testBtnText, { color: colors.title }]}>Delivered</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testBtn, { backgroundColor: colors.surface, borderColor: colors.divider }]}
              onPress={() => triggerRealtimeEvent("price_drop")}
            >
              <Heart size={16} color="#f43f5e" />
              <Text style={[styles.testBtnText, { color: colors.title }]}>Price Drop</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testBtn, { backgroundColor: colors.surface, borderColor: colors.divider }]}
              onPress={() => triggerRealtimeEvent("back_in_stock")}
            >
              <Sparkles size={16} color="#10b981" />
              <Text style={[styles.testBtnText, { color: colors.title }]}>Back in Stock</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testBtn, { backgroundColor: colors.surface, borderColor: colors.divider }]}
              onPress={() => triggerRealtimeEvent("promotional")}
            >
              <Bell size={16} color={colors.primary} />
              <Text style={[styles.testBtnText, { color: colors.title }]}>Flash Sale</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testBtn, { backgroundColor: colors.surface, borderColor: colors.divider }]}
              onPress={() => triggerRealtimeEvent("abandoned_cart")}
            >
              <ShoppingBag size={16} color="#ff9800" />
              <Text style={[styles.testBtnText, { color: colors.title }]}>Cart Reminder</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account & Policies */}
        <Section title="ACCOUNT & LEGAL" />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.divider }]}>
          <LinkItem
            icon={<Shield size={22} color={colors.info} />}
            label="Privacy Policy"
            onPress={() => Alert.alert("Privacy Policy", "Opens privacy policy page.")}
          />
          <Divider />
          <LinkItem
            icon={<HelpCircle size={22} color={colors.success} />}
            label="Help & Support"
            sublabel="FAQs, chat, customer care"
            onPress={() => Alert.alert("Support", "Opens support page.")}
          />
          <Divider />
          <LinkItem
            icon={<Info size={22} color={colors.sub} />}
            label="About Myntra"
            sublabel="Version 2.1.0 with Push Notifications"
            onPress={() => Alert.alert("About", "Myntra v2.1.0 with Push Engine")}
          />
        </View>

        {/* Account Management */}
        <Section title="ACCOUNT MANAGEMENT" />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.divider }]}>
          <LinkItem
            icon={<LogOut size={22} color={colors.primary} />}
            label="Logout"
            labelColor={colors.primary}
            onPress={handleLogout}
          />
          <Divider />
          <LinkItem
            icon={<Trash2 size={22} color={colors.error} />}
            label="Delete Account"
            sublabel="Permanently remove your account"
            labelColor={colors.error}
            onPress={handleDeleteAccount}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  card: {
    borderRadius: 14,
    marginHorizontal: 16,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: "500" },
  rowSub: { fontSize: 12, marginTop: 2 },
  arrow: { fontSize: 22, marginLeft: 8 },
  divider: { height: 1, marginHorizontal: 16 },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 4,
  },
  badgePillText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  testPanelTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  testPanelSub: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  testGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  testBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  testBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
