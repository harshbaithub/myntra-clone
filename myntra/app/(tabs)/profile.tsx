import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import {
  User,
  Package,
  Heart,
  CreditCard,
  MapPin,
  Settings,
  LogOut,
  ChevronRight,
  Clock,
  Palette,
  Bell,
  ArrowLeft,
} from "lucide-react-native";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useActivity } from "@/context/ActivityContext";
import { useTheme } from "@/context/ThemeContext";
import { useNotifications } from "@/context/NotificationContext";
import ThemeSelector from "@/components/ThemeSelector";
import DesktopNavbar from "@/components/DesktopNavbar";

const menuItems = [
  { icon: Bell, label: "Notification Center", route: "/notifications", badgeKey: "notifications" },
  { icon: Clock, label: "Recently Viewed", route: "/recently-viewed", badgeKey: "recent" },
  { icon: Package, label: "Orders & Transactions", route: "/orders" },
  { icon: Heart, label: "Wishlist", route: "/wishlist" },
  { icon: MapPin, label: "Addresses", route: "/addresses" },
  { icon: Settings, label: "Settings", route: "/settings" },
];

export default function Profile() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { user, logout } = useAuth();
  const { recentlyViewed } = useActivity();
  const { unreadCount } = useNotifications();
  const { colors, theme, themeMode } = useTheme();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push("/(tabs)");
    }
  };

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {isDesktop && <DesktopNavbar />}
        {isDesktop ? (
          <View style={styles.desktopTopBackContainer}>
            <TouchableOpacity style={styles.desktopBackRow} onPress={handleBack} activeOpacity={0.7}>
              <ArrowLeft size={18} color={colors.sub} />
              <Text style={[styles.desktopBackText, { color: colors.sub }]}>Back to Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View
            style={[
              styles.header,
              { backgroundColor: colors.header, borderBottomColor: colors.headerBorder },
            ]}
          >
            <TouchableOpacity style={styles.backButton} onPress={handleBack} accessibilityLabel="Back">
              <ArrowLeft size={22} color={colors.title} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.title }]}>Profile</Text>
          </View>
        )}
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconCircle, { backgroundColor: colors.primaryLight }]}>
            <User size={56} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.title }]}>
            Please login to view your profile
          </Text>
          <Text style={[styles.emptySub, { color: colors.sub }]}>
            Sync your wishlist, order history, and personal theme across devices.
          </Text>
          <View style={styles.emptyButtonRow}>
            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/login")}
            >
              <Text style={styles.loginButtonText}>LOGIN / SIGN UP</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.continueButton, { borderColor: colors.border }]}
              onPress={handleBack}
            >
              <Text style={[styles.continueButtonText, { color: colors.title }]}>CONTINUE SHOPPING</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {isDesktop ? (
        <DesktopNavbar />
      ) : (
        <View
          style={[
            styles.header,
            { backgroundColor: colors.header, borderBottomColor: colors.headerBorder },
          ]}
        >
          <TouchableOpacity style={styles.backButton} onPress={handleBack} accessibilityLabel="Back">
            <ArrowLeft size={22} color={colors.title} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.title, flex: 1 }]}>Profile</Text>
        </View>
      )}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ maxWidth: 800, width: "100%", alignSelf: "center", paddingBottom: 60 }}
      >
        {isDesktop && (
          <View style={styles.desktopHeaderArea}>
            <TouchableOpacity style={styles.desktopBackRow} onPress={handleBack} activeOpacity={0.7}>
              <ArrowLeft size={18} color={colors.sub} />
              <Text style={[styles.desktopBackText, { color: colors.sub }]}>Back to Shopping</Text>
            </TouchableOpacity>
            <Text style={[styles.desktopTitle, { color: colors.title }]}>My Profile</Text>
          </View>
        )}
        {/* User Card */}
        <View
          style={[
            styles.userInfo,
            {
              backgroundColor: colors.card,
              borderColor: colors.divider,
            },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: colors.title }]}>{user.name}</Text>
            <Text style={[styles.userEmail, { color: colors.sub }]}>{user.email}</Text>
            <View style={[styles.themePill, { backgroundColor: colors.surface }]}>
              <Palette size={12} color={colors.primary} />
              <Text style={[styles.themePillText, { color: colors.primary }]}>
                Theme: {themeMode === "system" ? "System Auto" : theme.name}
              </Text>
            </View>
          </View>
        </View>

        {/* Theme & Personalization Section */}
        <ThemeSelector compact={false} />

        {/* Menu Section */}
        <View
          style={[
            styles.menuSection,
            { backgroundColor: colors.card, borderColor: colors.divider },
          ]}
        >
          {menuItems.map((item, index) => {
            const isLast = index === menuItems.length - 1;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuItem,
                  {
                    borderBottomColor: colors.divider,
                    borderBottomWidth: isLast ? 0 : 1,
                  },
                ]}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <View
                    style={[
                      styles.iconWrap,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    <item.icon size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.menuItemLabel, { color: colors.title }]}>
                    {item.label}
                  </Text>
                </View>
                <View style={styles.menuItemRight}>
                  {item.badgeKey === "notifications" && unreadCount > 0 && (
                    <View style={[styles.badge, { backgroundColor: colors.badge }]}>
                      <Text style={[styles.badgeText, { color: colors.badgeText }]}>
                        {unreadCount}
                      </Text>
                    </View>
                  )}
                  {item.badgeKey === "recent" && recentlyViewed.length > 0 && (
                    <View style={[styles.badge, { backgroundColor: colors.badge }]}>
                      <Text style={[styles.badgeText, { color: colors.badgeText }]}>
                        {recentlyViewed.length}
                      </Text>
                    </View>
                  )}
                  <ChevronRight size={20} color={colors.arrow} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[
            styles.logoutButton,
            {
              backgroundColor: colors.card,
              borderColor: colors.primary,
            },
          ]}
          onPress={handleLogout}
        >
          <LogOut size={20} color={colors.primary} />
          <Text style={[styles.logoutText, { color: colors.primary }]}>Logout</Text>
        </TouchableOpacity>

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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "web" ? 16 : 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 6,
    marginRight: 10,
    borderRadius: 8,
  },
  desktopTopBackContainer: {
    maxWidth: 800,
    width: "100%",
    alignSelf: "center",
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  desktopBackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  desktopBackText: {
    fontSize: 14,
    fontWeight: "600",
  },
  desktopHeaderArea: {
    marginBottom: 16,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  desktopTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  emptyButtonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  continueButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  loginButton: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 6,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  userDetails: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    marginBottom: 6,
  },
  themePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 5,
  },
  themePillText: {
    fontSize: 11,
    fontWeight: "600",
  },
  menuSection: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  menuItemLabel: {
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    marginTop: 20,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
