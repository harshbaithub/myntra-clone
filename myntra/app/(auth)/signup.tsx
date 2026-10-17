import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Eye, EyeOff, ArrowLeft } from "lucide-react-native";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useActivity } from "@/context/ActivityContext";
import { useTheme } from "@/context/ThemeContext";
import { getUserData } from "@/utils/storage";

export default function Signup() {
  const { Signup } = useAuth();
  const { syncAnonymousHistoryOnLogin } = useActivity();
  const { colors } = useTheme();
  const router = useRouter();
  const [isloading, setisloading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [focusedInput, setFocusedInput] = useState<"fullName" | "email" | "password" | null>(null);

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      fullName: "",
      email: "",
      password: "",
    };

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSignup = async () => {
    if (validateForm()) {
      try {
        setisloading(true);
        await Signup(formData.fullName, formData.email, formData.password);
        const userObj = await getUserData();
        if (userObj && userObj._id) {
          await syncAnonymousHistoryOnLogin(userObj._id);
        }
        router.replace("/(tabs)");
      } catch (error: any) {
        console.error(error);
        const msg = error.response?.data?.message || error.message || "Failed to create account. Please try again.";
        Alert.alert("Signup Failed", msg);
      } finally {
        setisloading(false);
      }
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.imageSection}>
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop",
          }}
          style={styles.backgroundImage}
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

      <View style={[styles.formContainer, { backgroundColor: colors.card, borderColor: colors.divider }]}>
        <Text style={[styles.title, { color: colors.title }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: colors.sub }]}>
          Join Myntra and discover tailored fashion
        </Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.title }]}>Full Name</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBg,
                borderColor: errors.fullName
                  ? colors.error
                  : focusedInput === "fullName"
                  ? colors.primary
                  : colors.inputBorder,
                color: colors.text,
              },
            ]}
            placeholder="Enter your full name"
            placeholderTextColor={colors.placeholderText}
            value={formData.fullName}
            onChangeText={(text) => setFormData({ ...formData, fullName: text })}
            onFocus={() => setFocusedInput("fullName")}
            onBlur={() => setFocusedInput(null)}
          />
          {errors.fullName ? (
            <Text style={[styles.errorText, { color: colors.error }]}>{errors.fullName}</Text>
          ) : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.title }]}>Email Address</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBg,
                borderColor: errors.email
                  ? colors.error
                  : focusedInput === "email"
                  ? colors.primary
                  : colors.inputBorder,
                color: colors.text,
              },
            ]}
            placeholder="name@example.com"
            placeholderTextColor={colors.placeholderText}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
            onFocus={() => setFocusedInput("email")}
            onBlur={() => setFocusedInput(null)}
          />
          {errors.email ? (
            <Text style={[styles.errorText, { color: colors.error }]}>{errors.email}</Text>
          ) : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.title }]}>Password</Text>
          <View
            style={[
              styles.passwordContainer,
              {
                backgroundColor: colors.inputBg,
                borderColor: errors.password
                  ? colors.error
                  : focusedInput === "password"
                  ? colors.primary
                  : colors.inputBorder,
              },
            ]}
          >
            <TextInput
              style={[styles.passwordInput, { color: colors.text }]}
              placeholder="Min. 6 characters"
              placeholderTextColor={colors.placeholderText}
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
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
          {errors.password ? (
            <Text style={[styles.errorText, { color: colors.error }]}>{errors.password}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleSignup}
          disabled={isloading}
        >
          {isloading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>CREATE ACCOUNT</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => router.push("/login")}
        >
          <Text style={[styles.loginText, { color: colors.sub }]}>
            Already have an account?{" "}
            <Text style={{ color: colors.primary, fontWeight: "700" }}>Login</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  imageSection: {
    height: 240,
    position: "relative",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 28,
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
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
  formContainer: {
    flex: 1,
    maxWidth: 480,
    width: "100%",
    alignSelf: "center",
    padding: 24,
    marginTop: -24,
    borderRadius: 24,
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
  inputGroup: {
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
  errorText: {
    fontSize: 12,
    marginTop: 4,
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
    marginTop: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  loginLink: {
    marginTop: 20,
    alignItems: "center",
    marginBottom: 10,
  },
  loginText: {
    fontSize: 13,
  },
});
