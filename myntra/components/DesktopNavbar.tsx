import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from "react-native";
import { useRouter, usePathname } from "expo-router";
import {
  Search,
  Heart,
  ShoppingBag,
  User,
  Bell,
  X,
  Compass,
} from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useNotifications } from "@/context/NotificationContext";
import { useActivity } from "@/context/ActivityContext";

interface Props {
  onSearch?: (query: string) => void;
}

export default function DesktopNavbar({ onSearch }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const { wishlistIds } = useActivity();
  const [searchQuery, setSearchQuery] = useState("");

  // Only render on tablet and desktop screens
  if (width < 768) {
    return null;
  }

  const handleSearchSubmit = () => {
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      router.push({
        pathname: "/(tabs)/categories",
        params: { q: searchQuery },
      });
    }
  };

  const navCategories = [
    { label: "MEN", category: "Men" },
    { label: "WOMEN", category: "Women" },
    { label: "KIDS", category: "Kids" },
    { label: "BEAUTY", category: "Beauty" },
    { label: "EXPLORE", category: "all" },
  ];

  return (
    <View
      style={[
        styles.navbarWrapper,
        {
          backgroundColor: colors.header,
          borderBottomColor: colors.headerBorder,
        },
      ]}
    >
      <View style={styles.navbarInner}>
        {/* Brand Logo */}
        <TouchableOpacity
          style={styles.logoButton}
          onPress={() => router.push("/(tabs)")}
          activeOpacity={0.8}
        >
          <Text style={[styles.logoText, { color: colors.title }]}>
            MYNTRA<Text style={{ color: colors.primary }}>.</Text>
          </Text>
        </TouchableOpacity>

        {/* Category Navigation Links */}
        <View style={styles.categoryNav}>
          {navCategories.map((item, index) => {
            const isActive =
              pathname === "/(tabs)/categories" || pathname === "/categories";
            return (
              <TouchableOpacity
                key={index}
                style={styles.navItem}
                onPress={() => router.push("/(tabs)/categories")}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.navItemText,
                    { color: colors.title },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Desktop Search Bar */}
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: colors.surface, borderColor: colors.divider },
          ]}
        >
          <Search size={18} color={colors.sub} style={styles.searchIcon} />
          <TextInput
            placeholder="Search for products, brands and more"
            placeholderTextColor={colors.sub}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            style={[styles.searchInput, { color: colors.text }]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={16} color={colors.sub} />
            </TouchableOpacity>
          )}
        </View>

        {/* Right Action Icons (Profile, Wishlist, Bag, Notifications) */}
        <View style={styles.actionButtonsGroup}>
          {/* Profile */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push(user ? "/profile" : "/login")}
            activeOpacity={0.7}
          >
            <User size={20} color={colors.title} />
            <Text style={[styles.actionLabel, { color: colors.title }]}>
              {user ? (user.name ? user.name.split(" ")[0] : "Profile") : "Login"}
            </Text>
          </TouchableOpacity>

          {/* Wishlist */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push("/wishlist")}
            activeOpacity={0.7}
          >
            <View style={styles.iconWithBadge}>
              <Heart size={20} color={colors.title} />
              {wishlistIds.length > 0 && (
                <View
                  style={[styles.badge, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.badgeText}>
                    {wishlistIds.length > 9 ? "9+" : wishlistIds.length}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.actionLabel, { color: colors.title }]}>
              Wishlist
            </Text>
          </TouchableOpacity>

          {/* Bag */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push("/bag")}
            activeOpacity={0.7}
          >
            <ShoppingBag size={20} color={colors.title} />
            <Text style={[styles.actionLabel, { color: colors.title }]}>Bag</Text>
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push("/notifications")}
            activeOpacity={0.7}
          >
            <View style={styles.iconWithBadge}>
              <Bell size={20} color={colors.title} />
              {unreadCount > 0 && (
                <View
                  style={[styles.badge, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.actionLabel, { color: colors.title }]}>
              Alerts
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navbarWrapper: {
    width: "100%",
    borderBottomWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 12,
    zIndex: 100,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  navbarInner: {
    maxWidth: 1280,
    width: "100%",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
  },
  logoButton: {
    paddingRight: 10,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  categoryNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  navItem: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  navItemText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  searchContainer: {
    flex: 1,
    maxWidth: 440,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
    outlineWidth: 0,
  } as any,
  actionButtonsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  actionBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
  iconWithBadge: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },
});
