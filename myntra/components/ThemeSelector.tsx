import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Check, Sun, Moon, Smartphone, Sparkles, Flame, Gem } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { ThemeMode } from "@/constants/Themes";

interface ThemeSelectorProps {
  compact?: boolean;
}

export default function ThemeSelector({ compact = false }: ThemeSelectorProps) {
  const { themeMode, activeThemeId, setThemeMode, availableThemes, theme, colors } = useTheme();

  const getThemeIcon = (id: ThemeMode, color: string) => {
    switch (id) {
      case "system":
        return <Smartphone size={18} color={color} />;
      case "light":
        return <Sun size={18} color={color} />;
      case "dark":
        return <Moon size={18} color={color} />;
      case "midnight":
        return <Gem size={18} color={color} />;
      case "sunset":
        return <Flame size={18} color={color} />;
      case "emerald":
        return <Sparkles size={18} color={color} />;
      default:
        return <Sparkles size={18} color={color} />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.divider }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.title }]}>Appearance & Theme</Text>
          <Text style={[styles.subtitle, { color: colors.sub }]}>
            {themeMode === "system"
              ? `Auto syncing with Device (${activeThemeId === "dark" ? "Dark Mode" : "Light Mode"})`
              : `Current: ${theme.name}`}
          </Text>
        </View>
        <View style={[styles.activeBadge, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.activeBadgeText, { color: colors.primary }]}>
            {themeMode.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.gridContainer}>
        {availableThemes.map((item) => {
          const isSelected = themeMode === item.id;
          const [bg, cardBg, accentColor, textColor] = item.previewColors;

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              style={[
                styles.themeCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: isSelected ? colors.primary : colors.divider,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
              onPress={() => setThemeMode(item.id)}
            >
              {/* Mini theme palette preview preview bar */}
              <View style={[styles.previewBar, { backgroundColor: bg }]}>
                <View style={[styles.previewMiniCard, { backgroundColor: cardBg }]}>
                  <View style={[styles.previewDot, { backgroundColor: accentColor }]} />
                  <View style={[styles.previewLine, { backgroundColor: textColor }]} />
                </View>
                {isSelected && (
                  <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                    <Check size={12} color="#ffffff" strokeWidth={3} />
                  </View>
                )}
              </View>

              <View style={styles.cardContent}>
                <View style={styles.nameRow}>
                  {getThemeIcon(item.id, isSelected ? colors.primary : colors.sub)}
                  <Text
                    style={[
                      styles.themeName,
                      {
                        color: isSelected ? colors.primary : colors.title,
                        fontWeight: isSelected ? "700" : "600",
                      },
                    ]}
                  >
                    {item.name}
                  </Text>
                </View>
                {!compact && (
                  <Text style={[styles.themeTagline, { color: colors.sub }]} numberOfLines={2}>
                    {item.tagline}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 10,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 3,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  themeCard: {
    width: "48%",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 4,
  },
  previewBar: {
    height: 48,
    padding: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  previewMiniCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
  },
  previewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  previewLine: {
    width: 24,
    height: 4,
    borderRadius: 2,
    opacity: 0.7,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    padding: 10,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  themeName: {
    fontSize: 13,
  },
  themeTagline: {
    fontSize: 11,
    marginTop: 4,
    lineHeight: 14,
  },
});
