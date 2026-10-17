import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/utils/api";
import {
  getLocalRecentlyViewed,
  saveLocalRecentlyViewed,
  clearLocalRecentlyViewed,
} from "@/utils/storage";
import { useAuth } from "./AuthContext";

export interface ActivityProduct {
  _id: string;
  name: string;
  brand: string;
  price: number;
  discount: string;
  description: string;
  sizes: string[];
  images: string[];
  category?: string;
  subcategory?: string;
  viewedAt?: string | Date;
}

interface ActivityContextType {
  recentlyViewed: ActivityProduct[];
  continueShopping: ActivityProduct[];
  isLoadingActivity: boolean;
  recordProductView: (product: ActivityProduct) => Promise<void>;
  removeRecentlyViewed: (productId: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  quickAddToBag: (product: ActivityProduct, size?: string) => Promise<{ success: boolean; message: string }>;
  quickToggleWishlist: (productId: string) => Promise<{ success: boolean; inWishlist: boolean }>;
  wishlistIds: string[];
  refreshActivity: () => Promise<void>;
  syncAnonymousHistoryOnLogin: (userId: string) => Promise<void>;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

const MAX_ITEMS = 50;

export const ActivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [recentlyViewed, setRecentlyViewed] = useState<ActivityProduct[]>([]);
  const [continueShopping, setContinueShopping] = useState<ActivityProduct[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  // Helper to deduplicate and cap at 20 (newest first)
  const deduplicateProducts = (products: ActivityProduct[]): ActivityProduct[] => {
    const seen = new Set<string>();
    const result: ActivityProduct[] = [];
    for (const p of products) {
      if (p && p._id && !seen.has(p._id.toString())) {
        seen.add(p._id.toString());
        result.push(p);
      }
      if (result.length >= MAX_ITEMS) break;
    }
    return result;
  };

  // Fetch wishlist IDs for quick toggle state
  const fetchWishlist = useCallback(async () => {
    if (user?._id) {
      try {
        const res = await api.get(`/wishlist/${user._id}`);
        if (Array.isArray(res.data)) {
          const ids = res.data
            .map((item: any) => item.productId?._id || item.productId)
            .filter(Boolean)
            .map((id: any) => id.toString());
          setWishlistIds(ids);
        }
      } catch (err) {
        console.error("Error fetching wishlist in ActivityContext:", err);
      }
    } else {
      setWishlistIds([]);
    }
  }, [user?._id]);

  // Load activity data (recently viewed + continue shopping)
  const refreshActivity = useCallback(async () => {
    setIsLoadingActivity(true);
    try {
      if (user?._id) {
        // Logged in user: Fetch from backend API
        const [recentRes, continueRes] = await Promise.all([
          api.get(`/activity/recently-viewed/${user._id}`).catch(() => ({ data: { data: [] } })),
          api.get(`/activity/continue-shopping/${user._id}`).catch(() => ({ data: { data: [] } })),
        ]);

        const serverRecent = recentRes.data?.data || [];
        const serverContinue = continueRes.data?.data || [];

        setRecentlyViewed(serverRecent);
        setContinueShopping(serverContinue);

        // Cache server state locally for offline / fast initial load
        await saveLocalRecentlyViewed(serverRecent);
      } else {
        // Anonymous user: Read from local storage
        const localItems = await getLocalRecentlyViewed();
        setRecentlyViewed(localItems);
        // For anonymous users, continue shopping corresponds to recently viewed items
        setContinueShopping(localItems);
      }
      await fetchWishlist();
    } catch (error) {
      console.error("Error refreshing activity:", error);
    } finally {
      setIsLoadingActivity(false);
    }
  }, [user?._id, fetchWishlist]);

  // Sync anonymous history with user account upon login
  const syncAnonymousHistoryOnLogin = useCallback(async (userId: string) => {
    try {
      const localHistory = await getLocalRecentlyViewed();
      const localProductIds = localHistory.map((p) => p._id).filter(Boolean);

      if (localProductIds.length > 0) {
        const res = await api.post("/activity/sync", {
          userId,
          localProductIds,
        });
        const merged = res.data?.data || [];
        setRecentlyViewed(merged);
        await saveLocalRecentlyViewed(merged);
      }

      // Fetch updated continue shopping
      const continueRes = await api.get(`/activity/continue-shopping/${userId}`).catch(() => ({ data: { data: [] } }));
      setContinueShopping(continueRes.data?.data || []);
    } catch (error) {
      console.error("Error during login activity sync:", error);
    }
  }, []);

  // Initial load and listen to auth changes
  useEffect(() => {
    refreshActivity();
  }, [user?._id, refreshActivity]);

  // Record product view in real-time
  const recordProductView = async (product: ActivityProduct) => {
    if (!product || !product._id) return;

    // Optimistically update local state immediately
    const updatedViewedItem = { ...product, viewedAt: new Date().toISOString() };
    const updatedList = deduplicateProducts([updatedViewedItem, ...recentlyViewed]);

    setRecentlyViewed(updatedList);
    // Also update continue shopping optimistically
    setContinueShopping((prev) => {
      const filtered = prev.filter((p) => p._id !== product._id);
      return [updatedViewedItem, ...filtered].slice(0, MAX_ITEMS);
    });

    // Save to local storage
    await saveLocalRecentlyViewed(updatedList);

    // If logged in, synchronize to backend server in real-time
    if (user?._id) {
      try {
        const res = await api.post("/activity/view", {
          userId: user._id,
          productId: product._id,
        });
        if (res.data?.data) {
          setRecentlyViewed(res.data.data);
        }
      } catch (err) {
        console.error("Error sending view activity to backend:", err);
      }
    }
  };

  // Remove specific item
  const removeRecentlyViewed = async (productId: string) => {
    const updatedRecent = recentlyViewed.filter((p) => p._id !== productId);
    const updatedContinue = continueShopping.filter((p) => p._id !== productId);

    setRecentlyViewed(updatedRecent);
    setContinueShopping(updatedContinue);
    await saveLocalRecentlyViewed(updatedRecent);

    if (user?._id) {
      try {
        await api.delete(`/activity/recently-viewed/${user._id}?productId=${productId}`);
      } catch (err) {
        console.error("Error removing item from server activity:", err);
      }
    }
  };

  // Clear all history
  const clearHistory = async () => {
    setRecentlyViewed([]);
    setContinueShopping([]);
    await clearLocalRecentlyViewed();

    if (user?._id) {
      try {
        await api.delete(`/activity/recently-viewed/${user._id}`);
      } catch (err) {
        console.error("Error clearing server activity history:", err);
      }
    }
  };

  // Quick Action: Add to Bag
  const quickAddToBag = async (product: ActivityProduct, size?: string) => {
    if (!user?._id) {
      return { success: false, message: "Please log in to add items to your bag" };
    }

    const chosenSize = size || (product.sizes && product.sizes.length > 0 ? product.sizes[0] : "M");

    try {
      await api.post("/bag", {
        userId: user._id,
        productId: product._id,
        size: chosenSize,
        quantity: 1,
      });
      return { success: true, message: `Added ${product.brand} ${product.name} (Size: ${chosenSize}) to Bag!` };
    } catch (err: any) {
      console.error("Quick add to bag error:", err);
      return { success: false, message: err.response?.data?.message || "Failed to add to bag" };
    }
  };

  // Quick Action: Toggle Wishlist
  const quickToggleWishlist = async (productId: string) => {
    if (!user?._id) {
      return { success: false, inWishlist: false };
    }

    const isInWishlist = wishlistIds.includes(productId.toString());

    try {
      if (isInWishlist) {
        await api.delete(`/wishlist/${user._id}/${productId}`).catch(async () => {
          await api.post("/wishlist", { userId: user._id, productId });
        });
        setWishlistIds((prev) => prev.filter((id) => id !== productId.toString()));
        return { success: true, inWishlist: false };
      } else {
        await api.post("/wishlist", {
          userId: user._id,
          productId,
        });
        setWishlistIds((prev) => [...prev, productId.toString()]);
        return { success: true, inWishlist: true };
      }
    } catch (err) {
      console.error("Quick toggle wishlist error:", err);
      return { success: false, inWishlist: isInWishlist };
    }
  };

  return (
    <ActivityContext.Provider
      value={{
        recentlyViewed,
        continueShopping,
        isLoadingActivity,
        recordProductView,
        removeRecentlyViewed,
        clearHistory,
        quickAddToBag,
        quickToggleWishlist,
        wishlistIds,
        refreshActivity,
        syncAnonymousHistoryOnLogin,
      }}
    >
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error("useActivity must be used within an ActivityProvider");
  }
  return context;
};
