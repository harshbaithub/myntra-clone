import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
  Bookmark,
  BookmarkCheck,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Tag,
  Truck,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/utils/api";
import RecommendationCarousel from "@/components/RecommendationCarousel";
import DesktopNavbar from "@/components/DesktopNavbar";

export default function Bag() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { user } = useAuth();
  const { colors } = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Cart & Save for Later States
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    itemCount: 0,
    rawSubtotal: 0,
    originalTotal: 0,
    totalDiscount: 0,
    shippingFee: 0,
    estimatedTax: 0,
    grandTotal: 0,
    qualifiesForFreeShipping: false,
    freeShippingThreshold: 1199,
  });
  const [priceAlerts, setPriceAlerts] = useState<any[]>([]);
  const [stockAlerts, setStockAlerts] = useState<any[]>([]);

  // UI accordion & coupon states
  const [isSavedExpanded, setIsSavedExpanded] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  // Fetch full Bag with Save for Later and Stock/Price checks
  const fetchBag = useCallback(
    async (isRefresh = false) => {
      if (!user?._id) {
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }
      try {
        if (!isRefresh) setIsLoading(true);
        const res = await api.get(`/bag/${user._id}`);
        if (res.data) {
          setCartItems(res.data.cartItems || []);
          setSavedItems(res.data.savedForLaterItems || []);
          setSummary(res.data.summary || {});
          setPriceAlerts(res.data.priceChangeAlerts || []);
          setStockAlerts(res.data.outOfStockAlerts || []);
        }
      } catch (error) {
        console.error("Fetch bag error:", error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user?._id]
  );

  useEffect(() => {
    fetchBag();
  }, [fetchBag]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchBag(true);
  };

  // 1. Update Quantity (+ / -)
  const handleUpdateQuantity = async (itemId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty < 1) {
      handleRemoveItem(itemId, "cart");
      return;
    }
    if (newQty > 10) {
      Alert.alert("Quantity Limit", "Maximum 10 units allowed per item.");
      return;
    }

    try {
      setIsActionLoading(true);
      await api.put(`/bag/update-quantity/${itemId}`, { quantity: newQty });
      fetchBag(true);
    } catch (err: any) {
      Alert.alert("Stock Limit", err.response?.data?.message || "Could not update quantity.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // 2. Save Item for Later
  const handleSaveForLater = async (itemId: string) => {
    try {
      setIsActionLoading(true);
      await api.post(`/bag/save-for-later/${itemId}`);
      fetchBag(true);
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Could not save item for later.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // 3. Move Item back to Cart
  const handleMoveToCart = async (itemId: string) => {
    try {
      setIsActionLoading(true);
      await api.post(`/bag/move-to-cart/${itemId}`);
      fetchBag(true);
    } catch (err: any) {
      Alert.alert("Stock Issue", err.response?.data?.message || "Could not move item to cart.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // 4. Remove Item
  const handleRemoveItem = (itemId: string, source: "cart" | "saved") => {
    Alert.alert(
      "Remove Item",
      `Are you sure you want to remove this item from your ${source === "cart" ? "bag" : "saved list"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setIsActionLoading(true);
              await api.delete(`/bag/${itemId}`);
              fetchBag(true);
            } catch (err) {
              console.error("Remove error:", err);
            } finally {
              setIsActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // 5. Apply Coupon Code
  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (code === "MYNTRA200" || code === "SAVE200") {
      if (summary.rawSubtotal < 1000) {
        Alert.alert("Coupon Condition", "Coupon valid on orders above ₹1,000.");
        return;
      }
      setAppliedCoupon(code);
      setCouponDiscount(200);
      Alert.alert("Coupon Applied! 🎉", "₹200 discount successfully applied.");
    } else if (code === "FIRST500" || code === "FASHION500") {
      if (summary.rawSubtotal < 2500) {
        Alert.alert("Coupon Condition", "Coupon valid on orders above ₹2,500.");
        return;
      }
      setAppliedCoupon(code);
      setCouponDiscount(500);
      Alert.alert("Coupon Applied! 🎉", "₹500 discount successfully applied.");
    } else {
      Alert.alert("Invalid Coupon", "Please enter a valid coupon code like 'MYNTRA200'.");
    }
  };

  // 6. Pre-Checkout Validation & Proceed
  const handleProceedToCheckout = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (cartItems.length === 0) {
      Alert.alert("Bag is Empty", "Add items to your shopping bag before proceeding.");
      return;
    }

    try {
      setIsActionLoading(true);
      const res = await api.get(`/bag/validate/${user._id}`);
      if (res.data?.isValid) {
        router.push("/checkout");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Some items in your cart need attention.";
      const issues = err.response?.data?.issues || [];
      const detailedMsg = issues.length > 0 ? issues.map((i: any) => `• ${i.message}`).join("\n") : msg;
      Alert.alert("Cannot Proceed", detailedMsg);
      fetchBag(true);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.headerBorder }]}>
          <Text style={[styles.headerTitle, { color: colors.title }]}>Shopping Bag</Text>
        </View>
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconCircle, { backgroundColor: colors.primaryLight }]}>
            <ShoppingBag size={48} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.title }]}>Please login to view your bag</Text>
          <Text style={[styles.emptySubtitle, { color: colors.sub }]}>
            Your shopping cart and saved items sync seamlessly across all your devices.
          </Text>
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.loginButtonText}>LOGIN TO ACCOUNT</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.sub, fontSize: 13 }}>Syncing smart cart...</Text>
      </View>
    );
  }

  const payableTotal = Math.max(0, (summary.grandTotal || 0) - couponDiscount);
  const remainingForFreeShipping = Math.max(0, 1199 - (summary.rawSubtotal || 0));

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {isDesktop ? (
        <DesktopNavbar />
      ) : (
        /* Top Header */
        <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.headerBorder }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.title }]}>Shopping Bag</Text>
            <Text style={[styles.headerSub, { color: colors.sub }]}>
              {summary.itemCount || 0} item(s) in bag • {savedItems.length} saved for later
            </Text>
          </View>
          <View style={[styles.headerBadge, { backgroundColor: colors.primaryLight }]}>
            <ShieldCheck size={14} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={[styles.headerBadgeText, { color: colors.primary }]}>Live Sync</Text>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ maxWidth: 1000, width: "100%", alignSelf: "center", paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Real-time Free Shipping Progress Bar */}
        {cartItems.length > 0 && (
          <View style={[styles.freeShippingCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
              <Truck size={16} color={summary.qualifiesForFreeShipping ? "#059669" : colors.primary} />
              <Text
                style={[
                  styles.freeShippingTitle,
                  { color: summary.qualifiesForFreeShipping ? "#059669" : colors.title },
                ]}
              >
                {summary.qualifiesForFreeShipping
                  ? "🎉 You have unlocked FREE Standard Delivery!"
                  : `Add ₹${remainingForFreeShipping} more to unlock FREE Delivery`}
              </Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: colors.surface }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: summary.qualifiesForFreeShipping ? "#059669" : colors.primary,
                    width: `${Math.min(100, Math.round(((summary.rawSubtotal || 0) / 1199) * 100))}%`,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* Real-Time Price Change Banners */}
        {priceAlerts.map((alert, idx) => (
          <View
            key={idx}
            style={[
              styles.alertBanner,
              {
                backgroundColor: alert.type === "PRICE_DROP" ? "#ecfdf5" : "#fef3c7",
                borderColor: alert.type === "PRICE_DROP" ? "#a7f3d0" : "#fde68a",
              },
            ]}
          >
            {alert.type === "PRICE_DROP" ? (
              <TrendingDown size={18} color="#059669" />
            ) : (
              <TrendingUp size={18} color="#d97706" />
            )}
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text
                style={[
                  styles.alertTitle,
                  { color: alert.type === "PRICE_DROP" ? "#059669" : "#d97706" },
                ]}
              >
                {alert.type === "PRICE_DROP" ? "Price Dropped! 🔥" : "Price Updated"}
              </Text>
              <Text style={styles.alertDesc}>
                {alert.productName}: Price {alert.type === "PRICE_DROP" ? "dropped" : "changed"} from ₹{alert.oldPrice} to ₹{alert.newPrice}.
              </Text>
            </View>
          </View>
        ))}

        {/* Out-of-Stock Warnings */}
        {stockAlerts.map((alert, idx) => (
          <View key={idx} style={[styles.alertBanner, { backgroundColor: "#fef2f2", borderColor: "#fecaca" }]}>
            <AlertTriangle size={18} color="#dc2626" />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={[styles.alertTitle, { color: "#dc2626" }]}>Stock Alert</Text>
              <Text style={styles.alertDesc}>
                {alert.productName}: {alert.status === "OUT_OF_STOCK" ? "Currently out of stock." : `Only ${alert.availableStock} remaining.`} Please update your cart before checking out.
              </Text>
            </View>
          </View>
        ))}

        {/* SECTION 1: Active Cart Items */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionHeading, { color: colors.title }]}>
            Items in Bag ({cartItems.length})
          </Text>
        </View>

        {cartItems.length === 0 ? (
          <View style={[styles.emptyCartCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
            <ShoppingBag size={40} color={colors.sub} />
            <Text style={[styles.emptyCartTitle, { color: colors.title }]}>Your active bag is empty</Text>
            <Text style={[styles.emptyCartSub, { color: colors.sub }]}>
              Add trending styles or move items from your Saved for Later section below.
            </Text>
            <TouchableOpacity
              style={[styles.exploreBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/(tabs)/categories")}
            >
              <Text style={styles.exploreBtnText}>EXPLORE PRODUCTS</Text>
            </TouchableOpacity>
          </View>
        ) : (
          cartItems.map((item) => {
            const product = item.productId || {};
            const imgUri =
              (Array.isArray(product.images) ? product.images[0] : product.images) ||
              "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500";
            const originalPrice = product.originalPrice || Math.round(product.price * 1.3);
            const discountPct = Math.round(((originalPrice - product.price) / originalPrice) * 100);

            return (
              <View
                key={item._id}
                style={[
                  styles.itemCard,
                  { backgroundColor: colors.card, borderColor: colors.divider },
                  item.isOutOfStock && { opacity: 0.7, borderColor: "#fecaca" },
                ]}
              >
                <TouchableOpacity onPress={() => router.push(`/product/${product._id}`)}>
                  <Image source={{ uri: imgUri }} style={[styles.itemImage, { backgroundColor: colors.surface }]} />
                </TouchableOpacity>

                <View style={styles.itemDetails}>
                  <Text style={[styles.brandText, { color: colors.primary }]}>{product.brand || "MYNTRA"}</Text>
                  <Text style={[styles.titleText, { color: colors.title }]} numberOfLines={1}>
                    {product.name || product.title}
                  </Text>

                  {/* Preserved Variants (Size & Color) */}
                  <View style={styles.variantRow}>
                    <View style={[styles.variantChip, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
                      <Text style={[styles.variantChipText, { color: colors.sub }]}>
                        Size: <Text style={{ color: colors.title, fontWeight: "700" }}>{item.size || "M"}</Text>
                      </Text>
                    </View>
                    {item.color && item.color !== "Standard" && (
                      <View style={[styles.variantChip, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
                        <Text style={[styles.variantChipText, { color: colors.sub }]}>
                          Color: <Text style={{ color: colors.title, fontWeight: "700" }}>{item.color}</Text>
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Price & Discount Row */}
                  <View style={styles.priceRow}>
                    <Text style={[styles.currentPrice, { color: colors.title }]}>
                      ₹{(product.price || 0).toLocaleString("en-IN")}
                    </Text>
                    {originalPrice > product.price && (
                      <Text style={[styles.originalPrice, { color: colors.sub }]}>
                        ₹{originalPrice.toLocaleString("en-IN")}
                      </Text>
                    )}
                    {discountPct > 0 && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountBadgeText}>{discountPct}% OFF</Text>
                      </View>
                    )}
                  </View>

                  {/* Stock Notice */}
                  {item.isOutOfStock ? (
                    <Text style={styles.outOfStockText}>Currently Out of Stock</Text>
                  ) : item.isLowStock ? (
                    <Text style={styles.lowStockText}>Only {item.availableStock} left in stock</Text>
                  ) : null}

                  {/* Actions Row (Quantity Stepper + Save for Later + Delete) */}
                  <View style={styles.actionsRow}>
                    {/* Stepper */}
                    <View style={[styles.stepperContainer, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => handleUpdateQuantity(item._id, item.quantity, -1)}
                        disabled={isActionLoading}
                      >
                        <Minus size={14} color={colors.title} />
                      </TouchableOpacity>
                      <Text style={[styles.stepperValue, { color: colors.title }]}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => handleUpdateQuantity(item._id, item.quantity, 1)}
                        disabled={isActionLoading || (item.availableStock && item.quantity >= item.availableStock)}
                      >
                        <Plus size={14} color={colors.title} />
                      </TouchableOpacity>
                    </View>

                    {/* Save for Later Button */}
                    <TouchableOpacity
                      style={[styles.saveForLaterBtn, { borderColor: colors.divider, backgroundColor: colors.surface }]}
                      onPress={() => handleSaveForLater(item._id)}
                      disabled={isActionLoading}
                    >
                      <Bookmark size={14} color={colors.primary} style={{ marginRight: 4 }} />
                      <Text style={[styles.saveForLaterText, { color: colors.title }]}>Save for Later</Text>
                    </TouchableOpacity>

                    {/* Remove Trash */}
                    <TouchableOpacity
                      style={[styles.deleteIconBtn, { backgroundColor: colors.surface }]}
                      onPress={() => handleRemoveItem(item._id, "cart")}
                      disabled={isActionLoading}
                    >
                      <Trash2 size={16} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}

        {/* SECTION 2: Save for Later Accordion */}
        {savedItems.length > 0 && (
          <View style={styles.savedSection}>
            <TouchableOpacity
              style={[styles.savedHeaderRow, { backgroundColor: colors.card, borderColor: colors.divider }]}
              onPress={() => setIsSavedExpanded(!isSavedExpanded)}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <BookmarkCheck size={18} color={colors.primary} />
                <Text style={[styles.savedSectionTitle, { color: colors.title }]}>
                  Saved for Later ({savedItems.length})
                </Text>
              </View>
              {isSavedExpanded ? <ChevronUp size={20} color={colors.sub} /> : <ChevronDown size={20} color={colors.sub} />}
            </TouchableOpacity>

            {isSavedExpanded && (
              <View style={styles.savedItemsContainer}>
                {savedItems.map((saved) => {
                  const product = saved.productId || {};
                  const imgUri =
                    (Array.isArray(product.images) ? product.images[0] : product.images) ||
                    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500";

                  return (
                    <View
                      key={saved._id}
                      style={[styles.savedItemCard, { backgroundColor: colors.card, borderColor: colors.divider }]}
                    >
                      <Image source={{ uri: imgUri }} style={[styles.savedItemImage, { backgroundColor: colors.surface }]} />
                      <View style={styles.savedItemDetails}>
                        <Text style={[styles.brandText, { color: colors.primary }]}>{product.brand || "MYNTRA"}</Text>
                        <Text style={[styles.titleText, { color: colors.title }]} numberOfLines={1}>
                          {product.name || product.title}
                        </Text>
                        <Text style={[styles.variantSummary, { color: colors.sub }]}>
                          Variant: Size {saved.size || "M"} • Qty {saved.quantity}
                        </Text>
                        <Text style={[styles.currentPrice, { color: colors.title }]}>
                          ₹{(product.price || 0).toLocaleString("en-IN")}
                        </Text>

                        {/* Move to Bag & Remove Buttons */}
                        <View style={styles.savedActionsRow}>
                          <TouchableOpacity
                            style={[styles.moveToBagBtn, { backgroundColor: colors.primary }]}
                            onPress={() => handleMoveToCart(saved._id)}
                            disabled={isActionLoading}
                          >
                            <ShoppingBag size={14} color="#ffffff" style={{ marginRight: 6 }} />
                            <Text style={styles.moveToBagText}>Move to Bag</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.savedRemoveBtn, { borderColor: colors.divider, backgroundColor: colors.surface }]}
                            onPress={() => handleRemoveItem(saved._id, "saved")}
                            disabled={isActionLoading}
                          >
                            <Trash2 size={14} color="#dc2626" style={{ marginRight: 4 }} />
                            <Text style={{ color: "#dc2626", fontSize: 12, fontWeight: "600" }}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* SECTION 3: Coupons & Promotions */}
        {cartItems.length > 0 && (
          <View style={[styles.couponCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <Tag size={16} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.couponCardTitle, { color: colors.title }]}>Apply Coupons & Discounts</Text>
            </View>

            <View style={styles.couponInputRow}>
              <TextInput
                style={[styles.couponInput, { backgroundColor: colors.surface, borderColor: colors.divider, color: colors.title }]}
                placeholder="Enter code (e.g. MYNTRA200)"
                placeholderTextColor={colors.sub}
                value={couponCode}
                onChangeText={setCouponCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[styles.applyCouponBtn, { backgroundColor: colors.primary }]}
                onPress={handleApplyCoupon}
              >
                <Text style={styles.applyCouponText}>APPLY</Text>
              </TouchableOpacity>
            </View>

            {appliedCoupon && (
              <View style={styles.appliedCouponPill}>
                <Sparkles size={14} color="#059669" />
                <Text style={styles.appliedCouponText}>
                  Coupon <Text style={{ fontWeight: "700" }}>{appliedCoupon}</Text> applied (-₹{couponDiscount})
                </Text>
                <TouchableOpacity onPress={() => { setAppliedCoupon(null); setCouponDiscount(0); }}>
                  <Text style={{ color: "#dc2626", fontSize: 11, fontWeight: "700", marginLeft: 8 }}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* SECTION 4: Smart Price & Tax Summary Breakdown */}
        {cartItems.length > 0 && (
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
            <Text style={[styles.summaryHeading, { color: colors.title }]}>Price Details ({summary.itemCount} items)</Text>

            <View style={styles.summaryLine}>
              <Text style={[styles.summaryLabel, { color: colors.sub }]}>Total MRP</Text>
              <Text style={[styles.summaryValue, { color: colors.title }]}>₹{(summary.originalTotal || 0).toLocaleString("en-IN")}</Text>
            </View>

            <View style={styles.summaryLine}>
              <Text style={[styles.summaryLabel, { color: colors.sub }]}>Discount on MRP</Text>
              <Text style={[styles.summaryValue, { color: "#059669" }]}>- ₹{(summary.totalDiscount || 0).toLocaleString("en-IN")}</Text>
            </View>

            {couponDiscount > 0 && (
              <View style={styles.summaryLine}>
                <Text style={[styles.summaryLabel, { color: "#059669" }]}>Coupon Discount ({appliedCoupon})</Text>
                <Text style={[styles.summaryValue, { color: "#059669" }]}>- ₹{couponDiscount.toLocaleString("en-IN")}</Text>
              </View>
            )}

            <View style={styles.summaryLine}>
              <Text style={[styles.summaryLabel, { color: colors.sub }]}>Estimated GST & Taxes (18%)</Text>
              <Text style={[styles.summaryValue, { color: colors.title }]}>₹{(summary.estimatedTax || 0).toLocaleString("en-IN")}</Text>
            </View>

            <View style={styles.summaryLine}>
              <Text style={[styles.summaryLabel, { color: colors.sub }]}>Shipping & Convenience Fee</Text>
              <Text style={[styles.summaryValue, { color: summary.shippingFee === 0 ? "#059669" : colors.title }]}>
                {summary.shippingFee === 0 ? "FREE" : `₹${summary.shippingFee}`}
              </Text>
            </View>

            <View style={[styles.summaryDivider, { backgroundColor: colors.divider }]} />

            <View style={styles.summaryGrandLine}>
              <Text style={[styles.grandLabel, { color: colors.title }]}>Total Payable</Text>
              <Text style={[styles.grandValue, { color: colors.primary }]}>₹{payableTotal.toLocaleString("en-IN")}</Text>
            </View>
          </View>
        )}

        {/* You May Also Like Section */}
        <RecommendationCarousel
          title="You Might Also Like"
          subtitle="Add more trendy styles before checking out"
          limit={6}
        />

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Sticky Bottom Checkout Footer */}
      {cartItems.length > 0 && (
        <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.divider }]}>
          <View>
            <Text style={[styles.footerTotalLabel, { color: colors.sub }]}>Total Payable</Text>
            <Text style={[styles.footerTotalValue, { color: colors.title }]}>₹{payableTotal.toLocaleString("en-IN")}</Text>
          </View>

          <TouchableOpacity
            style={[styles.checkoutBtn, { backgroundColor: colors.primary }]}
            onPress={handleProceedToCheckout}
            disabled={isActionLoading}
          >
            {isActionLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={styles.checkoutBtnText}>PROCEED TO CHECKOUT</Text>
                <ArrowRight size={16} color="#ffffff" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  headerSub: { fontSize: 12, marginTop: 2 },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerBadgeText: { fontSize: 11, fontWeight: "700" },
  content: { flex: 1, padding: 14 },
  freeShippingCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  freeShippingTitle: { fontSize: 12, fontWeight: "600", marginLeft: 6 },
  progressBarBg: { height: 6, borderRadius: 3, overflow: "hidden", marginTop: 4 },
  progressBarFill: { height: "100%", borderRadius: 3 },
  alertBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  alertTitle: { fontSize: 12, fontWeight: "700", marginBottom: 2 },
  alertDesc: { fontSize: 11, color: "#374151", lineHeight: 15 },
  sectionHeaderRow: {
    marginBottom: 10,
    marginTop: 4,
  },
  sectionHeading: { fontSize: 15, fontWeight: "700" },
  emptyState: {
    paddingTop: 60,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", marginBottom: 6, textAlign: "center" },
  emptySubtitle: { fontSize: 13, textAlign: "center", lineHeight: 18, marginBottom: 20 },
  loginButton: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 },
  loginButtonText: { color: "#fff", fontSize: 13, fontWeight: "700", letterSpacing: 0.5 },
  emptyCartCard: {
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 16,
  },
  emptyCartTitle: { fontSize: 15, fontWeight: "700", marginTop: 10, marginBottom: 4 },
  emptyCartSub: { fontSize: 12, textAlign: "center", marginBottom: 16, lineHeight: 16 },
  exploreBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  exploreBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  itemCard: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  itemImage: { width: 85, height: 110, borderRadius: 8 },
  itemDetails: { flex: 1, marginLeft: 12 },
  brandText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  titleText: { fontSize: 13, fontWeight: "500", marginVertical: 2 },
  variantRow: { flexDirection: "row", gap: 6, marginVertical: 4 },
  variantChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  variantChipText: { fontSize: 11 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  currentPrice: { fontSize: 14, fontWeight: "700" },
  originalPrice: { fontSize: 12, textDecorationLine: "line-through" },
  discountBadge: { backgroundColor: "#ecfdf5", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  discountBadgeText: { color: "#059669", fontSize: 10, fontWeight: "700" },
  outOfStockText: { color: "#dc2626", fontSize: 11, fontWeight: "700", marginTop: 2 },
  lowStockText: { color: "#d97706", fontSize: 11, fontWeight: "600", marginTop: 2 },
  actionsRow: { flexDirection: "row", alignItems: "center", marginTop: 10, gap: 8 },
  stepperContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 8 },
  stepperBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  stepperValue: { fontSize: 12, fontWeight: "700", paddingHorizontal: 6 },
  saveForLaterBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  saveForLaterText: { fontSize: 11, fontWeight: "600" },
  deleteIconBtn: { padding: 6, borderRadius: 8, marginLeft: "auto" },
  savedSection: { marginTop: 10, marginBottom: 14 },
  savedHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  savedSectionTitle: { fontSize: 14, fontWeight: "700" },
  savedItemsContainer: { marginTop: 8, gap: 8 },
  savedItemCard: { flexDirection: "row", padding: 10, borderRadius: 12, borderWidth: 1 },
  savedItemImage: { width: 70, height: 90, borderRadius: 8 },
  savedItemDetails: { flex: 1, marginLeft: 10 },
  variantSummary: { fontSize: 11, marginVertical: 2 },
  savedActionsRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  moveToBagBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  moveToBagText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  savedRemoveBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  couponCard: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  couponCardTitle: { fontSize: 13, fontWeight: "700" },
  couponInputRow: { flexDirection: "row", gap: 8 },
  couponInput: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12 },
  applyCouponBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, justifyContent: "center" },
  applyCouponText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  appliedCouponPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  appliedCouponText: { color: "#059669", fontSize: 11, flex: 1, marginLeft: 6 },
  summaryCard: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  summaryHeading: { fontSize: 14, fontWeight: "700", marginBottom: 12 },
  summaryLine: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  summaryLabel: { fontSize: 12 },
  summaryValue: { fontSize: 12, fontWeight: "600" },
  summaryDivider: { height: 1, marginVertical: 8 },
  summaryGrandLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  grandLabel: { fontSize: 14, fontWeight: "700" },
  grandValue: { fontSize: 16, fontWeight: "800" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    elevation: 10,
  },
  footerTotalLabel: { fontSize: 11 },
  footerTotalValue: { fontSize: 17, fontWeight: "800" },
  checkoutBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  checkoutBtnText: { color: "#fff", fontSize: 13, fontWeight: "700", letterSpacing: 0.5 },
});
