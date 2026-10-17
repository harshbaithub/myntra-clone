import React from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Trash2, ShoppingBag, Heart, X } from "lucide-react-native";
import { useActivity, ActivityProduct } from "@/context/ActivityContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export default function RecentlyViewedScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const {
    recentlyViewed,
    clearHistory,
    removeRecentlyViewed,
    quickAddToBag,
    quickToggleWishlist,
    wishlistIds,
    isLoadingActivity,
  } = useActivity();

  const [feedback, setFeedback] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleAddBag = async (item: ActivityProduct) => {
    const res = await quickAddToBag(item);
    showToast(res.message);
  };

  const handleWishlist = async (productId: string) => {
    if (!user) {
      showToast("Please login to save items to wishlist");
      return;
    }
    const res = await quickToggleWishlist(productId);
    showToast(res.inWishlist ? "Added to Wishlist ❤️" : "Removed from Wishlist");
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.title} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.title }]}>Recently Viewed</Text>
          <Text style={[styles.headerSubtitle, { color: colors.sub }]}>
            {recentlyViewed.length} items (Max 20 unique)
          </Text>
        </View>
        {recentlyViewed.length > 0 && (
          <TouchableOpacity
            style={[styles.clearBtn, { backgroundColor: colors.surface }]}
            onPress={clearHistory}
          >
            <Trash2 size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {feedback && (
        <View style={[styles.toast, { backgroundColor: colors.card, borderColor: colors.primary }]}>
          <Text style={[styles.toastText, { color: colors.title }]}>{feedback}</Text>
        </View>
      )}

      {isLoadingActivity ? (
        <View style={[styles.centerContainer, { backgroundColor: colors.bg }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : recentlyViewed.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: colors.title }]}>No Recently Viewed Products</Text>
          <Text style={[styles.emptySubtitle, { color: colors.sub }]}>
            Browse our catalog and products you view will appear here.
          </Text>
          <TouchableOpacity
            style={[styles.exploreButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(tabs)/categories")}
          >
            <Text style={styles.exploreButtonText}>EXPLORE CATALOG</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={styles.grid}>
            {recentlyViewed.map((item) => {
              const isWishlisted = wishlistIds.includes(item._id?.toString());
              return (
                <View
                  key={item._id}
                  style={[
                    styles.card,
                    { backgroundColor: colors.card, borderColor: colors.divider },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => router.push(`/product/${item._id}`)}
                    activeOpacity={0.9}
                  >
                    <Image
                      source={{
                        uri:
                          item.images?.[0] ||
                          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
                      }}
                      style={[styles.image, { backgroundColor: colors.surface }]}
                    />
                    <TouchableOpacity
                      style={[styles.removeBtn, { backgroundColor: colors.card }]}
                      onPress={() => removeRecentlyViewed(item._id)}
                    >
                      <X size={14} color={colors.sub} />
                    </TouchableOpacity>
                  </TouchableOpacity>

                  <View style={styles.cardInfo}>
                    <Text style={[styles.brand, { color: colors.sub }]} numberOfLines={1}>
                      {item.brand}
                    </Text>
                    <Text style={[styles.name, { color: colors.title }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={styles.priceRow}>
                      <Text style={[styles.price, { color: colors.title }]}>₹{item.price}</Text>
                      <Text style={[styles.discount, { color: colors.primary }]}>{item.discount}</Text>
                    </View>

                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={[styles.bagButton, { backgroundColor: colors.primary }]}
                        onPress={() => handleAddBag(item)}
                      >
                        <ShoppingBag size={12} color="#fff" />
                        <Text style={styles.bagText}>Add</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.wishlistBtn,
                          {
                            backgroundColor: isWishlisted ? colors.primaryLight : colors.surface,
                            borderColor: isWishlisted ? colors.primary : colors.divider,
                          },
                        ]}
                        onPress={() => handleWishlist(item._id)}
                      >
                        <Heart
                          size={14}
                          color={isWishlisted ? colors.primary : colors.sub}
                          fill={isWishlisted ? colors.primary : "none"}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
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
  backButton: {
    marginRight: 12,
  },
  headerTitleContainer: {
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
  clearBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  toast: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  toastText: {
    fontSize: 13,
    fontWeight: "600",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 18,
  },
  exploreButton: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
  },
  exploreButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 180,
  },
  removeBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  cardInfo: {
    padding: 10,
  },
  brand: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 2,
  },
  name: {
    fontSize: 13,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
  },
  discount: {
    fontSize: 12,
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bagButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  bagText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  wishlistBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
