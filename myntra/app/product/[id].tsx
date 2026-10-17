import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Heart, ShoppingBag, ArrowLeft } from "lucide-react-native";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useActivity } from "@/context/ActivityContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/utils/api";
import RecommendationCarousel from "@/components/RecommendationCarousel";

export default function ProductDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const [selectedSize, setSelectedSize] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const autoScrollTimer = useRef<NodeJS.Timeout>();
  const { user } = useAuth();
  const { recordProductView, recentlyViewed } = useActivity();
  const [product, setproduct] = useState<any>(null);
  const [iswishlist, setiswishlist] = useState(false);

  useEffect(() => {
    const fetchproduct = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/product/${id}`);
        const productData = res.data;
        setproduct(productData);
        if (productData && productData._id) {
          recordProductView(productData);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) {
      fetchproduct();
    }
  }, [id]);

  useEffect(() => {
    startAutoScroll();
    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
    };
  }, [product]);

  const startAutoScroll = () => {
    if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
    autoScrollTimer.current = setInterval(() => {
      if (product && product.images && product.images.length > 1 && scrollViewRef.current) {
        const nextIndex = (currentImageIndex + 1) % product.images.length;
        scrollViewRef.current.scrollTo({
          x: nextIndex * width,
          animated: true,
        });
        setCurrentImageIndex(nextIndex);
      }
    }, 3500);
  };

  const handleAddwishlist = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      await api.post(`/wishlist`, {
        userId: user._id,
        productId: id,
      });
      setiswishlist(true);
      router.push("/wishlist");
    } catch (error) {
      console.log(error);
    }
  };

  const handleAddToBag = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (!selectedSize) {
      alert("Please select a size");
      return;
    }
    try {
      setLoading(true);
      await api.post(`/bag/add`, {
        userId: user._id,
        productId: id,
        size: selectedSize,
        quantity: 1,
      });
      router.push("/bag");
    } catch (error: any) {
      console.log(error);
      const msg = error.response?.data?.message || "Failed to add item to bag";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const imageIndex = Math.round(contentOffset.x / width);
    setCurrentImageIndex(imageIndex);

    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
      startAutoScroll();
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View
          style={[
            styles.topBar,
            { backgroundColor: colors.header, borderBottomColor: colors.headerBorder },
          ]}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={24} color={colors.title} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={[styles.name, { color: colors.title }]}>Product not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Top Floating / Header Bar */}
      <View
        style={[
          styles.topBar,
          { backgroundColor: colors.header, borderBottomColor: colors.headerBorder },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.title} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.title }]} numberOfLines={1}>
          {product.brand}
        </Text>
        <TouchableOpacity style={styles.wishlistButton} onPress={handleAddwishlist}>
          <Heart
            size={22}
            color={iswishlist ? colors.primary : colors.title}
            fill={iswishlist ? colors.primary : "none"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Carousel */}
        <View style={styles.carouselContainer}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {(product.images || []).map((image: any, index: any) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={[styles.productImage, { width, backgroundColor: colors.surface }]}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          <View style={styles.pagination}>
            {(product.images || []).map((_: any, index: any) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  currentImageIndex === index && {
                    backgroundColor: colors.primary,
                    width: 12,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <View style={[styles.content, { backgroundColor: colors.bg }]}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.brand, { color: colors.sub }]}>{product.brand}</Text>
              <Text style={[styles.name, { color: colors.title }]}>{product.name}</Text>
            </View>
          </View>

          <View style={styles.priceContainer}>
            <Text style={[styles.price, { color: colors.title }]}>₹{product.price}</Text>
            <Text style={[styles.discount, { color: colors.primary }]}>{product.discount}</Text>
          </View>

          <Text style={[styles.description, { color: colors.sub }]}>{product.description}</Text>

          {/* Size Section */}
          <View style={styles.sizeSection}>
            <Text style={[styles.sizeTitle, { color: colors.title }]}>Select Size</Text>
            <View style={styles.sizeGrid}>
              {(product.sizes || ["S", "M", "L", "XL"]).map((size: any) => {
                const isSelected = selectedSize === size;
                return (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.sizeButton,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.divider,
                      },
                    ]}
                    onPress={() => setSelectedSize(size)}
                  >
                    <Text
                      style={[
                        styles.sizeText,
                        {
                          color: isSelected ? "#ffffff" : colors.title,
                          fontWeight: isSelected ? "700" : "500",
                        },
                      ]}
                    >
                      {size}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Recently Viewed Section */}
          {recentlyViewed.filter((item) => item._id !== product._id).length > 0 && (
            <View
              style={[
                styles.recentlyViewedSection,
                { borderTopColor: colors.divider },
              ]}
            >
              <View style={styles.recentSectionHeader}>
                <Text style={[styles.recentSectionTitle, { color: colors.title }]}>
                  RECENTLY VIEWED
                </Text>
                <Text style={[styles.recentCountBadge, { color: colors.primary }]}>
                  {recentlyViewed.filter((item) => item._id !== product._id).length} ITEMS
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.recentProductsScroll}
              >
                {recentlyViewed
                  .filter((item) => item._id !== product._id)
                  .map((recentItem) => (
                    <TouchableOpacity
                      key={recentItem._id}
                      style={[
                        styles.recentCard,
                        { backgroundColor: colors.card, borderColor: colors.divider },
                      ]}
                      onPress={() => router.push(`/product/${recentItem._id}`)}
                    >
                      <Image
                        source={{
                          uri:
                            recentItem.images?.[0] ||
                            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
                        }}
                        style={[styles.recentImage, { backgroundColor: colors.surface }]}
                      />
                      <View style={styles.recentInfo}>
                        <Text style={[styles.recentBrand, { color: colors.sub }]} numberOfLines={1}>
                          {recentItem.brand}
                        </Text>
                        <Text style={[styles.recentName, { color: colors.title }]} numberOfLines={1}>
                          {recentItem.name}
                        </Text>
                        <View style={styles.recentPriceRow}>
                          <Text style={[styles.recentPrice, { color: colors.title }]}>
                            ₹{recentItem.price}
                          </Text>
                          <Text style={[styles.recentDiscount, { color: colors.primary }]}>
                            {recentItem.discount}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            </View>
          )}
          {/* You May Also Like Recommendation Carousel */}
          <RecommendationCarousel
            productId={id as string}
            title="You May Also Like"
            subtitle="Curated matching styles & alternatives"
            limit={8}
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Bottom Footer */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.footerBg,
            borderTopColor: colors.footerBorder,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.addToBagButton, { backgroundColor: colors.primary }]}
          onPress={handleAddToBag}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <ShoppingBag size={20} color="#fff" />
              <Text style={styles.addToBagText}>ADD TO BAG</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    marginRight: 10,
  },
  topTitle: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  carouselContainer: {
    position: "relative",
  },
  productImage: {
    height: 380,
  },
  pagination: {
    position: "absolute",
    bottom: 14,
    flexDirection: "row",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    marginHorizontal: 3,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brand: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  wishlistButton: {
    padding: 6,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: "700",
  },
  discount: {
    fontSize: 15,
    fontWeight: "600",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  sizeSection: {
    marginBottom: 20,
  },
  sizeTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
  },
  sizeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  sizeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sizeText: {
    fontSize: 14,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    elevation: 8,
  },
  addToBagButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    gap: 8,
  },
  addToBagText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  recentlyViewedSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  recentSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  recentSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  recentCountBadge: {
    fontSize: 11,
    fontWeight: "700",
  },
  recentProductsScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  recentCard: {
    width: 130,
    marginRight: 12,
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  recentImage: {
    width: "100%",
    height: 140,
  },
  recentInfo: {
    padding: 8,
  },
  recentBrand: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 2,
  },
  recentName: {
    fontSize: 12,
    marginBottom: 4,
  },
  recentPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  recentPrice: {
    fontSize: 13,
    fontWeight: "700",
  },
  recentDiscount: {
    fontSize: 11,
    fontWeight: "600",
  },
});
