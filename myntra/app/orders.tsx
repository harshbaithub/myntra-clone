import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  Platform,
  RefreshControl,
  Share,
} from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
  Package,
  MapPin,
  Truck,
  CreditCard,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  FileText,
  RotateCcw,
  XCircle,
  CheckCircle2,
  Clock,
  Download,
  Receipt,
  X,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowUpDown,
  ShoppingBag,
  ExternalLink,
} from "lucide-react-native";
import { api, API_BASE_URL } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

type OrderStatus =
  | "ALL"
  | "Processing"
  | "Confirmed"
  | "Shipped"
  | "In Transit"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled"
  | "Return Requested"
  | "Returned";

export default function Orders() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();

  // Primary states
  const [activeTab, setActiveTab] = useState<"orders" | "transactions">("orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>("ALL");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [dateFilter, setDateFilter] = useState<"ALL" | "30DAYS" | "6MONTHS" | "THIS_YEAR">("ALL");

  // Modals
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [cancelModalOrder, setCancelModalOrder] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState("Changed my mind");
  const [returnModalOrder, setReturnModalOrder] = useState<any | null>(null);
  const [returnReason, setReturnReason] = useState("Size / Fit issue");
  const [invoiceModalOrder, setInvoiceModalOrder] = useState<any | null>(null);

  // Date range calculations
  const dateRangeParams = useMemo(() => {
    if (dateFilter === "ALL") return {};
    const now = new Date();
    if (dateFilter === "30DAYS") {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { startDate: past.toISOString() };
    }
    if (dateFilter === "6MONTHS") {
      const past = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      return { startDate: past.toISOString() };
    }
    if (dateFilter === "THIS_YEAR") {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return { startDate: startOfYear.toISOString() };
    }
    return {};
  }, [dateFilter]);

  // Fetch Orders with server pagination & filters
  const fetchOrders = useCallback(
    async (pageNumber = 1, showFullLoader = false) => {
      if (!user?._id) {
        setIsLoading(false);
        return;
      }
      try {
        if (showFullLoader) setIsLoading(true);
        const params: any = {
          page: pageNumber,
          limit: 10,
          sortBy,
          sortOrder,
          ...dateRangeParams,
        };

        if (selectedStatus !== "ALL") params.status = selectedStatus;
        if (selectedPaymentMethod !== "ALL") params.paymentMethod = selectedPaymentMethod;
        if (searchQuery.trim()) params.search = searchQuery.trim();

        const res = await api.get(`/order/history/${user._id}`, { params });
        if (res.data) {
          setOrders(res.data.orders || []);
          setPagination(res.data.pagination || {});
        }
      } catch (error) {
        console.error("Fetch orders error:", error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user?._id, selectedStatus, selectedPaymentMethod, sortBy, sortOrder, dateRangeParams, searchQuery]
  );

  // Fetch Transactions Audit Log
  const fetchTransactions = useCallback(async () => {
    if (!user?._id) return;
    try {
      const res = await api.get(`/order/transactions/${user._id}`);
      if (res.data) {
        setTransactions(res.data.transactions || []);
      }
    } catch (e) {
      console.error("Fetch transactions error:", e);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchOrders(1, true);
    if (activeTab === "transactions") {
      fetchTransactions();
    }
  }, [fetchOrders, activeTab, fetchTransactions]);

  const onRefresh = () => {
    setIsRefreshing(true);
    if (activeTab === "orders") {
      fetchOrders(1, false);
    } else {
      fetchTransactions().then(() => setIsRefreshing(false));
    }
  };

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  // 1-Click Reorder Action
  const handleReorder = async (orderId: string) => {
    try {
      setIsActionLoading(true);
      const res = await api.post(`/order/reorder/${orderId}`);
      Alert.alert(
        "Reorder Successful! 🛍️",
        res.data?.message || "Items have been re-added to your bag.",
        [
          { text: "Continue Shopping", style: "cancel" },
          {
            text: "View Bag",
            onPress: () => router.push("/(tabs)/bag"),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert("Reorder Failed", err.response?.data?.message || "Could not reorder items.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Cancel Order Action
  const handleCancelOrder = async () => {
    if (!cancelModalOrder) return;
    try {
      setIsActionLoading(true);
      const res = await api.post(`/order/cancel/${cancelModalOrder._id}`, {
        reason: cancelReason,
      });
      setCancelModalOrder(null);
      Alert.alert("Order Cancelled", res.data?.message || "Your order has been cancelled.");
      fetchOrders(pagination.currentPage || 1, false);
    } catch (err: any) {
      Alert.alert("Cancellation Error", err.response?.data?.message || "Could not cancel order.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Return Order Action
  const handleReturnOrder = async () => {
    if (!returnModalOrder) return;
    try {
      setIsActionLoading(true);
      const res = await api.post(`/order/return/${returnModalOrder._id}`, {
        reason: returnReason,
        pickupAddress: returnModalOrder.shippingAddress,
      });
      setReturnModalOrder(null);
      Alert.alert("Return Requested", res.data?.message || "Return request submitted.");
      fetchOrders(pagination.currentPage || 1, false);
    } catch (err: any) {
      Alert.alert("Return Error", err.response?.data?.message || "Could not process return.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Download / View Invoice
  const handleViewInvoice = async (order: any) => {
    const invoiceUrl = `${API_BASE_URL}/order/invoice/${order._id}`;
    if (Platform.OS === "web") {
      window.open(invoiceUrl, "_blank");
    } else {
      try {
        await WebBrowser.openBrowserAsync(invoiceUrl);
      } catch (e) {
        setInvoiceModalOrder(order);
      }
    }
  };

  // Status Badge Colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return { bg: "#ecfdf5", text: "#059669", border: "#a7f3d0" };
      case "Shipped":
      case "In Transit":
      case "Out for Delivery":
        return { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" };
      case "Processing":
      case "Confirmed":
        return { bg: "#fef3c7", text: "#d97706", border: "#fde68a" };
      case "Cancelled":
        return { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" };
      case "Return Requested":
      case "Returned":
        return { bg: "#faf5ff", text: "#9333ea", border: "#e9d5ff" };
      default:
        return { bg: colors.surface, text: colors.sub, border: colors.divider };
    }
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.headerBorder }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.title} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.title }]}>Orders & Transactions</Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconCircle, { backgroundColor: colors.primaryLight }]}>
            <Package size={48} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.title }]}>Please login to view your orders</Text>
          <Text style={[styles.emptySubtitle, { color: colors.sub }]}>
            Access past purchases, download invoices, track real-time delivery, and manage returns.
          </Text>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.actionButtonText}>LOGIN TO ACCOUNT</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.headerBorder }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.title} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.title }]}>Orders & Transactions</Text>
          <Text style={[styles.headerSub, { color: colors.sub }]}>
            {pagination.totalOrders || 0} purchases placed
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.filterIconButton, { backgroundColor: colors.surface, borderColor: colors.divider }]}
          onPress={() => setFilterModalVisible(true)}
        >
          <Filter size={18} color={colors.title} />
        </TouchableOpacity>
      </View>

      {/* View Selector Tabs (Orders vs Transactions) */}
      <View style={[styles.tabBar, { backgroundColor: colors.header, borderBottomColor: colors.headerBorder }]}>
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === "orders" && [styles.activeTabItem, { borderBottomColor: colors.primary }],
          ]}
          onPress={() => setActiveTab("orders")}
        >
          <Package size={16} color={activeTab === "orders" ? colors.primary : colors.sub} />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "orders" ? colors.primary : colors.sub },
              activeTab === "orders" && { fontWeight: "700" },
            ]}
          >
            Order History
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === "transactions" && [styles.activeTabItem, { borderBottomColor: colors.primary }],
          ]}
          onPress={() => setActiveTab("transactions")}
        >
          <Receipt size={16} color={activeTab === "transactions" ? colors.primary : colors.sub} />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "transactions" ? colors.primary : colors.sub },
              activeTab === "transactions" && { fontWeight: "700" },
            ]}
          >
            Transactions Audit
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "orders" ? (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
          {/* Search Bar */}
          <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.divider }]}>
            <Search size={18} color={colors.sub} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: colors.title }]}
              placeholder="Search by invoice, item, or tracking #"
              placeholderTextColor={colors.sub}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => fetchOrders(1, true)}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(""); fetchOrders(1, true); }}>
                <X size={16} color={colors.sub} />
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Status Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.statusChipsScroll}
            contentContainerStyle={styles.statusChipsContainer}
          >
            {(["ALL", "Processing", "Shipped", "In Transit", "Delivered", "Cancelled", "Returned"] as OrderStatus[]).map(
              (st) => {
                const isSelected = selectedStatus === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.statusChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.divider,
                      },
                    ]}
                    onPress={() => {
                      setSelectedStatus(st);
                    }}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        { color: isSelected ? "#ffffff" : colors.sub },
                        isSelected && { fontWeight: "700" },
                      ]}
                    >
                      {st === "ALL" ? "All Orders" : st}
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </ScrollView>

          {/* Active Filter Indicators */}
          {(selectedPaymentMethod !== "ALL" || dateFilter !== "ALL" || searchQuery) && (
            <View style={styles.activeFiltersRow}>
              <Text style={[styles.activeFilterLabel, { color: colors.sub }]}>Filters applied:</Text>
              {selectedPaymentMethod !== "ALL" && (
                <View style={[styles.filterTag, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.filterTagText, { color: colors.primary }]}>{selectedPaymentMethod}</Text>
                  <TouchableOpacity onPress={() => setSelectedPaymentMethod("ALL")}>
                    <X size={12} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
              {dateFilter !== "ALL" && (
                <View style={[styles.filterTag, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.filterTagText, { color: colors.primary }]}>{dateFilter}</Text>
                  <TouchableOpacity onPress={() => setDateFilter("ALL")}>
                    <X size={12} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity
                onPress={() => {
                  setSelectedPaymentMethod("ALL");
                  setDateFilter("ALL");
                  setSearchQuery("");
                }}
              >
                <Text style={[styles.clearAllText, { color: colors.primary }]}>Reset</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Orders List / Empty State */}
          {isLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.sub }]}>Fetching order records...</Text>
            </View>
          ) : orders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: colors.surface }]}>
                <Package size={48} color={colors.sub} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.title }]}>No matching orders found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.sub }]}>
                {searchQuery || selectedStatus !== "ALL"
                  ? "Try resetting filters or searching with another keyword."
                  : "Explore our latest collection and make your first order!"}
              </Text>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/(tabs)/categories")}
              >
                <Text style={styles.actionButtonText}>EXPLORE TRENDING ITEMS</Text>
              </TouchableOpacity>
            </View>
          ) : (
            orders.map((order) => {
              const isExpanded = expandedOrder === order._id;
              const statusStyle = getStatusColor(order.status || "Processing");
              const orderDateStr = order.date
                ? new Date(order.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Recent";
              const isCancellable = ["Processing", "Confirmed"].includes(order.status);
              const isReturnable = order.status === "Delivered" && !order.returnRequest?.isRequested;

              return (
                <View
                  key={order._id}
                  style={[
                    styles.orderCard,
                    { backgroundColor: colors.card, borderColor: colors.divider },
                  ]}
                >
                  {/* Top Bar: Invoice # + Status Badge */}
                  <TouchableOpacity
                    style={[styles.orderHeader, { borderBottomColor: colors.divider }]}
                    onPress={() => toggleOrderDetails(order._id)}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <FileText size={14} color={colors.primary} />
                        <Text style={[styles.invoiceText, { color: colors.title }]} numberOfLines={1}>
                          {order.invoiceNumber || `INV-${order._id.substring(0, 8).toUpperCase()}`}
                        </Text>
                      </View>
                      <Text style={[styles.orderDate, { color: colors.sub }]}>
                        Placed on {orderDateStr} • {order.items?.length || 0} item(s)
                      </Text>
                    </View>

                    <View style={styles.statusRow}>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: statusStyle.bg,
                            borderColor: statusStyle.border,
                            borderWidth: 1,
                          },
                        ]}
                      >
                        <Text style={[styles.orderStatus, { color: statusStyle.text }]}>
                          {order.status || "Processing"}
                        </Text>
                      </View>
                      {isExpanded ? (
                        <ChevronUp size={20} color={colors.arrow} />
                      ) : (
                        <ChevronDown size={20} color={colors.arrow} />
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Order Items Preview */}
                  <View style={styles.itemsContainer}>
                    {(order.items || []).map((item: any, idx: number) => {
                      const prod = item.productId || {};
                      const title = item.title || prod.name || prod.title || "Fashion Apparel";
                      const brand = item.brand || prod.brand || "Myntra Collection";
                      const imageUri =
                        item.image ||
                        (Array.isArray(prod.images) ? prod.images[0] : prod.images) ||
                        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500";

                      return (
                        <View key={item._id || idx} style={styles.orderItem}>
                          <Image
                            source={{ uri: imageUri }}
                            style={[styles.itemImage, { backgroundColor: colors.surface }]}
                          />
                          <View style={styles.itemInfo}>
                            <Text style={[styles.brandName, { color: colors.primary }]}>{brand}</Text>
                            <Text style={[styles.itemName, { color: colors.title }]} numberOfLines={1}>
                              {title}
                            </Text>
                            <View style={styles.itemMetaRow}>
                              <Text style={[styles.itemMetaText, { color: colors.sub }]}>
                                Size: <Text style={{ color: colors.title, fontWeight: "600" }}>{item.size || "M"}</Text>
                              </Text>
                              <Text style={[styles.itemMetaText, { color: colors.sub }]}>
                                Qty: <Text style={{ color: colors.title, fontWeight: "600" }}>{item.quantity || 1}</Text>
                              </Text>
                              <Text style={[styles.itemPrice, { color: colors.title }]}>
                                ₹{(item.price || prod.price || 0).toLocaleString("en-IN")}
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  {/* Order Total & Quick Action Footer */}
                  <View style={[styles.cardFooter, { borderTopColor: colors.divider, backgroundColor: colors.surface }]}>
                    <View>
                      <Text style={[styles.totalLabel, { color: colors.sub }]}>Total Amount</Text>
                      <Text style={[styles.totalValue, { color: colors.title }]}>
                        ₹{(order.total || 0).toLocaleString("en-IN")}
                      </Text>
                    </View>

                    <View style={styles.actionButtonGroup}>
                      {/* 1-Click Reorder Button */}
                      <TouchableOpacity
                        style={[styles.reorderBtn, { backgroundColor: colors.primary }]}
                        onPress={() => handleReorder(order._id)}
                        disabled={isActionLoading}
                      >
                        <RotateCcw size={14} color="#ffffff" style={{ marginRight: 4 }} />
                        <Text style={styles.reorderBtnText}>Reorder</Text>
                      </TouchableOpacity>

                      {/* PDF Invoice Button */}
                      <TouchableOpacity
                        style={[styles.invoiceBtn, { borderColor: colors.divider, backgroundColor: colors.card }]}
                        onPress={() => handleViewInvoice(order)}
                      >
                        <Download size={14} color={colors.title} style={{ marginRight: 4 }} />
                        <Text style={[styles.invoiceBtnText, { color: colors.title }]}>Invoice</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Expanded Full Order Details */}
                  {isExpanded && (
                    <View style={[styles.orderDetails, { borderTopColor: colors.divider }]}>
                      {/* 1. Interactive Delivery Timeline */}
                      {order.tracking?.timeline && order.tracking.timeline.length > 0 && (
                        <View style={styles.detailSection}>
                          <View style={styles.sectionHeader}>
                            <Truck size={16} color={colors.primary} />
                            <Text style={[styles.sectionTitle, { color: colors.title }]}>
                              Delivery Timeline ({order.tracking.carrier || "Express Logistics"})
                            </Text>
                          </View>
                          <Text style={[styles.trackingNumberText, { color: colors.sub }]}>
                            Tracking No: <Text style={{ color: colors.title, fontWeight: "600" }}>{order.tracking.number || "TRK" + order._id.substring(0, 8)}</Text>
                          </Text>

                          <View style={styles.timelineContainer}>
                            {order.tracking.timeline.map((step: any, sIdx: number) => {
                              const isLast = sIdx === order.tracking.timeline.length - 1;
                              const isCompleted = step.isCompleted || order.status === "Delivered" || sIdx === 0;
                              return (
                                <View key={sIdx} style={styles.timelineItem}>
                                  <View style={styles.timelineLineColumn}>
                                    <View
                                      style={[
                                        styles.timelineDot,
                                        {
                                          backgroundColor: isCompleted ? "#059669" : colors.divider,
                                        },
                                      ]}
                                    >
                                      {isCompleted && <CheckCircle2 size={12} color="#ffffff" />}
                                    </View>
                                    {!isLast && (
                                      <View
                                        style={[
                                          styles.timelineVerticalLine,
                                          {
                                            backgroundColor: isCompleted ? "#059669" : colors.divider,
                                          },
                                        ]}
                                      />
                                    )}
                                  </View>
                                  <View style={styles.timelineTextColumn}>
                                    <Text style={[styles.timelineStepTitle, { color: colors.title }]}>
                                      {step.title || step.status}
                                    </Text>
                                    <Text style={[styles.timelineStepDesc, { color: colors.sub }]}>
                                      {step.description || step.location}
                                    </Text>
                                    {step.timestamp && (
                                      <Text style={[styles.timelineStepTime, { color: colors.sub }]}>
                                        {new Date(step.timestamp).toLocaleDateString("en-IN", {
                                          day: "numeric",
                                          month: "short",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </Text>
                                    )}
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      )}

                      {/* 2. Payment & Financial Summary Breakdown */}
                      <View style={styles.detailSection}>
                        <View style={styles.sectionHeader}>
                          <CreditCard size={16} color={colors.primary} />
                          <Text style={[styles.sectionTitle, { color: colors.title }]}>
                            Payment & Tax Breakdown
                          </Text>
                        </View>
                        <View style={[styles.financialCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
                          <View style={styles.financialRow}>
                            <Text style={[styles.financialLabel, { color: colors.sub }]}>Payment Method:</Text>
                            <Text style={[styles.financialValue, { color: colors.title }]}>
                              {order.paymentMethod || "COD"} ({order.paymentDetails?.status || "Success"})
                            </Text>
                          </View>
                          <View style={styles.financialRow}>
                            <Text style={[styles.financialLabel, { color: colors.sub }]}>Transaction ID:</Text>
                            <Text style={[styles.financialValue, { color: colors.sub, fontSize: 11 }]}>
                              {order.paymentDetails?.transactionId || "TXN-" + order._id.substring(0, 10)}
                            </Text>
                          </View>
                          <View style={styles.financialDivider} />
                          <View style={styles.financialRow}>
                            <Text style={[styles.financialLabel, { color: colors.sub }]}>Item Subtotal:</Text>
                            <Text style={[styles.financialValue, { color: colors.title }]}>
                              ₹{(order.paymentDetails?.subtotal || Math.round(order.total * 0.82)).toLocaleString("en-IN")}
                            </Text>
                          </View>
                          <View style={styles.financialRow}>
                            <Text style={[styles.financialLabel, { color: colors.sub }]}>GST (18% Included):</Text>
                            <Text style={[styles.financialValue, { color: colors.title }]}>
                              ₹{(order.paymentDetails?.tax || Math.round(order.total * 0.18)).toLocaleString("en-IN")}
                            </Text>
                          </View>
                          <View style={styles.financialRow}>
                            <Text style={[styles.financialLabel, { color: colors.sub }]}>Shipping Fee:</Text>
                            <Text style={[styles.financialValue, { color: "#059669" }]}>FREE</Text>
                          </View>
                          <View style={[styles.financialRow, { marginTop: 4 }]}>
                            <Text style={[styles.financialGrandLabel, { color: colors.title }]}>Grand Total:</Text>
                            <Text style={[styles.financialGrandValue, { color: colors.primary }]}>
                              ₹{(order.total || 0).toLocaleString("en-IN")}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* 3. Shipping Address */}
                      <View style={styles.detailSection}>
                        <View style={styles.sectionHeader}>
                          <MapPin size={16} color={colors.primary} />
                          <Text style={[styles.sectionTitle, { color: colors.title }]}>Delivery Address</Text>
                        </View>
                        <Text style={[styles.addressText, { color: colors.sub }]}>
                          {order.shippingAddress}
                        </Text>
                      </View>

                      {/* 4. Cancellation & Return Controls */}
                      <View style={styles.actionControlsRow}>
                        {isCancellable && (
                          <TouchableOpacity
                            style={[styles.cancelButton, { borderColor: "#fecaca", backgroundColor: "#fef2f2" }]}
                            onPress={() => setCancelModalOrder(order)}
                          >
                            <XCircle size={14} color="#dc2626" style={{ marginRight: 6 }} />
                            <Text style={styles.cancelButtonText}>Cancel Order</Text>
                          </TouchableOpacity>
                        )}

                        {isReturnable && (
                          <TouchableOpacity
                            style={[styles.returnButton, { borderColor: "#e9d5ff", backgroundColor: "#faf5ff" }]}
                            onPress={() => setReturnModalOrder(order)}
                          >
                            <RotateCcw size={14} color="#9333ea" style={{ marginRight: 6 }} />
                            <Text style={styles.returnButtonText}>Return / Exchange</Text>
                          </TouchableOpacity>
                        )}

                        {order.status === "Cancelled" && (
                          <View style={styles.infoBanner}>
                            <Text style={{ color: "#dc2626", fontSize: 12 }}>
                              Cancelled on{" "}
                              {order.cancellation?.cancelledAt
                                ? new Date(order.cancellation.cancelledAt).toLocaleDateString("en-IN")
                                : "recently"}
                              . Reason: {order.cancellation?.reason || "Customer request"}.
                            </Text>
                          </View>
                        )}

                        {order.returnRequest?.isRequested && (
                          <View style={[styles.infoBanner, { backgroundColor: "#faf5ff" }]}>
                            <Text style={{ color: "#9333ea", fontSize: 12 }}>
                              Return Status: {order.returnRequest?.status || "Requested"}. Courier will pick up package soon.
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <View style={styles.paginationRow}>
              <TouchableOpacity
                style={[
                  styles.pageBtn,
                  { backgroundColor: colors.card, borderColor: colors.divider },
                  !pagination.hasPrevPage && { opacity: 0.5 },
                ]}
                disabled={!pagination.hasPrevPage}
                onPress={() => fetchOrders(pagination.currentPage - 1, true)}
              >
                <Text style={[styles.pageBtnText, { color: colors.title }]}>Previous</Text>
              </TouchableOpacity>

              <Text style={[styles.pageIndicator, { color: colors.sub }]}>
                Page {pagination.currentPage} of {pagination.totalPages}
              </Text>

              <TouchableOpacity
                style={[
                  styles.pageBtn,
                  { backgroundColor: colors.card, borderColor: colors.divider },
                  !pagination.hasNextPage && { opacity: 0.5 },
                ]}
                disabled={!pagination.hasNextPage}
                onPress={() => fetchOrders(pagination.currentPage + 1, true)}
              >
                <Text style={[styles.pageBtnText, { color: colors.title }]}>Next</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        /* Transactions & Audit View */
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
          <View style={[styles.auditHeaderCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
            <ShieldCheck size={28} color="#059669" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={[styles.auditHeaderTitle, { color: colors.title }]}>Verified Transaction Ledger</Text>
              <Text style={[styles.auditHeaderSub, { color: colors.sub }]}>
                Real-time HMAC signature verified payment audits and idempotency records.
              </Text>
            </View>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Receipt size={48} color={colors.sub} />
              <Text style={[styles.emptyTitle, { color: colors.title, marginTop: 12 }]}>No transaction audits recorded</Text>
            </View>
          ) : (
            transactions.map((txn) => (
              <View
                key={txn._id}
                style={[
                  styles.transactionCard,
                  { backgroundColor: colors.card, borderColor: colors.divider },
                ]}
              >
                <View style={styles.transactionHeader}>
                  <View>
                    <Text style={[styles.txnEvent, { color: colors.title }]}>{txn.eventType}</Text>
                    <Text style={[styles.txnId, { color: colors.sub }]}>{txn.transactionId}</Text>
                  </View>
                  <View
                    style={[
                      styles.txnBadge,
                      {
                        backgroundColor: txn.verificationStatus === "VERIFIED" ? "#ecfdf5" : "#fef2f2",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.txnBadgeText,
                        { color: txn.verificationStatus === "VERIFIED" ? "#059669" : "#dc2626" },
                      ]}
                    >
                      {txn.verificationStatus}
                    </Text>
                  </View>
                </View>

                <View style={styles.transactionDetailsRow}>
                  <Text style={[styles.txnDetailLabel, { color: colors.sub }]}>Gateway: {txn.gateway}</Text>
                  <Text style={[styles.txnAmount, { color: colors.primary }]}>
                    ₹{(txn.amount || 0).toLocaleString("en-IN")}
                  </Text>
                </View>

                <Text style={[styles.txnTimestamp, { color: colors.sub }]}>
                  {new Date(txn.createdAt).toLocaleString("en-IN")}
                </Text>
              </View>
            ))
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* FILTER & SORT MODAL */}
      <Modal visible={filterModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
              <Text style={[styles.modalTitle, { color: colors.title }]}>Filter & Sort Orders</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <X size={22} color={colors.title} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16 }}>
              {/* Payment Method Filter */}
              <Text style={[styles.filterGroupTitle, { color: colors.title }]}>Payment Method</Text>
              <View style={styles.chipRow}>
                {["ALL", "COD", "Card", "UPI", "NetBanking"].map((pm) => (
                  <TouchableOpacity
                    key={pm}
                    style={[
                      styles.modalChip,
                      {
                        backgroundColor: selectedPaymentMethod === pm ? colors.primary : colors.surface,
                        borderColor: selectedPaymentMethod === pm ? colors.primary : colors.divider,
                      },
                    ]}
                    onPress={() => setSelectedPaymentMethod(pm)}
                  >
                    <Text
                      style={[
                        styles.modalChipText,
                        { color: selectedPaymentMethod === pm ? "#ffffff" : colors.sub },
                      ]}
                    >
                      {pm === "ALL" ? "All Methods" : pm}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Date Range Filter */}
              <Text style={[styles.filterGroupTitle, { color: colors.title, marginTop: 16 }]}>Date Range</Text>
              <View style={styles.chipRow}>
                {[
                  { id: "ALL", label: "All Time" },
                  { id: "30DAYS", label: "Last 30 Days" },
                  { id: "6MONTHS", label: "Last 6 Months" },
                  { id: "THIS_YEAR", label: "This Year" },
                ].map((d) => (
                  <TouchableOpacity
                    key={d.id}
                    style={[
                      styles.modalChip,
                      {
                        backgroundColor: dateFilter === d.id ? colors.primary : colors.surface,
                        borderColor: dateFilter === d.id ? colors.primary : colors.divider,
                      },
                    ]}
                    onPress={() => setDateFilter(d.id as any)}
                  >
                    <Text
                      style={[
                        styles.modalChipText,
                        { color: dateFilter === d.id ? "#ffffff" : colors.sub },
                      ]}
                    >
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Sort By Option */}
              <Text style={[styles.filterGroupTitle, { color: colors.title, marginTop: 16 }]}>Sort Orders By</Text>
              <View style={styles.chipRow}>
                {[
                  { label: "Newest First", by: "date", ord: "desc" },
                  { label: "Oldest First", by: "date", ord: "asc" },
                  { label: "Total: High to Low", by: "total", ord: "desc" },
                  { label: "Total: Low to High", by: "total", ord: "asc" },
                ].map((s) => {
                  const isCur = sortBy === s.by && sortOrder === s.ord;
                  return (
                    <TouchableOpacity
                      key={s.label}
                      style={[
                        styles.modalChip,
                        {
                          backgroundColor: isCur ? colors.primary : colors.surface,
                          borderColor: isCur ? colors.primary : colors.divider,
                        },
                      ]}
                      onPress={() => {
                        setSortBy(s.by);
                        setSortOrder(s.ord as any);
                      }}
                    >
                      <Text style={[styles.modalChipText, { color: isCur ? "#ffffff" : colors.sub }]}>
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.divider }]}>
              <TouchableOpacity
                style={[styles.modalResetBtn, { borderColor: colors.divider }]}
                onPress={() => {
                  setSelectedPaymentMethod("ALL");
                  setDateFilter("ALL");
                  setSortBy("date");
                  setSortOrder("desc");
                }}
              >
                <Text style={[styles.modalResetText, { color: colors.title }]}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalApplyBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setFilterModalVisible(false);
                  fetchOrders(1, true);
                }}
              >
                <Text style={styles.modalApplyText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CANCELLATION REASON MODAL */}
      <Modal visible={!!cancelModalOrder} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
              <Text style={[styles.modalTitle, { color: colors.title }]}>Cancel Order</Text>
              <TouchableOpacity onPress={() => setCancelModalOrder(null)}>
                <X size={22} color={colors.title} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 16 }}>
              <Text style={[styles.cancelModalNotice, { color: colors.sub }]}>
                Please select a cancellation reason for order #{cancelModalOrder?.invoiceNumber || cancelModalOrder?._id}:
              </Text>
              {[
                "Changed my mind",
                "Found a cheaper alternative",
                "Order placed by mistake",
                "Delivery date is too late",
                "Incorrect delivery address",
              ].map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.reasonOption,
                    {
                      borderColor: cancelReason === reason ? colors.primary : colors.divider,
                      backgroundColor: cancelReason === reason ? colors.primaryLight : colors.surface,
                    },
                  ]}
                  onPress={() => setCancelReason(reason)}
                >
                  <Text
                    style={[
                      styles.reasonOptionText,
                      { color: cancelReason === reason ? colors.primary : colors.title },
                    ]}
                  >
                    {reason}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.modalFooter, { borderTopColor: colors.divider }]}>
              <TouchableOpacity
                style={[styles.modalResetBtn, { borderColor: colors.divider }]}
                onPress={() => setCancelModalOrder(null)}
              >
                <Text style={[styles.modalResetText, { color: colors.title }]}>Keep Order</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalApplyBtn, { backgroundColor: "#dc2626" }]}
                onPress={handleCancelOrder}
                disabled={isActionLoading}
              >
                {isActionLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalApplyText}>Confirm Cancellation</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* RETURN REASON MODAL */}
      <Modal visible={!!returnModalOrder} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
              <Text style={[styles.modalTitle, { color: colors.title }]}>Request Return / Exchange</Text>
              <TouchableOpacity onPress={() => setReturnModalOrder(null)}>
                <X size={22} color={colors.title} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 16 }}>
              <Text style={[styles.cancelModalNotice, { color: colors.sub }]}>
                Select the reason for returning order #{returnModalOrder?.invoiceNumber || returnModalOrder?._id}:
              </Text>
              {[
                "Size / Fit issue",
                "Product received was defective",
                "Color or style mismatch with images",
                "Received wrong item",
                "Quality below expectation",
              ].map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.reasonOption,
                    {
                      borderColor: returnReason === reason ? colors.primary : colors.divider,
                      backgroundColor: returnReason === reason ? colors.primaryLight : colors.surface,
                    },
                  ]}
                  onPress={() => setReturnReason(reason)}
                >
                  <Text
                    style={[
                      styles.reasonOptionText,
                      { color: returnReason === reason ? colors.primary : colors.title },
                    ]}
                  >
                    {reason}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.modalFooter, { borderTopColor: colors.divider }]}>
              <TouchableOpacity
                style={[styles.modalResetBtn, { borderColor: colors.divider }]}
                onPress={() => setReturnModalOrder(null)}
              >
                <Text style={[styles.modalResetText, { color: colors.title }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalApplyBtn, { backgroundColor: "#9333ea" }]}
                onPress={handleReturnOrder}
                disabled={isActionLoading}
              >
                {isActionLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalApplyText}>Submit Return Request</Text>
                )}
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
    paddingTop: 50,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  filterIconButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTabItem: {},
  tabText: {
    fontSize: 13,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 14,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 2,
  },
  statusChipsScroll: {
    marginBottom: 12,
  },
  statusChipsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: "500",
  },
  activeFiltersRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  activeFilterLabel: {
    fontSize: 12,
  },
  filterTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  filterTagText: {
    fontSize: 11,
    fontWeight: "600",
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 4,
  },
  loaderContainer: {
    paddingVertical: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
  },
  emptyContainer: {
    paddingTop: 50,
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
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  actionButton: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  orderCard: {
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
  },
  invoiceText: {
    fontSize: 13,
    fontWeight: "700",
  },
  orderDate: {
    fontSize: 11,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  orderStatus: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  itemsContainer: {
    padding: 12,
  },
  orderItem: {
    flexDirection: "row",
    marginBottom: 10,
    alignItems: "center",
  },
  itemImage: {
    width: 54,
    height: 54,
    borderRadius: 8,
  },
  itemInfo: {
    marginLeft: 10,
    flex: 1,
  },
  brandName: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  itemName: {
    fontSize: 13,
    fontWeight: "500",
    marginVertical: 2,
  },
  itemMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemMetaText: {
    fontSize: 11,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: "700",
    marginLeft: "auto",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 11,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: "800",
  },
  actionButtonGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reorderBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  reorderBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  invoiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  invoiceBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  orderDetails: {
    padding: 14,
    borderTopWidth: 1,
  },
  detailSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  trackingNumberText: {
    fontSize: 12,
    marginBottom: 8,
  },
  timelineContainer: {
    marginTop: 4,
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 8,
  },
  timelineLineColumn: {
    alignItems: "center",
    width: 20,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  timelineVerticalLine: {
    width: 2,
    flex: 1,
    marginVertical: 2,
  },
  timelineTextColumn: {
    flex: 1,
    marginLeft: 8,
  },
  timelineStepTitle: {
    fontSize: 12,
    fontWeight: "700",
  },
  timelineStepDesc: {
    fontSize: 11,
    marginTop: 1,
  },
  timelineStepTime: {
    fontSize: 10,
    marginTop: 2,
  },
  financialCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  financialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  financialLabel: {
    fontSize: 12,
  },
  financialValue: {
    fontSize: 12,
    fontWeight: "500",
  },
  financialDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 6,
  },
  financialGrandLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  financialGrandValue: {
    fontSize: 15,
    fontWeight: "800",
  },
  addressText: {
    fontSize: 12,
    lineHeight: 18,
  },
  actionControlsRow: {
    marginTop: 8,
    gap: 8,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelButtonText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "700",
  },
  returnButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  returnButtonText: {
    color: "#9333ea",
    fontSize: 12,
    fontWeight: "700",
  },
  infoBanner: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#fef2f2",
  },
  paginationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 16,
  },
  pageBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  pageBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  pageIndicator: {
    fontSize: 12,
  },
  auditHeaderCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  auditHeaderTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  auditHeaderSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  transactionCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  txnEvent: {
    fontSize: 13,
    fontWeight: "700",
  },
  txnId: {
    fontSize: 11,
    marginTop: 2,
  },
  txnBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  txnBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  transactionDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  txnDetailLabel: {
    fontSize: 12,
  },
  txnAmount: {
    fontSize: 14,
    fontWeight: "700",
  },
  txnTimestamp: {
    fontSize: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  filterGroupTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  modalChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalChipText: {
    fontSize: 12,
    fontWeight: "500",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
  },
  modalResetBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  modalResetText: {
    fontSize: 13,
    fontWeight: "600",
  },
  modalApplyBtn: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modalApplyText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  cancelModalNotice: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 16,
  },
  reasonOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  reasonOptionText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
