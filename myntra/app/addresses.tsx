import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, MapPin, Plus, Trash2 } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";

interface Address {
  id: string;
  name: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  type: "Home" | "Work" | "Other";
}

const initialAddresses: Address[] = [
  {
    id: "1",
    name: "User Account",
    phone: "9876543210",
    line1: "123 Fashion Avenue, Tech Park",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560103",
    type: "Home",
  },
];

export default function Addresses() {
  const router = useRouter();
  const { colors } = useTheme();
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    line1: "",
    city: "",
    state: "",
    pincode: "",
    type: "Home" as "Home" | "Work" | "Other",
  });

  const handleDelete = (id: string) => {
    Alert.alert("Delete Address", "Are you sure you want to remove this address?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => setAddresses((prev) => prev.filter((a) => a.id !== id)),
      },
    ]);
  };

  const handleAdd = () => {
    if (!form.name || !form.phone || !form.line1 || !form.city || !form.pincode) {
      Alert.alert("Error", "Please fill all required fields.");
      return;
    }
    const newAddress: Address = {
      id: Date.now().toString(),
      ...form,
    };
    setAddresses((prev) => [...prev, newAddress]);
    setShowForm(false);
    setForm({ name: "", phone: "", line1: "", city: "", state: "", pincode: "", type: "Home" });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.header, borderBottomColor: colors.headerBorder },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.title} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.title }]}>My Addresses</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {addresses.length === 0 && !showForm && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconCircle, { backgroundColor: colors.primaryLight }]}>
              <MapPin size={48} color={colors.primary} />
            </View>
            <Text style={[styles.emptyText, { color: colors.title }]}>No saved addresses yet</Text>
          </View>
        )}

        {addresses.map((addr) => (
          <View
            key={addr.id}
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.divider },
            ]}
          >
            <View style={styles.cardTop}>
              <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>{addr.type}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDelete(addr.id)}
                style={[styles.deleteBtn, { backgroundColor: colors.surface }]}
              >
                <Trash2 size={16} color={colors.error} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.name, { color: colors.title }]}>{addr.name}</Text>
            <Text style={[styles.addressText, { color: colors.sub }]}>{addr.line1}</Text>
            <Text style={[styles.addressText, { color: colors.sub }]}>
              {addr.city}, {addr.state} - {addr.pincode}
            </Text>
            <Text style={[styles.phoneText, { color: colors.sub }]}>Phone: {addr.phone}</Text>
          </View>
        ))}

        {showForm && (
          <View
            style={[
              styles.formCard,
              { backgroundColor: colors.card, borderColor: colors.divider },
            ]}
          >
            <Text style={[styles.formTitle, { color: colors.title }]}>Add New Address</Text>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
              placeholder="Full Name *"
              placeholderTextColor={colors.placeholderText}
              value={form.name}
              onChangeText={(t) => setForm({ ...form, name: t })}
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
              placeholder="Mobile Number *"
              placeholderTextColor={colors.placeholderText}
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(t) => setForm({ ...form, phone: t })}
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
              placeholder="House / Flat / Street *"
              placeholderTextColor={colors.placeholderText}
              value={form.line1}
              onChangeText={(t) => setForm({ ...form, line1: t })}
            />
            <View style={styles.row}>
              <TextInput
                style={[
                  styles.inputHalf,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
                placeholder="City *"
                placeholderTextColor={colors.placeholderText}
                value={form.city}
                onChangeText={(t) => setForm({ ...form, city: t })}
              />
              <TextInput
                style={[
                  styles.inputHalf,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
                placeholder="Pincode *"
                placeholderTextColor={colors.placeholderText}
                keyboardType="numeric"
                value={form.pincode}
                onChangeText={(t) => setForm({ ...form, pincode: t })}
              />
            </View>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
              placeholder="State"
              placeholderTextColor={colors.placeholderText}
              value={form.state}
              onChangeText={(t) => setForm({ ...form, state: t })}
            />

            {/* Type selector */}
            <View style={styles.typeRow}>
              {(["Home", "Work", "Other"] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor: form.type === t ? colors.primary : colors.surface,
                      borderColor: form.type === t ? colors.primary : colors.divider,
                    },
                  ]}
                  onPress={() => setForm({ ...form, type: t })}
                >
                  <Text
                    style={[
                      styles.typeBtnText,
                      { color: form.type === t ? "#fff" : colors.title },
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.divider }]}
                onPress={() => setShowForm(false)}
              >
                <Text style={[styles.cancelText, { color: colors.sub }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleAdd}
              >
                <Text style={styles.saveText}>Save Address</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!showForm && (
          <TouchableOpacity
            style={[styles.addBtn, { borderColor: colors.primary, backgroundColor: colors.card }]}
            onPress={() => setShowForm(true)}
          >
            <Plus size={20} color={colors.primary} />
            <Text style={[styles.addBtnText, { color: colors.primary }]}>Add New Address</Text>
          </TouchableOpacity>
        )}

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
  emptyState: { alignItems: "center", paddingTop: 40 },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  emptyText: { fontSize: 16, fontWeight: "600" },
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  name: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  addressText: { fontSize: 13, marginBottom: 2, lineHeight: 18 },
  phoneText: { fontSize: 12, marginTop: 6 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    marginTop: 8,
    gap: 8,
  },
  addBtnText: { fontSize: 14, fontWeight: "700" },
  formCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  formTitle: { fontSize: 16, fontWeight: "700", marginBottom: 14 },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  row: { flexDirection: "row", gap: 10, marginBottom: 10 },
  inputHalf: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
  },
  typeRow: { flexDirection: "row", gap: 8, marginVertical: 12 },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  typeBtnText: { fontSize: 13, fontWeight: "600" },
  formActions: { flexDirection: "row", gap: 10, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  cancelText: { fontSize: 14, fontWeight: "600" },
  saveBtn: { flex: 2, padding: 12, borderRadius: 8, alignItems: "center" },
  saveText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
