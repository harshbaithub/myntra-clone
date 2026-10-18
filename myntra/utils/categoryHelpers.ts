export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  men: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&auto=format&fit=crop",
  women: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop",
  kids: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=800&auto=format&fit=crop",
  beauty: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop",
};

export const getValidCategoryImage = (category: any, hasError = false): string => {
  const catKey = (category?.name || "").toLowerCase().trim();
  const fallback =
    CATEGORY_FALLBACK_IMAGES[catKey] ||
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop";
  const raw = category?.image;
  if (hasError || !raw || raw.includes("1618244972963")) {
    return fallback;
  }
  return raw;
};
