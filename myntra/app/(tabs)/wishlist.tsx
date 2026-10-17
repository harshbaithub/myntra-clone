import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Heart, Trash2 } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/utils/api";

export default function Wishlist() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [wishlist, setwishlist] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchproduct();
  }, [user]);

  const fetchproduct = async () => {
    if (user) {
      try {
        setIsLoading(true);
        const bag = await api.get(`/wishlist/${user._id}`);
        setwishlist(bag.data);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handledelete = async (itemid: any) => {
    try {
      await api.delete(`/wishlist/${itemid}`);
      fetchproduct();
    } catch (error) {
      console.log(error);
    }
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View
          style={[
            styles.header,
            { backgroundColor: colors.header, borderBottomColor: colors.headerBorder },
          ]}
        >
          <Text style={[styles.headerTitle, { color: colors.title }]}>Wishlist</Text>
        </View>
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconCircle, { backgroundColor: colors.primaryLight }]}>
            <Heart size={48} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.title }]}>
            Please login to view your wishlist
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.sub }]}>
            Save items you love and revisit them anytime on all your devices.
          </Text>
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.loginButtonText}>LOGIN</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: colors.header, borderBottomColor: colors.headerBorder },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.title }]}>Wishlist</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!wishlist || wishlist.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconCircle, { backgroundColor: colors.surface }]}>
              <Heart size={48} color={colors.sub} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.title }]}>Your wishlist is empty</Text>
            <Text style={[styles.emptySubtitle, { color: colors.sub }]}>
              Explore our collections and tap the heart icon to save products.
            </Text>
            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/(tabs)/categories")}
            >
              <Text style={styles.loginButtonText}>START SHOPPING</Text>
            </TouchableOpacity>
          </View>
        ) : (
          wishlist.map((item: any) => {
            const product = item.productId;
            if (!product) return null;
            return (
              <TouchableOpacity
                key={item._id}
                style={[
                  styles.wishlistItem,
                  { backgroundColor: colors.card, borderColor: colors.divider },
                ]}
                activeOpacity={0.9}
                onPress={() => router.push(`/product/${product._id}`)}
              >
                <Image
                  source={{
                    uri:
                      product.images?.[0] ||
                      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
                  }}
                  style={styles.itemImage}
                />
                <View style={styles.itemInfo}>
                  <Text style={[styles.brandName, { color: colors.sub }]}>{product.brand}</Text>
                  <Text style={[styles.itemName, { color: colors.title }]} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <View style={styles.priceContainer}>
                    <Text style={[styles.price, { color: colors.title }]}>₹{product.price}</Text>
                    <Text style={[styles.discount, { color: colors.primary }]}>{product.discount}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.removeButton, { backgroundColor: colors.surface }]}
                  onPress={() => handledelete(item._id)}
                >
                  <Trash2 size={20} color={colors.error} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    paddingTop: 60,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 18,
  },
  loginButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  wishlistItem: {
    flexDirection: "row",
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
    alignItems: "center",
  },
  itemImage: {
    width: 100,
    height: 110,
  },
  itemInfo: {
    flex: 1,
    padding: 12,
  },
  brandName: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  price: {
    fontSize: 15,
    fontWeight: "700",
  },
  discount: {
    fontSize: 12,
    fontWeight: "600",
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 14,
    justifyContent: "center",
    alignItems: "center",
  },
});
