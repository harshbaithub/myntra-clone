import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Sparkles, Heart, Star, ShoppingBag } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useActivity } from "@/context/ActivityContext";
import { api } from "@/utils/api";

interface Props {
  productId?: string | number;
  title?: string;
  subtitle?: string;
  limit?: number;
}

export default function RecommendationCarousel({
  productId,
  title = "You May Also Like",
  subtitle = "Personalized picks tailored to your style",
  limit = 8,
}: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { quickToggleWishlist, wishlistIds, quickAddToBag } = useActivity();

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchRecs = async () => {
      try {
        setIsLoading(true);
        const params: any = { limit };
        if (user?._id) params.userId = user._id;
        if (productId) params.productId = productId;

        const res = await api.get("/recommendations/you-may-also-like", { params });
        if (isMounted && res.data?.data) {
          setRecommendations(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching recommendations:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchRecs();
    return () => {
      isMounted = false;
    };
  }, [user?._id, productId, limit]);

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.divider }]}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Sparkles size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.title }]}>{title}</Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: colors.sub }]}>{subtitle}</Text>
        </View>
      </View>

      {/* Horizontal Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {recommendations.map((item) => {
          const imgUri =
            (Array.isArray(item.images) ? item.images[0] : item.images) ||
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500";
          const isWishlisted = wishlistIds.includes(item._id?.toString());
          const originalPrice = item.originalPrice || Math.round(item.price * 1.3);

          return (
            <TouchableOpacity
              key={item._id}
              style={[
                styles.productCard,
                { backgroundColor: colors.surface, borderColor: colors.divider },
              ]}
              onPress={() => router.push(`/product/${item._id}`)}
              activeOpacity={0.8}
            >
              {/* Product Image */}
              <View style={styles.imageWrap}>
                <Image source={{ uri: imgUri }} style={styles.image} resizeMode="cover" />
                {/* Recommendation Reason Pill */}
                {item.recommendationReason && (
                  <View style={styles.reasonBadge}>
                    <Text style={styles.reasonText} numberOfLines={1}>
                      {item.recommendationReason}
                    </Text>
                  </View>
                )}
                {/* Wishlist Button */}
                <TouchableOpacity
                  style={[styles.wishlistBtn, { backgroundColor: "rgba(255,255,255,0.9)" }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    quickToggleWishlist(item._id);
                  }}
                >
                  <Heart
                    size={14}
                    color={isWishlisted ? "#ff3f6c" : "#111827"}
                    fill={isWishlisted ? "#ff3f6c" : "transparent"}
                  />
                </TouchableOpacity>
              </View>

              {/* Product Info */}
              <View style={styles.infoWrap}>
                <Text style={[styles.brandText, { color: colors.primary }]}>{item.brand}</Text>
                <Text style={[styles.titleText, { color: colors.title }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.priceRow}>
                  <Text style={[styles.priceText, { color: colors.title }]}>
                    ₹{(item.price || 0).toLocaleString("en-IN")}
                  </Text>
                  {originalPrice > item.price && (
                    <Text style={[styles.originalPriceText, { color: colors.sub }]}>
                      ₹{originalPrice.toLocaleString("en-IN")}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  loaderContainer: {
    paddingVertical: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerRow: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  scrollList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  productCard: {
    width: 150,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  imageWrap: {
    width: "100%",
    height: 180,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  reasonBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  reasonText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "700",
    textAlign: "center",
  },
  wishlistBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  infoWrap: {
    padding: 10,
  },
  brandText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  titleText: {
    fontSize: 12,
    fontWeight: "500",
    marginVertical: 2,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  priceText: {
    fontSize: 13,
    fontWeight: "700",
  },
  originalPriceText: {
    fontSize: 11,
    textDecorationLine: "line-through",
  },
});
