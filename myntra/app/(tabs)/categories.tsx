import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Image,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Search, X, ChevronLeft } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/utils/api";
import DesktopNavbar from "@/components/DesktopNavbar";

export default function TabTwoScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [categories, setcategories] = useState<any[]>([]);

  const isDesktop = width >= 768;
  const isLargeDesktop = width >= 1100;
  const containerWidth = Math.min(width, 1200) - 32;
  const numColumns = isLargeDesktop ? 4 : isDesktop ? 3 : 2;
  const cardGap = 16;
  const cardWidth = Math.floor((containerWidth - (numColumns - 1) * cardGap) / numColumns);
  const cardImageHeight = Math.round(cardWidth * 1.3);

  const fetchproduct = async (isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      const cat = await api.get("/category");
      setcategories(cat.data || []);
    } catch (error) {
      console.log("Fetch categories error:", error);
      setcategories([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchproduct();
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.sub, fontSize: 13 }}>Loading categories...</Text>
      </View>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg, justifyContent: "center", alignItems: "center", padding: 24 }]}>
        <Text style={[styles.emptyProductsSubtitle, { color: colors.title, fontSize: 16, fontWeight: "700", marginBottom: 8 }]}>
          Unable to load categories
        </Text>
        <Text style={{ color: colors.sub, fontSize: 13, textAlign: "center", marginBottom: 20 }}>
          Make sure your phone is connected to the same Wi-Fi network as the server.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
          onPress={() => fetchproduct(true)}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>RETRY</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedCategory(null);
    setSelectedSubcategory(null);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSelectedSubcategory(null);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory(null);
    setSearchQuery("");
  };

  const handleSubcategorySelect = (subcategoryId: string) => {
    if (selectedSubcategory === subcategoryId) {
      setSelectedSubcategory(null);
    } else {
      setSelectedSubcategory(subcategoryId);
    }
    setSearchQuery("");
  };

  const filtercategories = categories?.filter(
    (category: any) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.subcategory?.some((subcategory: any) =>
        subcategory.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      category.productId?.some(
        (product: any) =>
          product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.brand?.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const selectedcategorydata = selectedCategory
    ? categories?.find((cat: any) => cat._id === selectedCategory)
    : null;

  const getDisplayedProducts = () => {
    if (!selectedcategorydata?.productId) return [];
    let items = selectedcategorydata.productId;
    if (selectedSubcategory) {
      const subLower = selectedSubcategory.toLowerCase();
      const filtered = items.filter(
        (p: any) =>
          p.name?.toLowerCase().includes(subLower) ||
          p.description?.toLowerCase().includes(subLower) ||
          p.brand?.toLowerCase().includes(subLower)
      );
      return filtered.length > 0 ? filtered : items;
    }
    return items;
  };

  const renderProducts = (products: any) => {
    if (!products || products.length === 0) {
      return (
        <View style={styles.emptyProductsContainer}>
          <Text style={[styles.emptyProductsTitle, { color: colors.title }]}>No products found</Text>
          <Text style={[styles.emptyProductsSubtitle, { color: colors.sub }]}>
            {selectedSubcategory
              ? `No items available in "${selectedSubcategory}" yet.`
              : "No items available in this category yet."}
          </Text>
          {selectedSubcategory && (
            <TouchableOpacity
              style={[styles.resetSubcategoryButton, { borderColor: colors.primary }]}
              onPress={() => setSelectedSubcategory(null)}
            >
              <Text style={[styles.resetSubcategoryText, { color: colors.primary }]}>
                View All {selectedcategorydata?.name} Products
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    return (
      <View style={[styles.productsGrid, { gap: cardGap }]}>
        {products.map((product: any) => (
          <TouchableOpacity
            key={product._id}
            style={[
              styles.productCard,
              {
                width: cardWidth,
                backgroundColor: colors.card,
                borderColor: colors.divider,
              },
            ]}
            onPress={() => router.push(`/product/${product._id}`)}
          >
            <Image
              source={{ uri: product.images?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500" }}
              style={[styles.productImage, { height: cardImageHeight }]}
              resizeMode="cover"
            />
            <View style={styles.productInfo}>
              <Text style={[styles.brandName, { color: colors.sub }]}>{product.brand}</Text>
              <Text style={[styles.productName, { color: colors.title }]} numberOfLines={1}>
                {product.name}
              </Text>
              <View style={styles.priceRow}>
                <Text style={[styles.price, { color: colors.title }]}>₹{product.price}</Text>
                <Text style={[styles.discount, { color: colors.primary }]}>{product.discount}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {isDesktop ? (
        <DesktopNavbar onSearch={handleSearch} />
      ) : (
        <>
          <View
            style={[
              styles.header,
              { backgroundColor: colors.header, borderBottomColor: colors.headerBorder },
            ]}
          >
            <Text style={[styles.headerTitle, { color: colors.title }]}>Categories</Text>
          </View>

          <View
            style={[
              styles.searchContainer,
              { backgroundColor: colors.header, borderBottomColor: colors.headerBorder },
            ]}
          >
            <View
              style={[
                styles.searchInputContainer,
                { backgroundColor: colors.inputBg, borderColor: colors.inputBorder },
              ]}
            >
              <Search size={18} color={colors.sub} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search for products, brands and more"
                placeholderTextColor={colors.placeholderText}
                value={searchQuery}
                onChangeText={handleSearch}
              />
              {searchQuery !== "" && (
                <TouchableOpacity onPress={clearSearch}>
                  <X size={18} color={colors.sub} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </>
      )}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ maxWidth: 1240, width: "100%", alignSelf: "center", paddingBottom: 60 }}
      >
        {!selectedCategory && (
          <View style={styles.categoriesGrid}>
            {filtercategories?.map((category: any) => (
              <TouchableOpacity
                key={category._id}
                style={[
                  styles.categoryCard,
                  { backgroundColor: colors.card, borderColor: colors.divider },
                ]}
                onPress={() => handleCategorySelect(category._id)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: category.image }}
                  style={styles.categoryImage}
                />
                <View style={styles.categoryInfo}>
                  <Text style={[styles.categoryName, { color: colors.title }]}>
                    {category.name}
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.subcategories}>
                      {category?.subcategory?.map((sub: any, index: any) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.subcategoryTag,
                            { backgroundColor: colors.surface, borderColor: colors.divider },
                          ]}
                          onPress={() => handleSubcategorySelect(sub)}
                        >
                          <Text style={[styles.subcategoryText, { color: colors.text }]}>
                            {sub}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selectedcategorydata && (
          <View style={styles.categoryDetail}>
            <View style={styles.categoryHeader}>
              <TouchableOpacity
                style={[styles.backButton, { backgroundColor: colors.surface }]}
                onPress={() => setSelectedCategory(null)}
              >
                <ChevronLeft size={18} color={colors.primary} />
                <Text style={[styles.backButtonText, { color: colors.primary }]}>
                  All Categories
                </Text>
              </TouchableOpacity>
              <Text style={[styles.categoryTitle, { color: colors.title }]}>
                {selectedcategorydata.name}
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.subcategoriesScroll}
            >
              {selectedcategorydata.subcategory?.map((sub: any, index: any) => {
                const isSelected = selectedSubcategory === sub;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.subcategoryButton,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.divider,
                      },
                    ]}
                    onPress={() => handleSubcategorySelect(sub)}
                  >
                    <Text
                      style={[
                        styles.subcategoryButtonText,
                        {
                          color: isSelected ? "#ffffff" : colors.text,
                          fontWeight: isSelected ? "700" : "500",
                        },
                      ]}
                    >
                      {sub}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {renderProducts(getDisplayedProducts())}
          </View>
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  content: {
    flex: 1,
  },
  categoriesGrid: {
    padding: 16,
  },
  categoryCard: {
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  categoryImage: {
    width: "100%",
    height: 150,
  },
  categoryInfo: {
    padding: 14,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  subcategories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  subcategoryTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  subcategoryText: {
    fontSize: 12,
    fontWeight: "500",
  },
  categoryDetail: {
    padding: 16,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  subcategoriesScroll: {
    marginBottom: 16,
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  subcategoryButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  subcategoryButtonText: {
    fontSize: 13,
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  productCard: {
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: "100%",
  },
  productInfo: {
    padding: 10,
  },
  brandName: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  productName: {
    fontSize: 13,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
  },
  discount: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyProductsContainer: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyProductsTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptyProductsSubtitle: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 16,
  },
  resetSubcategoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  resetSubcategoryText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
