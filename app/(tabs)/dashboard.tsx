// app/(tabs)/dashboard.tsx
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProgressBar } from "../../components/ui";
import { FIELD_ICONS } from "../../constants/data";
import {
    Colors,
    PhaseColors,
    Radius,
    Shadow,
    Spacing,
} from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";
import { storageService } from "../../services/storageService";
import { Progress, Roadmap } from "../../types";

export default function DashboardScreen() {
  const { user } = useAuth();
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, Progress>>({});
  const [refreshing, setRefreshing] = useState(false);

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

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const hour = new Date().getHours();
  const greet =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] || "there";

  const totalDone = roadmaps.reduce(
    (s, rm) => s + (progressMap[rm.id]?.completedPhases?.length || 0),
    0,
  );
  const totalPhases = roadmaps.reduce(
    (s, rm) => s + (rm.phases?.length || 0),
    0,
  );
  const overallPct = totalPhases
    ? Math.round((totalDone / totalPhases) * 100)
    : 0;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greet}>
              {greet}, {firstName} 👋
            </Text>
            <Text style={s.greetSub}>Here's your learning journey</Text>
          </View>
          <TouchableOpacity
            style={s.avatar}
            onPress={() => router.push("/(tabs)/profile")}
          >
            <Text style={s.avatarText}>{firstName[0]?.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <StatCard
            icon="📋"
            value={roadmaps.length}
            label="Roadmaps"
            color={Colors.primary}
            bg={Colors.primaryLight}
          />
          <StatCard
            icon="✅"
            value={totalDone}
            label="Phases Done"
            color={Colors.success}
            bg={Colors.successLight}
          />
          <StatCard
            icon="📈"
            value={`${overallPct}%`}
            label="Progress"
            color={Colors.purple}
            bg={Colors.purpleLight}
          />
        </View>

        {/* Recent Roadmaps */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Recent Roadmaps</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/build")}>
            <Text style={s.sectionLink}>+ New</Text>
          </TouchableOpacity>
        </View>

        {roadmaps.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>🗺</Text>
            <Text style={s.emptyTitle}>No roadmaps yet</Text>
            <Text style={s.emptySub}>
              Generate your first personalised learning roadmap to start your
              journey.
            </Text>
            <TouchableOpacity
              style={s.emptyBtn}
              onPress={() => router.push("/(tabs)/build")}
            >
              <Text style={s.emptyBtnText}>✨ Create My First Roadmap</Text>
            </TouchableOpacity>
          </View>
        ) : (
          roadmaps
            .slice(0, 5)
            .map((rm) => (
              <MiniRoadmapCard
                key={rm.id}
                rm={rm}
                progress={progressMap[rm.id]}
              />
            ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
  bg,
}: {
  icon: string;
  value: number | string;
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <View style={[s.statCard, Shadow.sm]}>
      <View style={[s.statIcon, { backgroundColor: bg }]}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <Text style={[s.statVal, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function MiniRoadmapCard({
  rm,
  progress,
}: {
  rm: Roadmap;
  progress?: Progress;
}) {
  const phases = rm.phases?.length || 0;
  const done = progress?.completedPhases?.length || 0;
  const pct = phases ? Math.round((done / phases) * 100) : 0;
  const icon = FIELD_ICONS[rm.form?.field] || "💻";
  const c = PhaseColors[0];

  return (
    <TouchableOpacity
      style={[s.rmCard, Shadow.sm]}
      onPress={() =>
        router.push({ pathname: "/(tabs)/roadmaps", params: { openId: rm.id } })
      }
      activeOpacity={0.8}
    >
      <View style={s.rmCardTop}>
        <View style={[s.rmIcon, { backgroundColor: c.bg }]}>
          <Text style={{ fontSize: 22 }}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.rmTitle} numberOfLines={1}>
            {rm.title}
          </Text>
          <Text style={s.rmSub}>
            {rm.form?.field} · {rm.form?.goal}
          </Text>
        </View>
        {pct === 100 && (
          <View style={[s.doneChip]}>
            <Text style={s.doneChipText}>✅</Text>
          </View>
        )}
      </View>
      <View style={s.rmProgressRow}>
        <ProgressBar pct={pct} height={5} style={{ flex: 1 }} />
        <Text style={s.rmPct}>{pct}%</Text>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.xl, paddingBottom: 32 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greet: { fontSize: 22, fontWeight: "800", color: Colors.text },
  greetSub: { fontSize: 13, color: Colors.muted, marginTop: 2 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: Colors.white, fontWeight: "800", fontSize: 16 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 28 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statVal: { fontSize: 24, fontWeight: "800", color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.muted, marginTop: 2 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.text },
  sectionLink: { fontSize: 14, fontWeight: "700", color: Colors.primary },
  empty: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.border,
    padding: 32,
    alignItems: "center",
  },
  emptyIcon: { fontSize: 48, marginBottom: 12, opacity: 0.4 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyBtnText: { color: Colors.white, fontWeight: "700", fontSize: 14 },
  rmCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 10,
  },
  rmCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  rmIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rmTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 2,
  },
  rmSub: { fontSize: 12, color: Colors.muted },
  rmProgressRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  rmPct: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
    width: 36,
    textAlign: "right",
  },
  doneChip: {
    backgroundColor: Colors.successLight,
    borderRadius: Radius.full,
    padding: 4,
  },
  doneChipText: { fontSize: 16 },
});
