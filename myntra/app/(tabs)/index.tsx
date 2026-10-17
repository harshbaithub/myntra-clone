import {
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Search, ChevronRight, Heart, ShoppingBag, X, Bell } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useActivity, ActivityProduct } from "@/context/ActivityContext";
import { useTheme } from "@/context/ThemeContext";
import { useNotifications } from "@/context/NotificationContext";
import { api } from "@/utils/api";
import RecommendationCarousel from "@/components/RecommendationCarousel";

const deals = [
  {
    id: 1,
    title: "Under ₹599",
    image:
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "40-70% Off",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&auto=format&fit=crop",
  },
];

export default function Home() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const { unreadCount } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [product, setproduct] = useState<any>(null);
  const [categories, setcategories] = useState<any>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const { user } = useAuth();

  const isDesktop = width >= 768;
  const isLargeDesktop = width >= 1100;

  // Responsive Grid Calculations
  const containerWidth = Math.min(width, 1200) - 32;
  const numColumns = isLargeDesktop ? 4 : isDesktop ? 3 : 2;
  const cardGap = 16;
  const cardWidth = Math.floor((containerWidth - (numColumns - 1) * cardGap) / numColumns);
  const cardImageHeight = Math.round(cardWidth * 1.3);
  const {
    recentlyViewed,
    continueShopping,
    quickAddToBag,
    quickToggleWishlist,
    removeRecentlyViewed,
    clearHistory,
    wishlistIds,
  } = useActivity();

  const showToast = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3000);
  };

  const handleProductPress = (productId: string | number) => {
    router.push(`/product/${productId}`);
  };

  const handleQuickAdd = async (item: ActivityProduct) => {
    const res = await quickAddToBag(item);
    showToast(res.message);
  };

  const handleQuickWishlist = async (productId: string) => {
    if (!user) {
      showToast("Please login to save items to wishlist");
      return;
    }
    const res = await quickToggleWishlist(productId);
    showToast(res.inWishlist ? "Added to Wishlist ❤️" : "Removed from Wishlist");
  };

  useEffect(() => {
    const fetchproduct = async () => {
      try {
        setIsLoading(true);
        const [catRes, prodRes] = await Promise.all([
          api.get("/category"),
          api.get("/product"),
        ]);
        setcategories(catRes.data);
        setproduct(prodRes.data);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchproduct();
  }, []);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={{ paddingBottom: 60 }}>
      {/* Top Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.header, borderBottomColor: colors.headerBorder },
        ]}
      >
        <View style={styles.headerInner}>
          <Text style={[styles.logo, { color: colors.title }]}>MYNTRA</Text>
          <View style={styles.headerRightActions}>
            <TouchableOpacity
              style={[styles.searchButton, { backgroundColor: colors.surface }]}
              onPress={() => router.push("/(tabs)/categories")}
            >
              <Search size={20} color={colors.title} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.notificationButton, { backgroundColor: colors.surface }]}
              onPress={() => router.push("/notifications")}
            >
              <Bell size={20} color={colors.title} />
              {unreadCount > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.unreadBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Responsive Centered Container */}
      <View style={styles.mainContentWrapper}>
        {/* Floating feedback notification */}
        {feedbackMessage && (
          <View style={[styles.feedbackBanner, { backgroundColor: colors.card, borderColor: colors.primary }]}>
            <Text style={[styles.feedbackText, { color: colors.title }]}>{feedbackMessage}</Text>
          </View>
        )}

        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&auto=format&fit=crop",
          }}
          style={[
            styles.banner,
            {
              height: isDesktop ? 340 : 190,
              borderRadius: isDesktop ? 16 : 0,
              marginHorizontal: isDesktop ? 16 : 0,
              marginTop: isDesktop ? 16 : 0,
            },
          ]}
          resizeMode="cover"
        />

      {/* CONTINUE SHOPPING SECTION (Viewed but not purchased) */}
      {continueShopping && continueShopping.length > 0 && (
        <View
          style={[
            styles.continueShoppingSection,
            {
              backgroundColor: colors.surface,
              borderColor: colors.divider,
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.title }]}>CONTINUE SHOPPING</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.sub }]}>
                Pick up where you left off
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/categories")}
              style={styles.viewAll}
            >
              <Text style={[styles.viewAllText, { color: colors.primary }]}>Explore</Text>
              <ChevronRight size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScroll}
          >
            {continueShopping.map((item) => {
              const isWishlisted = wishlistIds.includes(item._id?.toString());
              return (
                <View
                  key={item._id}
                  style={[
                    styles.continueCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.divider,
                    },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => handleProductPress(item._id)}
                    activeOpacity={0.9}
                  >
                    <Image
                      source={{
                        uri:
                          item.images?.[0] ||
                          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
                      }}
                      style={[styles.continueImage, { backgroundColor: colors.surface }]}
                    />
                    <TouchableOpacity
                      style={[styles.dismissButton, { backgroundColor: colors.card }]}
                      onPress={() => removeRecentlyViewed(item._id)}
                    >
                      <X size={14} color={colors.sub} />
                    </TouchableOpacity>
                  </TouchableOpacity>

                  <View style={styles.continueInfo}>
                    <Text style={[styles.brandName, { color: colors.sub }]} numberOfLines={1}>
                      {item.brand}
                    </Text>
                    <Text style={[styles.continueTitle, { color: colors.title }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={styles.priceRow}>
                      <Text style={[styles.productPrice, { color: colors.title }]}>₹{item.price}</Text>
                      <Text style={[styles.discount, { color: colors.primary }]}>{item.discount}</Text>
                    </View>

                    {/* Quick Action Buttons */}
                    <View style={styles.quickActionsRow}>
                      <TouchableOpacity
                        style={[styles.quickBagButton, { backgroundColor: colors.primary }]}
                        onPress={() => handleQuickAdd(item)}
                      >
                        <ShoppingBag size={14} color="#fff" />
                        <Text style={styles.quickBagText}>Add to Bag</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.quickWishlistButton,
                          {
                            backgroundColor: isWishlisted ? colors.primaryLight : colors.surface,
                            borderColor: isWishlisted ? colors.primary : colors.divider,
                          },
                        ]}
                        onPress={() => handleQuickWishlist(item._id)}
                      >
                        <Heart
                          size={16}
                          color={isWishlisted ? colors.primary : colors.sub}
                          fill={isWishlisted ? colors.primary : "none"}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* SHOP BY CATEGORY */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.title }]}>SHOP BY CATEGORY</Text>
          <TouchableOpacity
            style={styles.viewAll}
            onPress={() => router.push("/(tabs)/categories")}
          >
            <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
            <ChevronRight size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
        >
          {isLoading ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={styles.loader}
            />
          ) : !categories || categories.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.sub }]}>No categories available</Text>
          ) : (
            categories.map((category: any) => (
              <TouchableOpacity
                key={category._id}
                style={styles.categoryCard}
                onPress={() => router.push("/(tabs)/categories")}
              >
                <Image
                  source={{ uri: category.image }}
                  style={[styles.categoryImage, { borderColor: colors.divider, borderWidth: 1 }]}
                />
                <Text style={[styles.categoryName, { color: colors.title }]}>{category.name}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>

      {/* RECENTLY VIEWED PRODUCTS SECTION */}
      {recentlyViewed && recentlyViewed.length > 0 && (
        <View
          style={[
            styles.recentlyViewedSection,
            {
              backgroundColor: colors.surface,
              borderColor: colors.divider,
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.title }]}>RECENTLY VIEWED</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.sub }]}>
                {recentlyViewed.length} unique products • Synced in real-time
              </Text>
            </View>
            <TouchableOpacity onPress={clearHistory} style={styles.clearButton}>
              <Text style={[styles.clearButtonText, { color: colors.primary }]}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScroll}
          >
            {recentlyViewed.map((recentItem) => (
              <TouchableOpacity
                key={recentItem._id}
                style={[
                  styles.recentItemCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.divider,
                  },
                ]}
                onPress={() => handleProductPress(recentItem._id)}
              >
                <Image
                  source={{
                    uri:
                      recentItem.images?.[0] ||
                      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
                  }}
                  style={[styles.recentItemImage, { backgroundColor: colors.surface }]}
                />
                <View style={styles.recentItemInfo}>
                  <Text style={[styles.brandName, { color: colors.sub }]} numberOfLines={1}>
                    {recentItem.brand}
                  </Text>
                  <Text style={[styles.recentItemName, { color: colors.title }]} numberOfLines={1}>
                    {recentItem.name}
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={[styles.productPrice, { color: colors.title }]}>₹{recentItem.price}</Text>
                    <Text style={[styles.discount, { color: colors.primary }]}>{recentItem.discount}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* DEALS OF THE DAY */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.title }]}>DEALS OF THE DAY</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dealsScroll}
        >
          {deals.map((deal) => (
            <TouchableOpacity key={deal.id} style={styles.dealCard}>
              <Image source={{ uri: deal.image }} style={styles.dealImage} />
              <View style={styles.dealOverlay}>
                <Text style={styles.dealTitle}>{deal.title}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* PERSONALIZED RECOMMENDATION CAROUSEL */}
      <View style={{ paddingHorizontal: 16 }}>
        <RecommendationCarousel
          title="Recommended For You"
          subtitle="Trending styles and personalized fashion picks"
          limit={10}
        />
      </View>

      {/* TRENDING NOW */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.title }]}>TRENDING NOW</Text>
        </View>
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={styles.loader}
          />
        ) : !product || product.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.sub }]}>No Product available</Text>
        ) : (
          <View style={[styles.productsGrid, { gap: cardGap }]}>
            {product.map((p: any) => (
              <TouchableOpacity
                key={p._id}
                style={[
                  styles.productCard,
                  {
                    width: cardWidth,
                    backgroundColor: colors.card,
                    borderColor: colors.divider,
                  },
                ]}
                onPress={() => handleProductPress(p._id)}
              >
                <Image
                  source={{
                    uri:
                      p.images?.[0] ||
                      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
                  }}
                  style={[styles.productImage, { height: cardImageHeight }]}
                  resizeMode="cover"
                />
                <View style={styles.productInfo}>
                  <Text style={[styles.brandName, { color: colors.sub }]}>{p.brand}</Text>
                  <Text style={[styles.productName, { color: colors.title }]} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={[styles.productPrice, { color: colors.title }]}>₹{p.price}</Text>
                    <Text style={[styles.discount, { color: colors.primary }]}>{p.discount}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContentWrapper: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
    borderBottomWidth: 1,
    width: "100%",
  },
  headerInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
  },
  logo: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  unreadBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  unreadBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 15,
  },
  banner: {
    width: "100%",
    height: 190,
    resizeMode: "cover",
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  viewAll: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
    marginRight: 4,
  },
  categoriesScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  categoryCard: {
    width: 90,
    marginRight: 14,
    alignItems: "center",
  },
  categoryImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  categoryName: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 13,
    fontWeight: "600",
  },
  dealsScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  dealCard: {
    width: 270,
    height: 140,
    marginRight: 12,
    borderRadius: 14,
    overflow: "hidden",
  },
  dealImage: {
    width: "100%",
    height: "100%",
  },
  dealOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    padding: 12,
  },
  dealTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  productCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: "100%",
  },
  productInfo: {
    padding: 10,
  },
  brandName: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  productName: {
    fontSize: 14,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: "700",
  },
  discount: {
    fontSize: 13,
    fontWeight: "600",
  },
  loader: {
    marginTop: 40,
    alignSelf: "center",
  },
  feedbackBanner: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  feedbackText: {
    fontSize: 13,
    fontWeight: "600",
  },
  continueShoppingSection: {
    padding: 16,
    marginVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  recentlyViewedSection: {
    padding: 16,
    marginVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  clearButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  horizontalScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  continueCard: {
    width: 170,
    marginRight: 14,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  continueImage: {
    width: "100%",
    height: 170,
  },
  dismissButton: {
    position: "absolute",
    top: 8,
    right: 8,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  continueInfo: {
    padding: 10,
  },
  continueTitle: {
    fontSize: 13,
    marginBottom: 4,
    fontWeight: "500",
  },
  quickActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    gap: 6,
  },
  quickBagButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  quickBagText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  quickWishlistButton: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  recentItemCard: {
    width: 140,
    marginRight: 12,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
  },
  recentItemImage: {
    width: "100%",
    height: 140,
  },
  recentItemInfo: {
    padding: 8,
  },
  recentItemName: {
    fontSize: 12,
    marginBottom: 4,
  },
});
