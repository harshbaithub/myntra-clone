import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import React from "react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useActivity } from "@/context/ActivityContext";
import { useTheme } from "@/context/ThemeContext";
import { getUserData } from "@/utils/storage";

export default function Login() {
  const { login } = useAuth();
  const { syncAnonymousHistoryOnLogin } = useActivity();
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isloading, setisloading] = useState(false);
  const [error, setError] = useState("");
  const [focusedInput, setFocusedInput] = useState<"email" | "password" | null>(null);

  const handleLogin = async () => {
    try {
      setError("");
      setisloading(true);
      await login(email, password);
      const userObj = await getUserData();
      if (userObj && userObj._id) {
        await syncAnonymousHistoryOnLogin(userObj._id);
      }
      router.replace("/(tabs)");
    } catch (err: any) {
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        "Login failed. Please check your network and credentials.";
      setError(errMsg);
      console.error("Login error:", err);
    } finally {
      setisloading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      {/* Hero Image */}
      <View style={styles.imageSection}>
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop",
          }}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <View style={styles.imageOverlay} />
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.card }]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color={colors.title} />
        </TouchableOpacity>
        <Text style={styles.brandName}>MYNTRA</Text>
      </View>

      {/* Form Card */}
      <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
        <Text style={[styles.title, { color: colors.title }]}>Welcome Back</Text>
        <Text style={[styles.subtitle, { color: colors.sub }]}>Login to continue shopping</Text>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
            <Text style={[styles.errorText, { color: colors.primary }]}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.inputWrapper}>
          <Text style={[styles.label, { color: colors.title }]}>Email</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBg,
                borderColor: focusedInput === "email" ? colors.primary : colors.inputBorder,
                color: colors.text,
              },
            ]}
            placeholder="Enter your email"
            placeholderTextColor={colors.placeholderText}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            onFocus={() => setFocusedInput("email")}
            onBlur={() => setFocusedInput(null)}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={[styles.label, { color: colors.title }]}>Password</Text>
          <View
            style={[
              styles.passwordContainer,
              {
                backgroundColor: colors.inputBg,
                borderColor: focusedInput === "password" ? colors.primary : colors.inputBorder,
              },
            ]}
          >
            <TextInput
              style={[styles.passwordInput, { color: colors.text }]}
              placeholder="Enter your password"
              placeholderTextColor={colors.placeholderText}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              onFocus={() => setFocusedInput("password")}
              onBlur={() => setFocusedInput(null)}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={20} color={colors.sub} />
              ) : (
                <Eye size={20} color={colors.sub} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleLogin}
          disabled={isloading}
        >
          {isloading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>LOGIN</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
          <Text style={[styles.dividerText, { color: colors.sub }]}>OR</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
        </View>

        <TouchableOpacity
          style={[
            styles.signupButton,
            { borderColor: colors.primary, backgroundColor: colors.surface },
          ]}
          onPress={() => router.push("/signup")}
        >
          <Text style={[styles.signupButtonText, { color: colors.primary }]}>
            CREATE AN ACCOUNT
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  imageSection: {
    height: 260,
    position: "relative",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 30,
  },
  heroImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  brandName: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 6,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  formCard: {
    flex: 1,
    maxWidth: 480,
    width: "100%",
    alignSelf: "center",
    borderRadius: 24,
    marginTop: -24,
    padding: 24,
    paddingTop: 28,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "600",
  },
  inputWrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    padding: 14,
    borderRadius: 10,
    fontSize: 15,
    borderWidth: 1.5,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1.5,
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 15,
  },
  eyeIcon: {
    padding: 14,
  },
  button: {
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    fontWeight: "600",
  },
  signupButton: {
    borderWidth: 1.5,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  signupButtonText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
