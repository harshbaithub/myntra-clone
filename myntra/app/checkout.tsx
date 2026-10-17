import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { CreditCard, MapPin, Truck, ArrowLeft, CheckCircle } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/utils/api";

export default function Checkout() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();

  const handleplaceorder = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    try {
      setLoading(true);
      await api.post(`/order/create/${user._id}`, {
        shippingAddress: "123 Fashion Avenue, Tech Park, Bangalore 560103",
        paymentMethod: "Card (ending in 4242)",
      });
      router.replace("/orders");
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: colors.header, borderBottomColor: colors.headerBorder },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.title} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.title }]}>Checkout</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Shipping Address */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.divider },
          ]}
        >
          <View style={styles.sectionHeader}>
            <MapPin size={22} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.title }]}>
              Shipping Address
            </Text>
          </View>
          <View style={styles.form}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
              placeholder="Full Name"
              placeholderTextColor={colors.placeholderText}
              defaultValue={user?.name || "Customer Name"}
            />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
              placeholder="Address Line 1"
              placeholderTextColor={colors.placeholderText}
              defaultValue="123 Fashion Avenue, Tech Park"
            />
            <View style={styles.row}>
              <TextInput
                style={[
                  styles.halfInput,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
                placeholder="City"
                placeholderTextColor={colors.placeholderText}
                defaultValue="Bangalore"
              />
              <TextInput
                style={[
                  styles.halfInput,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
                placeholder="Postal Code"
                placeholderTextColor={colors.placeholderText}
                defaultValue="560103"
              />
            </View>
          </View>
        </View>

        {/* Payment Section */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.divider },
          ]}
        >
          <View style={styles.sectionHeader}>
            <CreditCard size={22} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.title }]}>
              Payment Method
            </Text>
          </View>
          <View style={styles.form}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
              placeholder="Card Number"
              placeholderTextColor={colors.placeholderText}
              defaultValue="**** **** **** 4242"
            />
            <View style={styles.row}>
              <TextInput
                style={[
                  styles.halfInput,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
                placeholder="MM/YY"
                placeholderTextColor={colors.placeholderText}
                defaultValue="12/28"
              />
              <TextInput
                style={[
                  styles.halfInput,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
                placeholder="CVV"
                placeholderTextColor={colors.placeholderText}
                defaultValue="***"
                secureTextEntry
              />
            </View>
          </View>
        </View>

        {/* Delivery Options */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.divider },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Truck size={22} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.title }]}>
              Delivery Speed
            </Text>
          </View>
          <View
            style={[
              styles.deliveryOption,
              { backgroundColor: colors.surface, borderColor: colors.primary },
            ]}
          >
            <View>
              <Text style={[styles.deliveryTitle, { color: colors.title }]}>
                Express Delivery
              </Text>
              <Text style={[styles.deliverySub, { color: colors.sub }]}>
                Guaranteed by tomorrow morning
              </Text>
            </View>
            <Text style={[styles.deliveryFree, { color: colors.success }]}>FREE</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.placeOrderButton, { backgroundColor: colors.primary }]}
          onPress={handleplaceorder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.placeOrderButtonText}>CONFIRM & PLACE ORDER</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  content: { flex: 1, padding: 16 },
  section: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  form: { gap: 10 },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
  },
  row: { flexDirection: "row", gap: 10 },
  halfInput: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
  },
  deliveryOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  deliveryTitle: { fontSize: 14, fontWeight: "700" },
  deliverySub: { fontSize: 12, marginTop: 2 },
  deliveryFree: { fontSize: 13, fontWeight: "700" },
  placeOrderButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  placeOrderButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
