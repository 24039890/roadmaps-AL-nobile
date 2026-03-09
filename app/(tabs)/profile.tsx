// app/(tabs)/profile.tsx
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Colors, Radius, Shadow, Spacing } from "../../constants/theme";
import { authService } from "../../services/authService";
import { storageService } from "../../services/storageService";
import { useAuth } from "../../hooks/useAuth";
import { Roadmap, Progress } from "../../types";
import { Btn, Divider } from "../../components/ui";

export default function ProfileScreen() {
  const { user, setUser } = useAuth();
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, Progress>>({});

  const load = useCallback(async () => {
    if (!user) return;
    const rms = await storageService.getRoadmaps(user.id);
    setRoadmaps(rms);
    const pm: Record<string, Progress> = {};
    for (const rm of rms) {
      const p = await storageService.getProgress(user.id, rm.id);
      if (p) pm[rm.id] = p;
    }
    setProgressMap(pm);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const totalDone = roadmaps.reduce(
    (s, r) => s + (progressMap[r.id]?.completedPhases?.length || 0),
    0,
  );
  const totalPhases = roadmaps.reduce((s, r) => s + (r.phases?.length || 0), 0);
  const overallPct = totalPhases
    ? Math.round((totalDone / totalPhases) * 100)
    : 0;
  const initials =
    user?.name
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "??";

  async function handleLogout() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await authService.logout();
          setUser(null);
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  const infoRows = [
    { icon: "📧", label: "Email", value: user?.email || "" },
    { icon: "👤", label: "Account", value: "Personal" },
    { icon: "📱", label: "Platform", value: "React Native (Expo)" },
    { icon: "🤖", label: "AI Model", value: "Claude Sonnet" },
    { icon: "🔒", label: "Storage", value: "On-device (AsyncStorage)" },
  ];

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {/* Avatar + Name */}
        <View style={s.avatarSection}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={s.userName}>{user?.name}</Text>
          <Text style={s.userEmail}>{user?.email}</Text>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          {[
            {
              icon: "📋",
              value: roadmaps.length,
              label: "Roadmaps",
              color: Colors.primary,
            },
            {
              icon: "✅",
              value: totalDone,
              label: "Phases Done",
              color: Colors.success,
            },
            {
              icon: "📈",
              value: `${overallPct}%`,
              label: "Progress",
              color: Colors.purple,
            },
          ].map(({ icon, value, label, color }) => (
            <View key={label} style={[s.statCard, Shadow.sm]}>
              <Text style={s.statIcon}>{icon}</Text>
              <Text style={[s.statVal, { color }]}>{value}</Text>
              <Text style={s.statLbl}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Account info */}
        <Text style={s.sectionLabel}>Account Details</Text>
        <View style={[s.infoCard, Shadow.sm]}>
          {infoRows.map(({ icon, label, value }, i) => (
            <View key={label}>
              <View style={s.infoRow}>
                <Text style={s.infoIcon}>{icon}</Text>
                <Text style={s.infoLabel}>{label}</Text>
                <Text style={s.infoValue} numberOfLines={1}>
                  {value}
                </Text>
              </View>
              {i < infoRows.length - 1 && (
                <Divider style={{ marginVertical: 0 }} />
              )}
            </View>
          ))}
        </View>

        {/* Quick actions */}
        <Text style={s.sectionLabel}>Quick Actions</Text>
        <View style={s.actionsCard}>
          <TouchableOpacity
            style={s.actionRow}
            onPress={() => router.push("/(tabs)/build")}
            activeOpacity={0.8}
          >
            <Text style={s.actionIcon}>✨</Text>
            <Text style={s.actionLabel}>Create New Roadmap</Text>
            <Text style={s.actionArrow}>›</Text>
          </TouchableOpacity>
          <Divider style={{ marginVertical: 0 }} />
          <TouchableOpacity
            style={s.actionRow}
            onPress={() => router.push("/(tabs)/roadmaps")}
            activeOpacity={0.8}
          >
            <Text style={s.actionIcon}>📋</Text>
            <Text style={s.actionLabel}>View My Roadmaps</Text>
            <Text style={s.actionArrow}>›</Text>
          </TouchableOpacity>
          <Divider style={{ marginVertical: 0 }} />
          <TouchableOpacity
            style={s.actionRow}
            onPress={() => router.push("/(tabs)/tracker")}
            activeOpacity={0.8}
          >
            <Text style={s.actionIcon}>📊</Text>
            <Text style={s.actionLabel}>Track Progress</Text>
            <Text style={s.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Sign out */}
        <Btn
          label="🚪  Sign Out"
          onPress={handleLogout}
          variant="danger"
          style={{ marginTop: 8 }}
        />

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: Colors.text },
  avatarSection: { alignItems: "center", paddingVertical: 24 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryLight,
    borderWidth: 3,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: { fontSize: 26, fontWeight: "900", color: Colors.primary },
  userName: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 3,
  },
  userEmail: { fontSize: 13, color: Colors.muted },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIcon: { fontSize: 20, marginBottom: 6 },
  statVal: { fontSize: 22, fontWeight: "900" },
  statLbl: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.muted,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    marginBottom: 20,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  infoIcon: { fontSize: 18, width: 24, textAlign: "center" },
  infoLabel: { fontSize: 14, fontWeight: "600", color: Colors.text2, flex: 1 },
  infoValue: {
    fontSize: 13,
    color: Colors.muted,
    maxWidth: "45%",
    textAlign: "right",
  },
  actionsCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  actionIcon: { fontSize: 18, width: 24, textAlign: "center" },
  actionLabel: { fontSize: 14, fontWeight: "700", color: Colors.text, flex: 1 },
  actionArrow: { fontSize: 20, color: Colors.muted2 },
});
