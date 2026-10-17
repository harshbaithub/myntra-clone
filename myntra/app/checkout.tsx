import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  useWindowDimensions,
  Platform,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import {
  CreditCard,
  MapPin,
  Truck,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ShoppingBag,
  Lock,
  Smartphone,
  Landmark,
  Banknote,
  Receipt,
  Check,
  ChevronRight,
  Package,
} from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/utils/api";
import DesktopNavbar from "@/components/DesktopNavbar";

type PaymentType = "Card" | "UPI" | "COD" | "NetBanking";

export default function Checkout() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Checkout Data States
  const [loading, setLoading] = useState(false);
  const [fetchingBag, setFetchingBag] = useState(true);
  const [bagItems, setBagItems] = useState<any[]>([]);
  const [bagSummary, setBagSummary] = useState<any>({
    rawSubtotal: 0,
    originalTotal: 0,
    totalDiscount: 0,
    shippingFee: 0,
    estimatedTax: 0,
    grandTotal: 0,
  });

  // Shipping Address Form State
  const [shippingAddress, setShippingAddress] = useState({
    name: user?.name || "Harsh Customer",
    phone: "9876543210",
    street: "123 Fashion Avenue, Tech Park",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560103",
  });

  // Payment Selection State
  const [paymentMethod, setPaymentMethod] = useState<PaymentType>("Card");
  const [cardDetails, setCardDetails] = useState({
    number: "4242 •••• •••• 4242",
    expiry: "12/28",
    cvv: "888",
    name: user?.name || "Cardholder Name",
  });
  const [upiId, setUpiId] = useState("harsh@okhdfcbank");
  const [netBank, setNetBank] = useState("HDFC Bank");

  // Post-Order Confirmation State
  const [orderConfirmed, setOrderConfirmed] = useState<any | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Fetch Cart Items & Financial Summary
  useEffect(() => {
    let isMounted = true;
    async function loadBagData() {
      if (!user?._id) {
        setFetchingBag(false);
        return;
      }
      try {
        setFetchingBag(true);
        const res = await api.get(`/bag/${user._id}`);
        if (isMounted && res.data) {
          setBagItems(res.data.cartItems || []);
          if (res.data.summary) {
            setBagSummary(res.data.summary);
          }
        }
      } catch (e) {
        console.error("Load checkout bag error:", e);
      } finally {
        if (isMounted) setFetchingBag(false);
      }
    }
    loadBagData();
    return () => {
      isMounted = false;
    };
  }, [user?._id]);

  // Place Order Handler
  const handlePlaceOrder = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (bagItems.length === 0 && !orderConfirmed) {
      Alert.alert(
        "Shopping Bag Empty",
        "Your bag is currently empty. Please add items before checking out.",
        [{ text: "Go to Bag", onPress: () => router.push("/(tabs)/bag") }]
      );
      return;
    }

    if (
      !shippingAddress.name.trim() ||
      !shippingAddress.street.trim() ||
      !shippingAddress.city.trim() ||
      !shippingAddress.pincode.trim()
    ) {
      Alert.alert("Incomplete Address", "Please fill in all shipping address fields.");
      return;
    }

    try {
      setLoading(true);
      const formattedAddress = `${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.pincode} (Recipient: ${shippingAddress.name}, Mobile: ${shippingAddress.phone})`;

      const res = await api.post(`/order/create/${user._id}`, {
        shippingAddress: formattedAddress,
        shippingAddressDetails: shippingAddress,
        paymentMethod: paymentMethod,
      });

      if (res.data && res.data.order) {
        setOrderConfirmed(res.data.order);
        setShowSuccessModal(true);
      } else {
        Alert.alert("Success", "Your order has been placed successfully!", [
          { text: "View Orders", onPress: () => router.replace("/orders") },
        ]);
      }
    } catch (error: any) {
      console.error("Order creation failed:", error);
      const errMsg =
        error.response?.data?.message ||
        error.message ||
        "Could not place order. Please try again.";
      Alert.alert("Checkout Error", errMsg);
    } finally {
      setLoading(false);
    }
  };

  const grandPayable = bagSummary.grandTotal || 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Top Navigation */}
      {isDesktop ? (
        <DesktopNavbar />
      ) : (
        <View
          style={[
            styles.header,
            { backgroundColor: colors.header, borderBottomColor: colors.headerBorder },
          ]}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={colors.title} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.title }]}>Secure Checkout</Text>
            <Text style={[styles.headerSub, { color: colors.sub }]}>
              Step 2 of 2 • 256-bit SSL Encrypted
            </Text>
          </View>
          <View style={[styles.sslBadge, { backgroundColor: colors.surface }]}>
            <ShieldCheck size={16} color="#05c49f" />
          </View>
        </View>
      )}

      {fetchingBag ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.sub }]}>
            Preparing secure checkout...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollInner,
            isDesktop && styles.desktopContainer,
          ]}
        >
          {/* Desktop Heading */}
          {isDesktop && (
            <View style={styles.desktopHeadingRow}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.desktopBackBtn}
              >
                <ArrowLeft size={20} color={colors.title} />
                <Text style={[styles.desktopBackText, { color: colors.title }]}>
                  Back to Shopping Bag
                </Text>
              </TouchableOpacity>
              <View style={styles.desktopSecurePill}>
                <ShieldCheck size={16} color="#05c49f" />
                <Text style={styles.desktopSecureText}>100% Safe & Verified Payment</Text>
              </View>
            </View>
          )}

          {/* Main 2-Column Split on Desktop */}
          <View style={isDesktop ? styles.desktopSplitLayout : styles.mobileLayout}>
            {/* LEFT COLUMN: Shipping Address + Payment Methods */}
            <View style={isDesktop ? styles.desktopLeftCol : styles.mobileCol}>
              {/* SECTION 1: Delivery Address */}
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.card, borderColor: colors.divider },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
                    <MapPin size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.cardTitle, { color: colors.title }]}>
                      Delivery Address
                    </Text>
                    <Text style={[styles.cardSubtitle, { color: colors.sub }]}>
                      Where should we deliver your order?
                    </Text>
                  </View>
                </View>

                <View style={styles.formGrid}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.sub }]}>Full Name</Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.inputBg,
                          borderColor: colors.inputBorder,
                          color: colors.text,
                        },
                      ]}
                      value={shippingAddress.name}
                      onChangeText={(val) =>
                        setShippingAddress({ ...shippingAddress, name: val })
                      }
                      placeholder="e.g. Harsh Kumar"
                      placeholderTextColor={colors.placeholderText}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.sub }]}>Mobile Phone</Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.inputBg,
                          borderColor: colors.inputBorder,
                          color: colors.text,
                        },
                      ]}
                      value={shippingAddress.phone}
                      onChangeText={(val) =>
                        setShippingAddress({ ...shippingAddress, phone: val })
                      }
                      placeholder="10-digit mobile number"
                      placeholderTextColor={colors.placeholderText}
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.sub }]}>
                      Street Address / House / Flat #
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.inputBg,
                          borderColor: colors.inputBorder,
                          color: colors.text,
                        },
                      ]}
                      value={shippingAddress.street}
                      onChangeText={(val) =>
                        setShippingAddress({ ...shippingAddress, street: val })
                      }
                      placeholder="e.g. 123 Fashion Avenue, Tech Park"
                      placeholderTextColor={colors.placeholderText}
                    />
                  </View>

                  <View style={styles.rowInputs}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={[styles.inputLabel, { color: colors.sub }]}>City</Text>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            backgroundColor: colors.inputBg,
                            borderColor: colors.inputBorder,
                            color: colors.text,
                          },
                        ]}
                        value={shippingAddress.city}
                        onChangeText={(val) =>
                          setShippingAddress({ ...shippingAddress, city: val })
                        }
                        placeholder="e.g. Bangalore"
                        placeholderTextColor={colors.placeholderText}
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={[styles.inputLabel, { color: colors.sub }]}>State</Text>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            backgroundColor: colors.inputBg,
                            borderColor: colors.inputBorder,
                            color: colors.text,
                          },
                        ]}
                        value={shippingAddress.state}
                        onChangeText={(val) =>
                          setShippingAddress({ ...shippingAddress, state: val })
                        }
                        placeholder="e.g. Karnataka"
                        placeholderTextColor={colors.placeholderText}
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={[styles.inputLabel, { color: colors.sub }]}>PIN Code</Text>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            backgroundColor: colors.inputBg,
                            borderColor: colors.inputBorder,
                            color: colors.text,
                          },
                        ]}
                        value={shippingAddress.pincode}
                        onChangeText={(val) =>
                          setShippingAddress({ ...shippingAddress, pincode: val })
                        }
                        placeholder="560103"
                        placeholderTextColor={colors.placeholderText}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* SECTION 2: Payment Method */}
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.card, borderColor: colors.divider, marginTop: 16 },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
                    <CreditCard size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.cardTitle, { color: colors.title }]}>
                      Payment Method
                    </Text>
                    <Text style={[styles.cardSubtitle, { color: colors.sub }]}>
                      Choose your preferred payment gateway
                    </Text>
                  </View>
                </View>

                {/* Payment Options Grid */}
                <View style={styles.paymentOptionsList}>
                  {/* Card Option */}
                  <TouchableOpacity
                    style={[
                      styles.paymentOptionCard,
                      {
                        backgroundColor:
                          paymentMethod === "Card" ? colors.primaryLight : colors.surface,
                        borderColor:
                          paymentMethod === "Card" ? colors.primary : colors.divider,
                      },
                    ]}
                    onPress={() => setPaymentMethod("Card")}
                    activeOpacity={0.8}
                  >
                    <View style={styles.optionRadioRow}>
                      <View
                        style={[
                          styles.radioOuter,
                          {
                            borderColor:
                              paymentMethod === "Card" ? colors.primary : colors.sub,
                          },
                        ]}
                      >
                        {paymentMethod === "Card" && (
                          <View
                            style={[
                              styles.radioInner,
                              { backgroundColor: colors.primary },
                            ]}
                          />
                        )}
                      </View>
                      <CreditCard size={20} color={colors.primary} style={{ marginLeft: 8 }} />
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={[styles.optionTitle, { color: colors.title }]}>
                          Credit / Debit Card
                        </Text>
                        <Text style={[styles.optionSub, { color: colors.sub }]}>
                          Visa, MasterCard, RuPay, Maestro
                        </Text>
                      </View>
                      <View style={styles.badgeFree}>
                        <Text style={styles.badgeFreeText}>INSTANT</Text>
                      </View>
                    </View>

                    {paymentMethod === "Card" && (
                      <View style={styles.methodFieldsContainer}>
                        <View style={styles.inputGroup}>
                          <Text style={[styles.inputLabel, { color: colors.sub }]}>
                            Card Number
                          </Text>
                          <TextInput
                            style={[
                              styles.input,
                              {
                                backgroundColor: colors.card,
                                borderColor: colors.inputBorder,
                                color: colors.text,
                              },
                            ]}
                            value={cardDetails.number}
                            onChangeText={(t) =>
                              setCardDetails({ ...cardDetails, number: t })
                            }
                            placeholder="4242 •••• •••• 4242"
                            placeholderTextColor={colors.placeholderText}
                          />
                        </View>
                        <View style={styles.rowInputs}>
                          <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={[styles.inputLabel, { color: colors.sub }]}>
                              Valid Thru (MM/YY)
                            </Text>
                            <TextInput
                              style={[
                                styles.input,
                                {
                                  backgroundColor: colors.card,
                                  borderColor: colors.inputBorder,
                                  color: colors.text,
                                },
                              ]}
                              value={cardDetails.expiry}
                              onChangeText={(t) =>
                                setCardDetails({ ...cardDetails, expiry: t })
                              }
                              placeholder="12/28"
                              placeholderTextColor={colors.placeholderText}
                            />
                          </View>
                          <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={[styles.inputLabel, { color: colors.sub }]}>CVV</Text>
                            <TextInput
                              style={[
                                styles.input,
                                {
                                  backgroundColor: colors.card,
                                  borderColor: colors.inputBorder,
                                  color: colors.text,
                                },
                              ]}
                              value={cardDetails.cvv}
                              onChangeText={(t) =>
                                setCardDetails({ ...cardDetails, cvv: t })
                              }
                              placeholder="888"
                              placeholderTextColor={colors.placeholderText}
                              secureTextEntry
                            />
                          </View>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* UPI Option */}
                  <TouchableOpacity
                    style={[
                      styles.paymentOptionCard,
                      {
                        backgroundColor:
                          paymentMethod === "UPI" ? colors.primaryLight : colors.surface,
                        borderColor:
                          paymentMethod === "UPI" ? colors.primary : colors.divider,
                      },
                    ]}
                    onPress={() => setPaymentMethod("UPI")}
                    activeOpacity={0.8}
                  >
                    <View style={styles.optionRadioRow}>
                      <View
                        style={[
                          styles.radioOuter,
                          {
                            borderColor:
                              paymentMethod === "UPI" ? colors.primary : colors.sub,
                          },
                        ]}
                      >
                        {paymentMethod === "UPI" && (
                          <View
                            style={[
                              styles.radioInner,
                              { backgroundColor: colors.primary },
                            ]}
                          />
                        )}
                      </View>
                      <Smartphone size={20} color="#05c49f" style={{ marginLeft: 8 }} />
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={[styles.optionTitle, { color: colors.title }]}>
                          UPI (Google Pay / PhonePe / Paytm)
                        </Text>
                        <Text style={[styles.optionSub, { color: colors.sub }]}>
                          Pay directly via UPI ID or QR Code
                        </Text>
                      </View>
                      <View style={[styles.badgeFree, { backgroundColor: "#ecfdf5" }]}>
                        <Text style={[styles.badgeFreeText, { color: "#05c49f" }]}>
                          0% FEE
                        </Text>
                      </View>
                    </View>

                    {paymentMethod === "UPI" && (
                      <View style={styles.methodFieldsContainer}>
                        <View style={styles.inputGroup}>
                          <Text style={[styles.inputLabel, { color: colors.sub }]}>
                            Enter UPI Virtual Address
                          </Text>
                          <TextInput
                            style={[
                              styles.input,
                              {
                                backgroundColor: colors.card,
                                borderColor: colors.inputBorder,
                                color: colors.text,
                              },
                            ]}
                            value={upiId}
                            onChangeText={setUpiId}
                            placeholder="username@okhdfcbank"
                            placeholderTextColor={colors.placeholderText}
                            autoCapitalize="none"
                          />
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* COD Option */}
                  <TouchableOpacity
                    style={[
                      styles.paymentOptionCard,
                      {
                        backgroundColor:
                          paymentMethod === "COD" ? colors.primaryLight : colors.surface,
                        borderColor:
                          paymentMethod === "COD" ? colors.primary : colors.divider,
                      },
                    ]}
                    onPress={() => setPaymentMethod("COD")}
                    activeOpacity={0.8}
                  >
                    <View style={styles.optionRadioRow}>
                      <View
                        style={[
                          styles.radioOuter,
                          {
                            borderColor:
                              paymentMethod === "COD" ? colors.primary : colors.sub,
                          },
                        ]}
                      >
                        {paymentMethod === "COD" && (
                          <View
                            style={[
                              styles.radioInner,
                              { backgroundColor: colors.primary },
                            ]}
                          />
                        )}
                      </View>
                      <Banknote size={20} color="#d97706" style={{ marginLeft: 8 }} />
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={[styles.optionTitle, { color: colors.title }]}>
                          Cash on Delivery (COD)
                        </Text>
                        <Text style={[styles.optionSub, { color: colors.sub }]}>
                          Pay with cash or QR code upon delivery
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* NetBanking Option */}
                  <TouchableOpacity
                    style={[
                      styles.paymentOptionCard,
                      {
                        backgroundColor:
                          paymentMethod === "NetBanking"
                            ? colors.primaryLight
                            : colors.surface,
                        borderColor:
                          paymentMethod === "NetBanking" ? colors.primary : colors.divider,
                      },
                    ]}
                    onPress={() => setPaymentMethod("NetBanking")}
                    activeOpacity={0.8}
                  >
                    <View style={styles.optionRadioRow}>
                      <View
                        style={[
                          styles.radioOuter,
                          {
                            borderColor:
                              paymentMethod === "NetBanking" ? colors.primary : colors.sub,
                          },
                        ]}
                      >
                        {paymentMethod === "NetBanking" && (
                          <View
                            style={[
                              styles.radioInner,
                              { backgroundColor: colors.primary },
                            ]}
                          />
                        )}
                      </View>
                      <Landmark size={20} color="#3b82f6" style={{ marginLeft: 8 }} />
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={[styles.optionTitle, { color: colors.title }]}>
                          Net Banking
                        </Text>
                        <Text style={[styles.optionSub, { color: colors.sub }]}>
                          All Major Indian Banks Supported
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Delivery Speed Card */}
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.card, borderColor: colors.divider, marginTop: 16 },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconWrap, { backgroundColor: "#ecfdf5" }]}>
                    <Truck size={18} color="#05c49f" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.cardTitle, { color: colors.title }]}>
                      Express Guaranteed Delivery
                    </Text>
                    <Text style={[styles.cardSubtitle, { color: "#05c49f" }]}>
                      Dispatched within 24 hours via Priority Air Courier
                    </Text>
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#05c49f" }}>
                    FREE
                  </Text>
                </View>
              </View>
            </View>

            {/* RIGHT COLUMN: Order Summary & Place Order */}
            <View style={isDesktop ? styles.desktopRightCol : styles.mobileCol}>
              {/* Order Items Preview */}
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.card, borderColor: colors.divider },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
                    <ShoppingBag size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.cardTitle, { color: colors.title }]}>
                      Order Items ({bagItems.length})
                    </Text>
                  </View>
                </View>

                {bagItems.length === 0 ? (
                  <Text style={[styles.emptyCartNotice, { color: colors.sub }]}>
                    No items in bag.
                  </Text>
                ) : (
                  <View style={styles.orderItemsList}>
                    {bagItems.map((item: any) => {
                      const prod = item.productId || {};
                      const imgUri =
                        (Array.isArray(prod.images) ? prod.images[0] : prod.images) ||
                        prod.image ||
                        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500";
                      return (
                        <View
                          key={item._id}
                          style={[
                            styles.orderItemRow,
                            { borderBottomColor: colors.divider },
                          ]}
                        >
                          <Image
                            source={{ uri: imgUri }}
                            style={[styles.orderItemThumb, { backgroundColor: colors.surface }]}
                          />
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text
                              style={[styles.orderItemBrand, { color: colors.primary }]}
                            >
                              {prod.brand || "MYNTRA"}
                            </Text>
                            <Text
                              style={[styles.orderItemTitle, { color: colors.title }]}
                              numberOfLines={1}
                            >
                              {prod.name || prod.title}
                            </Text>
                            <Text style={[styles.orderItemMeta, { color: colors.sub }]}>
                              Size: {item.size || "M"} • Qty: {item.quantity || 1}
                            </Text>
                          </View>
                          <Text style={[styles.orderItemPrice, { color: colors.title }]}>
                            ₹{((prod.price || 0) * (item.quantity || 1)).toLocaleString("en-IN")}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Price Details Card */}
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.card, borderColor: colors.divider, marginTop: 16 },
                ]}
              >
                <Text style={[styles.cardTitle, { color: colors.title, marginBottom: 12 }]}>
                  Price Details
                </Text>

                <View style={styles.summaryLine}>
                  <Text style={[styles.summaryLabel, { color: colors.sub }]}>
                    Total Item MRP
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.title }]}>
                    ₹{(bagSummary.originalTotal || bagSummary.rawSubtotal || 0).toLocaleString("en-IN")}
                  </Text>
                </View>

                {bagSummary.totalDiscount > 0 && (
                  <View style={styles.summaryLine}>
                    <Text style={[styles.summaryLabel, { color: colors.sub }]}>
                      Discount on MRP
                    </Text>
                    <Text style={[styles.summaryValue, { color: "#05c49f" }]}>
                      - ₹{(bagSummary.totalDiscount || 0).toLocaleString("en-IN")}
                    </Text>
                  </View>
                )}

                <View style={styles.summaryLine}>
                  <Text style={[styles.summaryLabel, { color: colors.sub }]}>
                    Estimated GST & Taxes (18%)
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.title }]}>
                    ₹{(bagSummary.estimatedTax || 0).toLocaleString("en-IN")}
                  </Text>
                </View>

                <View style={styles.summaryLine}>
                  <Text style={[styles.summaryLabel, { color: colors.sub }]}>
                    Delivery & Convenience
                  </Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { color: bagSummary.shippingFee === 0 ? "#05c49f" : colors.title },
                    ]}
                  >
                    {bagSummary.shippingFee === 0 ? "FREE" : `₹${bagSummary.shippingFee}`}
                  </Text>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.divider }]} />

                <View style={styles.grandTotalRow}>
                  <View>
                    <Text style={[styles.grandTotalLabel, { color: colors.title }]}>
                      Total Amount
                    </Text>
                    <Text style={[styles.grandTotalSub, { color: colors.sub }]}>
                      Inclusive of all taxes
                    </Text>
                  </View>
                  <Text style={[styles.grandTotalValue, { color: colors.primary }]}>
                    ₹{grandPayable.toLocaleString("en-IN")}
                  </Text>
                </View>

                {/* Confirm & Place Order CTA */}
                <TouchableOpacity
                  style={[styles.placeOrderBtn, { backgroundColor: colors.primary }]}
                  onPress={handlePlaceOrder}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Lock size={16} color="#ffffff" />
                      <Text style={styles.placeOrderBtnText}>
                        CONFIRM & PLACE ORDER • ₹{grandPayable.toLocaleString("en-IN")}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={styles.trustBadgeRow}>
                  <ShieldCheck size={14} color={colors.sub} />
                  <Text style={[styles.trustBadgeText, { color: colors.sub }]}>
                    Safe & Secure Payments • Easy 14-Day Returns • 100% Authentic
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      )}

      {/* ========================================================= */}
      {/* ORDER CONFIRMED SUCCESS CELEBRATION MODAL                 */}
      {/* ========================================================= */}
      <Modal
        visible={showSuccessModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setShowSuccessModal(false);
          router.replace("/orders");
        }}
      >
        <View style={styles.successModalOverlay}>
          <View
            style={[
              styles.successModalCard,
              { backgroundColor: colors.card, borderColor: colors.divider },
            ]}
          >
            {/* Top Celebration Icon */}
            <View style={[styles.successIconCircle, { backgroundColor: "#ecfdf5" }]}>
              <CheckCircle2 size={54} color="#05c49f" />
            </View>

            <Text style={[styles.successTitle, { color: colors.title }]}>
              Order Confirmed! 🎉
            </Text>
            <Text style={[styles.successSubtitle, { color: colors.sub }]}>
              Thank you for shopping with Myntra. Your order has been placed successfully and has been sent for packaging!
            </Text>

            {/* Receipt Details Box */}
            <View
              style={[
                styles.receiptBox,
                { backgroundColor: colors.surface, borderColor: colors.divider },
              ]}
            >
              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.sub }]}>Invoice Number:</Text>
                <Text style={[styles.receiptValueBold, { color: colors.title }]}>
                  {orderConfirmed?.invoiceNumber || "INV-2026-CONFIRMED"}
                </Text>
              </View>

              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.sub }]}>Transaction ID:</Text>
                <Text style={[styles.receiptValue, { color: colors.sub }]}>
                  {orderConfirmed?.paymentDetails?.transactionId || "TXN-VERIFIED-OK"}
                </Text>
              </View>

              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.sub }]}>Payment Status:</Text>
                <View style={styles.paidBadge}>
                  <Check size={12} color="#05c49f" style={{ marginRight: 4 }} />
                  <Text style={styles.paidBadgeText}>
                    {orderConfirmed?.paymentDetails?.status || "Success"} (
                    {orderConfirmed?.paymentMethod || paymentMethod})
                  </Text>
                </View>
              </View>

              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.sub }]}>Total Amount Paid:</Text>
                <Text style={[styles.receiptTotalValue, { color: colors.primary }]}>
                  ₹{(orderConfirmed?.total || grandPayable).toLocaleString("en-IN")}
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.divider, marginVertical: 8 }]} />

              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.sub }]}>Estimated Delivery:</Text>
                <Text style={[styles.receiptValueBold, { color: "#05c49f" }]}>
                  Within 2 to 3 Business Days
                </Text>
              </View>

              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.sub }]}>Deliver To:</Text>
                <Text
                  style={[styles.receiptValue, { color: colors.title, flex: 1, textAlign: "right" }]}
                  numberOfLines={2}
                >
                  {shippingAddress.street}, {shippingAddress.city}
                </Text>
              </View>
            </View>

            {/* Notification alert toast */}
            <View style={[styles.notificationPill, { backgroundColor: colors.primaryLight }]}>
              <Package size={16} color={colors.primary} />
              <Text style={[styles.notificationPillText, { color: colors.primary }]}>
                Order confirmation email & SMS notification dispatched!
              </Text>
            </View>

            {/* CTA Buttons */}
            <View style={styles.successActionsCol}>
              <TouchableOpacity
                style={[styles.viewOrdersBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setShowSuccessModal(false);
                  router.replace("/orders");
                }}
              >
                <Receipt size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.viewOrdersBtnText}>
                  VIEW IN ORDERS & TRANSACTIONS
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.continueShoppingBtn,
                  { borderColor: colors.divider, backgroundColor: colors.surface },
                ]}
                onPress={() => {
                  setShowSuccessModal(false);
                  router.replace("/(tabs)");
                }}
              >
                <Text style={[styles.continueShoppingText, { color: colors.title }]}>
                  Continue Shopping
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: Platform.OS === "web" ? 16 : 50,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerSub: {
    fontSize: 11,
    marginTop: 2,
  },
  sslBadge: {
    padding: 8,
    borderRadius: 8,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
  },
  content: {
    flex: 1,
  },
  scrollInner: {
    padding: 16,
  },
  desktopContainer: {
    maxWidth: 1160,
    width: "100%",
    alignSelf: "center",
    paddingVertical: 24,
  },
  desktopHeadingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  desktopBackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  desktopBackText: {
    fontSize: 14,
    fontWeight: "600",
  },
  desktopSecurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  desktopSecureText: {
    color: "#05c49f",
    fontSize: 12,
    fontWeight: "700",
  },
  desktopSplitLayout: {
    flexDirection: "row",
    gap: 24,
    alignItems: "flex-start",
  },
  mobileLayout: {
    flexDirection: "column",
  },
  desktopLeftCol: {
    flex: 1.5,
  },
  desktopRightCol: {
    flex: 1,
  },
  mobileCol: {
    width: "100%",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  formGrid: {
    gap: 12,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  rowInputs: {
    flexDirection: "row",
    gap: 10,
  },
  paymentOptionsList: {
    gap: 12,
  },
  paymentOptionCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
  },
  optionRadioRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  optionSub: {
    fontSize: 11,
    marginTop: 2,
  },
  badgeFree: {
    backgroundColor: "#ffe8ee",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeFreeText: {
    color: "#ff3f6c",
    fontSize: 10,
    fontWeight: "700",
  },
  methodFieldsContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
    gap: 10,
  },
  orderItemsList: {
    gap: 10,
  },
  orderItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  orderItemThumb: {
    width: 48,
    height: 60,
    borderRadius: 6,
  },
  orderItemBrand: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  orderItemTitle: {
    fontSize: 13,
    fontWeight: "500",
    marginVertical: 2,
  },
  orderItemMeta: {
    fontSize: 11,
  },
  orderItemPrice: {
    fontSize: 13,
    fontWeight: "700",
  },
  emptyCartNotice: {
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 12,
  },
  summaryLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: "800",
  },
  grandTotalSub: {
    fontSize: 11,
    marginTop: 2,
  },
  grandTotalValue: {
    fontSize: 22,
    fontWeight: "900",
  },
  placeOrderBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ff3f6c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  placeOrderBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  trustBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
  },
  trustBadgeText: {
    fontSize: 10,
    textAlign: "center",
  },
  /* SUCCESS MODAL STYLES */
  successModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  successModalCard: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 18,
  },
  receiptBox: {
    width: "100%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    gap: 8,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  receiptLabel: {
    fontSize: 12,
  },
  receiptValue: {
    fontSize: 12,
    fontWeight: "500",
  },
  receiptValueBold: {
    fontSize: 13,
    fontWeight: "700",
  },
  receiptTotalValue: {
    fontSize: 16,
    fontWeight: "900",
  },
  paidBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  paidBadgeText: {
    color: "#05c49f",
    fontSize: 11,
    fontWeight: "700",
  },
  notificationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 18,
    width: "100%",
  },
  notificationPillText: {
    fontSize: 11,
    fontWeight: "600",
    flex: 1,
  },
  successActionsCol: {
    width: "100%",
    gap: 10,
  },
  viewOrdersBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
  },
  viewOrdersBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  continueShoppingBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  continueShoppingText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
