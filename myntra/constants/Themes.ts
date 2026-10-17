export type ThemeMode = "system" | "light" | "dark" | "midnight" | "sunset" | "emerald";
export type ConcreteThemeId = "light" | "dark" | "midnight" | "sunset" | "emerald";

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  bg: string;
  card: string;
  surface: string;
  surfaceElevated: string;
  header: string;
  headerBorder: string;
  tabBar: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
  title: string;
  text: string;
  sub: string;
  muted: string;
  divider: string;
  arrow: string;
  inputBg: string;
  inputBorder: string;
  placeholderText: string;
  productCard: string;
  quantityBg: string;
  footerBg: string;
  footerBorder: string;
  badge: string;
  badgeText: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  shadowColor: string;
}

export interface ThemeTypography {
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
  };
  lineHeight: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
  };
  fontWeight: {
    regular: "400";
    medium: "500";
    semiBold: "600";
    bold: "700";
  };
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
}

export interface ThemeRadii {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
}

export interface ThemeConfig {
  id: ConcreteThemeId;
  name: string;
  tagline: string;
  isDark: boolean;
  previewColors: [string, string, string, string]; // [bg, card, primary, text]
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  radii: ThemeRadii;
}

const baseTypography: ThemeTypography = {
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 30,
  },
  lineHeight: {
    xs: 16,
    sm: 18,
    md: 22,
    lg: 24,
    xl: 28,
    xxl: 32,
    xxxl: 38,
  },
  fontWeight: {
    regular: "400",
    medium: "500",
    semiBold: "600",
    bold: "700",
  },
};

const baseSpacing: ThemeSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

const baseRadii: ThemeRadii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// 1. LIGHT THEME
export const LIGHT_THEME: ThemeConfig = {
  id: "light",
  name: "Classic Light",
  tagline: "Clean, crisp, everyday brilliance",
  isDark: false,
  previewColors: ["#f8f9fa", "#ffffff", "#ff3f6c", "#1e2022"],
  colors: {
    primary: "#ff3f6c",
    primaryLight: "#ffe8ee",
    primaryDark: "#d92c55",
    secondary: "#535766",
    accent: "#ff3f6c",
    bg: "#f8f9fa",
    card: "#ffffff",
    surface: "#f2f3f5",
    surfaceElevated: "#ffffff",
    header: "#ffffff",
    headerBorder: "#eceff1",
    tabBar: "#ffffff",
    tabBarBorder: "#eceff1",
    tabBarActive: "#ff3f6c",
    tabBarInactive: "#687076",
    title: "#111827",
    text: "#111827",
    sub: "#4b5563",
    muted: "#6b7280",
    divider: "#e5e7eb",
    arrow: "#6b7280",
    inputBg: "#f9fafb",
    inputBorder: "#d1d5db",
    placeholderText: "#6b7280",
    productCard: "#ffffff",
    quantityBg: "#f2f3f5",
    footerBg: "#ffffff",
    footerBorder: "#eceff1",
    badge: "#ff3f6c",
    badgeText: "#ffffff",
    success: "#03a685",
    warning: "#ff9800",
    error: "#e53935",
    info: "#2196f3",
    shadowColor: "#000000",
  },
  typography: baseTypography,
  spacing: baseSpacing,
  radii: baseRadii,
};

// 2. DARK THEME
export const DARK_THEME: ThemeConfig = {
  id: "dark",
  name: "Charcoal Dark",
  tagline: "Sleek, battery-saving dark interface",
  isDark: true,
  previewColors: ["#121212", "#1e1e1e", "#ff3f6c", "#f1f3f5"],
  colors: {
    primary: "#ff3f6c",
    primaryLight: "#3d1b24",
    primaryDark: "#e0335c",
    secondary: "#c4c8d0",
    accent: "#ff527b",
    bg: "#121212",
    card: "#1e1e1e",
    surface: "#282828",
    surfaceElevated: "#2d2d2d",
    header: "#1a1a1a",
    headerBorder: "#2a2a2a",
    tabBar: "#1a1a1a",
    tabBarBorder: "#2a2a2a",
    tabBarActive: "#ff3f6c",
    tabBarInactive: "#9ea4b0",
    title: "#ffffff",
    text: "#ffffff",
    sub: "#c4c8d0",
    muted: "#8a8f98",
    divider: "#2a2a2a",
    arrow: "#9ea4b0",
    inputBg: "#242528",
    inputBorder: "#424650",
    placeholderText: "#9ea4b0",
    productCard: "#1e1e1e",
    quantityBg: "#282828",
    footerBg: "#1a1a1a",
    footerBorder: "#2a2a2a",
    badge: "#ff3f6c",
    badgeText: "#ffffff",
    success: "#05c49f",
    warning: "#ffb74d",
    error: "#ef5350",
    info: "#42a5f5",
    shadowColor: "#000000",
  },
  typography: baseTypography,
  spacing: baseSpacing,
  radii: baseRadii,
};

