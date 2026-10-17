import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Heart,
  ShoppingBag,
  ArrowLeft,
  Star,
  Truck,
  RotateCcw,
  ShieldCheck,
  Check,
} from "lucide-react-native";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useActivity } from "@/context/ActivityContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/utils/api";
import RecommendationCarousel from "@/components/RecommendationCarousel";
import DesktopNavbar from "@/components/DesktopNavbar";

export default function ProductDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const isDesktop = width >= 768;

  const [selectedSize, setSelectedSize] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [pincode, setPincode] = useState("");
  const [pincodeChecked, setPincodeChecked] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const autoScrollTimer = useRef<NodeJS.Timeout>();
  const { user } = useAuth();
  const { recordProductView, recentlyViewed } = useActivity();
  const [product, setproduct] = useState<any>(null);
  const [iswishlist, setiswishlist] = useState(false);

  const cleanId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    let isMounted = true;
    const fetchproduct = async () => {
      if (!cleanId) return;
      try {
        setIsLoading(true);
        const res = await api.get(`/product/${cleanId}`);
        const productData = res.data;
        if (isMounted) {
          if (productData && typeof productData === "object" && productData._id) {
            setproduct(productData);
            if (productData.sizes && Array.isArray(productData.sizes) && productData.sizes.length > 0) {
              setSelectedSize(productData.sizes[0]);
            }
            recordProductView(productData);
          } else {
            setproduct(null);
          }
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        if (isMounted) setproduct(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    fetchproduct();
    return () => {
      isMounted = false;
    };
  }, [cleanId]);

  useEffect(() => {
    startAutoScroll();
    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
    };
  }, [product]);

  const productImages =
    product?.images && Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : product?.image
      ? [product.image]
      : ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format&fit=crop"];

  const productSizes =
    product?.sizes && Array.isArray(product.sizes) && product.sizes.length > 0
      ? product.sizes
      : ["S", "M", "L", "XL"];

  const carouselWidth = Math.min(width, 600);

  const startAutoScroll = () => {
    if (isDesktop) return; // Disable mobile timer on desktop
    if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
    autoScrollTimer.current = setInterval(() => {
      if (productImages.length > 1 && scrollViewRef.current) {
        const nextIndex = (currentImageIndex + 1) % productImages.length;
        scrollViewRef.current.scrollTo({
          x: nextIndex * carouselWidth,
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
    const imageIndex = Math.round(contentOffset.x / carouselWidth);
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
        {isDesktop && <DesktopNavbar />}
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
      {/* Desktop Top Navbar (Screens >= 768px) */}
      {isDesktop ? (
        <DesktopNavbar />
      ) : (
        /* Mobile Top Floating Bar */
        <View
          style={[
            styles.topBar,
            { backgroundColor: colors.header, borderBottomColor: colors.headerBorder },
          ]}
        >
          <View style={styles.headerInner}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ArrowLeft size={24} color={colors.title} />
            </TouchableOpacity>
            <Text style={[styles.topTitle, { color: colors.title }]} numberOfLines={1}>
              {product.brand || product.name || "Product Details"}
            </Text>
            <TouchableOpacity style={styles.wishlistButton} onPress={handleAddwishlist}>
              <Heart
                size={22}
                color={iswishlist ? colors.primary : colors.title}
                fill={iswishlist ? colors.primary : "none"}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: isDesktop ? 60 : 100 }}>
        {isDesktop ? (
          /* ========================================================= */
          /* DESKTOP 2-COLUMN SPLIT E-COMMERCE LAYOUT (Screens >= 768px) */
          /* ========================================================= */
          <View style={styles.desktopContainer}>
            {/* Breadcrumb Trail */}
            <View style={styles.desktopBreadcrumbs}>
              <TouchableOpacity onPress={() => router.push("/(tabs)")}>
                <Text style={[styles.breadcrumbText, { color: colors.sub }]}>Home</Text>
              </TouchableOpacity>
              <Text style={[styles.breadcrumbSeparator, { color: colors.sub }]}>/</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/categories")}>
                <Text style={[styles.breadcrumbText, { color: colors.sub }]}>{product.category || "Fashion"}</Text>
              </TouchableOpacity>
              <Text style={[styles.breadcrumbSeparator, { color: colors.sub }]}>/</Text>
              <Text style={[styles.breadcrumbActive, { color: colors.title }]} numberOfLines={1}>
                {product.brand} - {product.name || product.title}
              </Text>
            </View>

            {/* Split Grid */}
            <View style={styles.desktopSplit}>
              {/* LEFT COLUMN: Gallery & Thumbnails */}
              <View style={styles.desktopGalleryCol}>
                <Image
                  source={{ uri: productImages[currentImageIndex] || productImages[0] }}
                  style={[styles.desktopMainImg, { backgroundColor: colors.surface }]}
                  resizeMode="cover"
                />
                {productImages.length > 1 && (
                  <View style={styles.desktopThumbnailsWrap}>
                    {productImages.map((img: string, idx: number) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => setCurrentImageIndex(idx)}
                        style={[
                          styles.desktopThumbItem,
                          {
                            borderColor: currentImageIndex === idx ? colors.primary : colors.divider,
                            borderWidth: currentImageIndex === idx ? 2 : 1,
                          },
                        ]}
                        activeOpacity={0.8}
                      >
                        <Image source={{ uri: img }} style={styles.desktopThumbImg} resizeMode="cover" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* RIGHT COLUMN: Info, Price, Sizes, Actions, Delivery */}
              <View style={styles.desktopInfoCol}>
                <Text style={[styles.desktopBrandHeading, { color: colors.title }]}>
                  {product.brand || "Brand"}
                </Text>
                <Text style={[styles.desktopTitleHeading, { color: colors.sub }]}>
                  {product.name || product.title}
                </Text>

                {/* Rating Badge */}
                <View
                  style={[
                    styles.desktopRatingBadge,
                    { backgroundColor: colors.surface, borderColor: colors.divider },
                  ]}
                >
                  <Text style={[styles.desktopRatingText, { color: colors.title }]}>4.4 ★</Text>
                  <View style={[styles.desktopRatingDivider, { backgroundColor: colors.divider }]} />
                  <Text style={[styles.desktopRatingCount, { color: colors.sub }]}>1.2k Ratings</Text>
                </View>

                <View style={[styles.desktopDividerLine, { backgroundColor: colors.divider }]} />

                {/* Price Display */}
                <View style={styles.desktopPriceSection}>
                  <Text style={[styles.desktopMainPrice, { color: colors.title }]}>₹{product.price}</Text>
                  <Text style={[styles.desktopOriginalPrice, { color: colors.sub }]}>
                    ₹{Math.round(product.price * 1.35)}
                  </Text>
                  <Text style={[styles.desktopDiscountText, { color: colors.primary }]}>
                    ({product.discount || "25% OFF"})
                  </Text>
                </View>
                <Text style={styles.desktopTaxNote}>inclusive of all taxes</Text>

                {/* Size Selection */}
                <View style={styles.desktopSizesSection}>
                  <View style={styles.desktopSizesHeader}>
                    <Text style={[styles.desktopSizesTitle, { color: colors.title }]}>SELECT SIZE</Text>
                    <TouchableOpacity>
                      <Text style={[styles.desktopSizeChartLink, { color: colors.primary }]}>
                        SIZE CHART ›
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.desktopSizesRow}>
                    {productSizes.map((size: string) => {
                      const isSelected = selectedSize === size;
                      return (
                        <TouchableOpacity
                          key={size}
                          style={[
                            styles.desktopSizeBtn,
                            {
                              backgroundColor: isSelected ? colors.primary : colors.surface,
                              borderColor: isSelected ? colors.primary : colors.divider,
                            },
                          ]}
                          onPress={() => setSelectedSize(size)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.desktopSizeBtnText,
                              {
                                color: isSelected ? "#fff" : colors.title,
                                fontWeight: isSelected ? "700" : "600",
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

                {/* Action Buttons: Add to Bag & Wishlist */}
                <View style={styles.desktopActionRow}>
                  <TouchableOpacity
                    style={[styles.desktopAddToBagBtn, { backgroundColor: colors.primary }]}
                    onPress={handleAddToBag}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <ShoppingBag size={20} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.desktopAddToBagBtnText}>ADD TO BAG</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.desktopWishlistBtn,
                      {
                        borderColor: iswishlist ? colors.primary : colors.divider,
                        backgroundColor: iswishlist
                          ? isDark
                            ? "#2a1520"
                            : "#fff0f4"
                          : colors.surface,
                      },
                    ]}
                    onPress={handleAddwishlist}
                    activeOpacity={0.8}
                  >
                    <Heart
                      size={20}
                      color={iswishlist ? colors.primary : colors.title}
                      fill={iswishlist ? colors.primary : "none"}
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={[
                        styles.desktopWishlistBtnText,
                        { color: iswishlist ? colors.primary : colors.title },
                      ]}
                    >
                      {iswishlist ? "WISHLISTED" : "WISHLIST"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Delivery Options Box */}
                <View
                  style={[
                    styles.desktopDeliveryBox,
                    { borderColor: colors.divider, backgroundColor: colors.surface },
                  ]}
                >
                  <Text style={[styles.desktopDeliveryTitle, { color: colors.title }]}>
                    DELIVERY OPTIONS
                  </Text>
                  <View style={styles.desktopPincodeRow}>
                    <TextInput
                      placeholder="Enter delivery pincode"
                      placeholderTextColor={colors.sub}
                      value={pincode}
                      onChangeText={setPincode}
                      keyboardType="number-pad"
                      maxLength={6}
                      style={[
                        styles.desktopPincodeInput,
                        { color: colors.text, borderColor: colors.divider },
                      ]}
                    />
                    <TouchableOpacity
                      style={[styles.desktopPincodeBtn, { backgroundColor: colors.primary }]}
                      onPress={() => setPincodeChecked(true)}
                    >
                      <Text style={styles.desktopPincodeBtnText}>Check</Text>
                    </TouchableOpacity>
                  </View>
                  {pincodeChecked && (
                    <Text style={{ color: "#10b981", fontSize: 13, marginTop: 6, fontWeight: "600" }}>
                      ✓ Delivery by Tomorrow | Free Shipping
                    </Text>
                  )}

                  <View style={styles.desktopPerksList}>
                    <Text style={[styles.desktopPerkItem, { color: colors.sub }]}>
                      ✓ 100% Original Products
                    </Text>
                    <Text style={[styles.desktopPerkItem, { color: colors.sub }]}>
                      ✓ Pay on delivery available
                    </Text>
                    <Text style={[styles.desktopPerkItem, { color: colors.sub }]}>
                      ✓ Easy 14 days returns & exchanges
                    </Text>
                  </View>
                </View>

                {/* Product Description */}
                <View style={styles.desktopDetailsSection}>
                  <Text style={[styles.desktopDetailsHeading, { color: colors.title }]}>
                    PRODUCT DETAILS
                  </Text>
                  <Text style={[styles.desktopDescriptionText, { color: colors.sub }]}>
                    {product.description}
                  </Text>
                </View>
              </View>
            </View>

            {/* Desktop Recommendations */}
            <View style={{ marginTop: 50, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 30 }}>
              <RecommendationCarousel
                productId={id as string}
                title="Similar Products & Styles"
                subtitle="Customers who viewed this item also liked"
                limit={8}
              />
            </View>
          </View>
        ) : (
          /* ========================================================= */
          /* MOBILE VIEW (Screens < 768px)                             */
          /* ========================================================= */
          <View style={styles.mainWrapper}>
            {/* Carousel */}
            <View style={[styles.carouselContainer, { width: carouselWidth, alignSelf: "center" }]}>
              <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
              >
                {productImages.map((image: any, index: any) => (
                  <Image
                    key={index}
                    source={{ uri: image }}
                    style={[
                      styles.productImage,
                      {
                        width: carouselWidth,
                        height: Math.min(carouselWidth * 1.25, 520),
                        backgroundColor: colors.surface,
                      },
                    ]}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
              <View style={styles.pagination}>
                {productImages.map((_: any, index: any) => (
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
                  <Text style={[styles.brand, { color: colors.sub }]}>{product.brand || "Brand"}</Text>
                  <Text style={[styles.name, { color: colors.title }]}>{product.name || product.title}</Text>
                </View>
              </View>

              <View style={styles.priceContainer}>
                <Text style={[styles.price, { color: colors.title }]}>₹{product.price ?? 0}</Text>
                {product.discount ? (
                  <Text style={[styles.discount, { color: colors.primary }]}>{product.discount}</Text>
                ) : null}
              </View>

              <Text style={[styles.description, { color: colors.sub }]}>{product.description || ""}</Text>

              {/* Size Section */}
              <View style={styles.sizeSection}>
                <Text style={[styles.sizeTitle, { color: colors.title }]}>Select Size</Text>
                <View style={styles.sizeGrid}>
                  {productSizes.map((size: any) => {
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
                            <Text style={[styles.recentBrand, { color: colors.sub }]}>
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
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Footer (Only on Mobile) */}
      {!isDesktop && (
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 650,
    alignSelf: "center",
  },
  mainWrapper: {
    width: "100%",
    maxWidth: 650,
    alignSelf: "center",
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
    borderBottomWidth: 1,
    width: "100%",
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
    gap: 10,
    marginBottom: 12,
  },
  price: {
    fontSize: 22,
    fontWeight: "800",
  },
  discount: {
    fontSize: 15,
    fontWeight: "700",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
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
    gap: 8,
  },
  sizeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 44,
    alignItems: "center",
  },
  sizeText: {
    fontSize: 14,
  },
  recentlyViewedSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  recentSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  recentSectionTitle: {
    fontSize: 14,
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
    width: 140,
    marginRight: 12,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
  },
  recentImage: {
    width: "100%",
    height: 160,
  },
  recentInfo: {
    padding: 8,
  },
  recentBrand: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 2,
  },
  recentName: {
    fontSize: 12,
    marginBottom: 4,
  },
  recentPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  recentPrice: {
    fontSize: 13,
    fontWeight: "700",
  },
  recentDiscount: {
    fontSize: 11,
    fontWeight: "600",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  addToBagButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  addToBagText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  /* ======================================================== */
  /* DESKTOP STYLES (Split 2-Column, Breadcrumbs, Side-by-side)*/
  /* ======================================================== */
  desktopContainer: {
    width: "100%",
    maxWidth: 1240,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  desktopBreadcrumbs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  breadcrumbText: {
    fontSize: 13,
    fontWeight: "500",
  },
  breadcrumbSeparator: {
    fontSize: 13,
  },
  breadcrumbActive: {
    fontSize: 13,
    fontWeight: "700",
    maxWidth: 500,
  },
  desktopSplit: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 48,
  },
  desktopGalleryCol: {
    flex: 1.1,
    maxWidth: 620,
  },
  desktopMainImg: {
    width: "100%",
    height: 600,
    borderRadius: 14,
  },
  desktopThumbnailsWrap: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },
  desktopThumbItem: {
    width: 76,
    height: 94,
    borderRadius: 8,
    overflow: "hidden",
  },
  desktopThumbImg: {
    width: "100%",
    height: "100%",
  },
  desktopInfoCol: {
    flex: 1,
    maxWidth: 520,
  },
  desktopBrandHeading: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  desktopTitleHeading: {
    fontSize: 18,
    fontWeight: "500",
    lineHeight: 24,
    marginBottom: 14,
  },
  desktopRatingBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 8,
    marginBottom: 16,
  },
  desktopRatingText: {
    fontSize: 13,
    fontWeight: "800",
  },
  desktopRatingDivider: {
    width: 1,
    height: 14,
  },
  desktopRatingCount: {
    fontSize: 12,
    fontWeight: "500",
  },
  desktopDividerLine: {
    height: 1,
    width: "100%",
    marginBottom: 16,
  },
  desktopPriceSection: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 12,
  },
  desktopMainPrice: {
    fontSize: 28,
    fontWeight: "900",
  },
  desktopOriginalPrice: {
    fontSize: 18,
    fontWeight: "500",
    textDecorationLine: "line-through",
  },
  desktopDiscountText: {
    fontSize: 18,
    fontWeight: "800",
  },
  desktopTaxNote: {
    color: "#10b981",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
    marginBottom: 20,
  },
  desktopSizesSection: {
    marginBottom: 24,
  },
  desktopSizesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  desktopSizesTitle: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  desktopSizeChartLink: {
    fontSize: 13,
    fontWeight: "700",
  },
  desktopSizesRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  desktopSizeBtn: {
    minWidth: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  desktopSizeBtnText: {
    fontSize: 14,
  },
  desktopActionRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 28,
  },
  desktopAddToBagBtn: {
    flex: 1.2,
    height: 52,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  desktopAddToBagBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  desktopWishlistBtn: {
    flex: 1,
    height: 52,
    borderRadius: 8,
    borderWidth: 1.5,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  desktopWishlistBtnText: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  desktopDeliveryBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    marginBottom: 24,
  },
  desktopDeliveryTitle: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  desktopPincodeRow: {
    flexDirection: "row",
    gap: 10,
  },
  desktopPincodeInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  desktopPincodeBtn: {
    paddingHorizontal: 18,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  desktopPincodeBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  desktopPerksList: {
    marginTop: 14,
    gap: 6,
  },
  desktopPerkItem: {
    fontSize: 12,
    lineHeight: 18,
  },
  desktopDetailsSection: {
    marginBottom: 24,
  },
  desktopDetailsHeading: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  desktopDescriptionText: {
    fontSize: 14,
    lineHeight: 22,
  },
});
