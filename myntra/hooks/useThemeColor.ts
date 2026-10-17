import { useTheme } from "@/context/ThemeContext";

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: "text" | "background" | "tint" | "icon" | "tabIconDefault" | "tabIconSelected"
) {
  const { colors, isDark } = useTheme();

  if (isDark && props.dark) {
    return props.dark;
  }
  if (!isDark && props.light) {
    return props.light;
  }

  switch (colorName) {
    case "text":
      return colors.text;
    case "background":
      return colors.bg;
    case "tint":
      return colors.primary;
    case "icon":
      return colors.sub;
    case "tabIconDefault":
      return colors.tabBarInactive;
    case "tabIconSelected":
      return colors.tabBarActive;
    default:
      return colors.text;
  }
}