// 3. MIDNIGHT LUXURY THEME
export const MIDNIGHT_THEME: ThemeConfig = {
  id: "midnight",
  name: "Midnight Sapphire",
  tagline: "Deep royal indigo & neon luminescence",
  isDark: true,
  previewColors: ["#0b0f19", "#151c2e", "#38bdf8", "#f1f5f9"],
  colors: {
    primary: "#38bdf8",
    primaryLight: "#0f2e4a",
    primaryDark: "#0284c7",
    secondary: "#94a3b8",
    accent: "#818cf8",
    bg: "#0b0f19",
    card: "#151c2e",
    surface: "#1e293b",
    surfaceElevated: "#25334c",
    header: "#0f1626",
    headerBorder: "#1e293b",
    tabBar: "#0f1626",
    tabBarBorder: "#1e293b",
    tabBarActive: "#38bdf8",
    tabBarInactive: "#64748b",
    title: "#f8fafc",
    text: "#e2e8f0",
    sub: "#94a3b8",
    muted: "#64748b",
    divider: "#1e293b",
    arrow: "#64748b",
    inputBg: "#1e293b",
    inputBorder: "#334155",
    placeholderText: "#64748b",
    productCard: "#151c2e",
    quantityBg: "#1e293b",
    footerBg: "#0f1626",
    footerBorder: "#1e293b",
    badge: "#38bdf8",
    badgeText: "#0b0f19",
    success: "#34d399",
    warning: "#fbbf24",
    error: "#f87171",
    info: "#60a5fa",
    shadowColor: "#000000",
  },
  typography: baseTypography,
  spacing: baseSpacing,
  radii: baseRadii,
};

// 4. SUNSET ROSE THEME
export const SUNSET_THEME: ThemeConfig = {
  id: "sunset",
  name: "Sunset Rose",
  tagline: "Vibrant cyberpunk twilight & rose gold",
  isDark: true,
  previewColors: ["#170b18", "#261328", "#f43f5e", "#fce7f3"],
  colors: {
    primary: "#f43f5e",
    primaryLight: "#3d1326",
    primaryDark: "#e11d48",
    secondary: "#d8b4fe",
    accent: "#fb7185",
    bg: "#170b18",
    card: "#261328",
    surface: "#381a3b",
    surfaceElevated: "#48214c",
    header: "#1f0e21",
    headerBorder: "#3b1c3e",
    tabBar: "#1f0e21",
    tabBarBorder: "#3b1c3e",
    tabBarActive: "#f43f5e",
    tabBarInactive: "#9d7b9f",
    title: "#fdf2f8",
    text: "#fce7f3",
    sub: "#d8b4fe",
    muted: "#9d7b9f",
    divider: "#3b1c3e",
    arrow: "#9d7b9f",
    inputBg: "#381a3b",
    inputBorder: "#522557",
    placeholderText: "#9d7b9f",
    productCard: "#261328",
    quantityBg: "#381a3b",
    footerBg: "#1f0e21",
    footerBorder: "#3b1c3e",
    badge: "#f43f5e",
    badgeText: "#ffffff",
    success: "#4ade80",
    warning: "#fbb03b",
    error: "#fb7185",
    info: "#a78bfa",
    shadowColor: "#000000",
  },
  typography: baseTypography,
  spacing: baseSpacing,
  radii: baseRadii,
};

// 5. EMERALD VELVET THEME
export const EMERALD_THEME: ThemeConfig = {
  id: "emerald",
  name: "Emerald Velvet",
  tagline: "Rich forest night with electric mint accents",
  isDark: true,
  previewColors: ["#0a1410", "#12241d", "#10b981", "#ecfdf5"],
  colors: {
    primary: "#10b981",
    primaryLight: "#0f3629",
    primaryDark: "#059669",
    secondary: "#6ee7b7",
    accent: "#34d399",
    bg: "#0a1410",
    card: "#12241d",
    surface: "#1a362b",
    surfaceElevated: "#234739",
    header: "#0d1b15",
    headerBorder: "#1f4035",
    tabBar: "#0d1b15",
    tabBarBorder: "#1f4035",
    tabBarActive: "#10b981",
    tabBarInactive: "#5d8274",
    title: "#f0fdf4",
    text: "#ecfdf5",
    sub: "#86efac",
    muted: "#5d8274",
    divider: "#1f4035",
    arrow: "#5d8274",
    inputBg: "#1a362b",
    inputBorder: "#2a5444",
    placeholderText: "#5d8274",
    productCard: "#12241d",
    quantityBg: "#1a362b",
    footerBg: "#0d1b15",
    footerBorder: "#1f4035",
    badge: "#10b981",
    badgeText: "#0a1410",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#f43f5e",
    info: "#38bdf8",
    shadowColor: "#000000",
  },
  typography: baseTypography,
  spacing: baseSpacing,
  radii: baseRadii,
};

export const THEMES: Record<ConcreteThemeId, ThemeConfig> = {
  light: LIGHT_THEME,
  dark: DARK_THEME,
  midnight: MIDNIGHT_THEME,
  sunset: SUNSET_THEME,
  emerald: EMERALD_THEME,
};

export const THEME_OPTIONS: Array<{
  id: ThemeMode;
  name: string;
  tagline: string;
  previewColors: [string, string, string, string];
  isDark?: boolean;
}> = [
  {
    id: "system",
    name: "System Default",
    tagline: "Follow device system settings automatically",
    previewColors: ["#f8f9fa", "#121212", "#ff3f6c", "#282c3f"],
  },
  {
    id: "light",
    name: "Classic Light",
    tagline: "Clean, crisp, everyday brilliance",
    previewColors: LIGHT_THEME.previewColors,
    isDark: false,
  },
  {
    id: "dark",
    name: "Charcoal Dark",
    tagline: "Sleek, battery-saving dark interface",
    previewColors: DARK_THEME.previewColors,
    isDark: true,
  },
  {
    id: "midnight",
    name: "Midnight Sapphire",
    tagline: "Deep royal indigo & neon luminescence",
    previewColors: MIDNIGHT_THEME.previewColors,
    isDark: true,
  },
  {
    id: "sunset",
    name: "Sunset Rose",
    tagline: "Vibrant cyberpunk twilight & rose gold",
    previewColors: SUNSET_THEME.previewColors,
    isDark: true,
  },
  {
    id: "emerald",
    name: "Emerald Velvet",
    tagline: "Rich forest night with electric mint accents",
    previewColors: EMERALD_THEME.previewColors,
    isDark: true,
  },
];
