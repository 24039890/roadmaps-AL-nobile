// app/(tabs)/roadmaps.tsx
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    Badge,
    Btn,
    ProgressBar
} from "../../components/ui";
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
import { Phase, Progress, Roadmap } from "../../types";

export default function RoadmapsScreen() {
  const { user } = useAuth();
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, Progress>>({});
  const [selected, setSelected] = useState<Roadmap | null>(null);

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

  async function handleDelete(id: string) {
    Alert.alert(
      "Delete Roadmap",
      "This will permanently delete this roadmap and all progress.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await storageService.deleteRoadmap(user!.id, id);
            if (selected?.id === id) setSelected(null);
            load();
          },
        },
      ],
    );
  }

  // ── Detail view ────────────────────────────────────────────────────────────
  if (selected) {
    return (
      <RoadmapDetail roadmap={selected} onBack={() => setSelected(null)} />
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>My Roadmaps</Text>
          <Text style={s.headerSub}>{roadmaps.length} saved</Text>
        </View>
        <Btn
          label="+ New"
          onPress={() => router.push("/(tabs)/build")}
          size="sm"
        />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {roadmaps.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📋</Text>
            <Text style={s.emptyTitle}>No roadmaps yet</Text>
            <Text style={s.emptySub}>
              Tap "New" to generate your first AI-powered learning roadmap.
            </Text>
            <Btn
              label="✨ Create Roadmap"
              onPress={() => router.push("/(tabs)/build")}
            />
          </View>
        ) : (
          roadmaps.map((rm) => {
            const prog = progressMap[rm.id];
            const phases = rm.phases?.length || 0;
            const done = prog?.completedPhases?.length || 0;
            const pct = phases ? Math.round((done / phases) * 100) : 0;
            const icon = FIELD_ICONS[rm.form?.field] || "💻";
            const c = PhaseColors[0];

            return (
              <TouchableOpacity
                key={rm.id}
                style={[s.card, Shadow.sm]}
                onPress={() => setSelected(rm)}
                activeOpacity={0.85}
              >
                <View style={s.cardTop}>
                  <View style={[s.icon, { backgroundColor: c.bg }]}>
                    <Text style={{ fontSize: 22 }}>{icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.cardTitle} numberOfLines={1}>
                      {rm.title}
                    </Text>
                    <Text style={s.cardSub}>
                      {rm.form?.field} ·{" "}
                      {new Date(rm.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                <View style={s.progressRow}>
                  <ProgressBar pct={pct} style={{ flex: 1 }} />
                  <Text style={s.pct}>{pct}%</Text>
                </View>

                <View style={s.pillRow}>
                  <Badge
                    label={`📅 ${rm.totalMonths}mo`}
                    color={Colors.primary}
                    bg={Colors.primaryLight}
                    border="#BFDBFE"
                  />
                  <Badge
                    label={`⚡ ${rm.weeklyHours}h/wk`}
                    color={Colors.purple}
                    bg={Colors.purpleLight}
                    border="#DDD6FE"
                  />
                  <Badge
                    label={rm.form?.level || ""}
                    color={Colors.muted}
                    bg={Colors.bg2}
                    border={Colors.border}
                  />
                  {pct === 100 && (
                    <Badge
                      label="✅ Complete"
                      color={Colors.success}
                      bg={Colors.successLight}
                      border="#BBF7D0"
                    />
                  )}
                </View>

                <View style={s.actionRow}>
                  <Btn
                    label="View"
                    onPress={() => setSelected(rm)}
                    variant="outline"
                    size="sm"
                    style={{ flex: 1 }}
                  />
                  <Btn
                    label="Track"
                    onPress={() => router.push("/(tabs)/tracker")}
                    variant="success"
                    size="sm"
                    style={{ flex: 1 }}
                  />
                  <Btn
                    label="✕"
                    onPress={() => handleDelete(rm.id)}
                    variant="danger"
                    size="sm"
                  />
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── RoadmapDetail inline component ──────────────────────────────────────────
function RoadmapDetail({
  roadmap,
  onBack,
}: {
  roadmap: Roadmap;
  onBack: () => void;
}) {
  return (
    <SafeAreaView style={s.safe}>
      <View style={[s.header, { paddingBottom: 12 }]}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Btn
          label="📊 Track"
          onPress={() => router.push("/(tabs)/tracker")}
          size="sm"
          variant="success"
        />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero */}
        <View style={s.hero}>
          <Text style={s.heroTitle}>🗺 {roadmap.title}</Text>
          <Text style={s.heroSub}>{roadmap.summary}</Text>
          <View style={s.heroPills}>
            {[
              `📅 ${roadmap.totalMonths}mo`,
              `⚡ ${roadmap.weeklyHours}h/wk`,
              `🎯 ${roadmap.form?.goal}`,
              `📊 ${roadmap.form?.level}`,
            ].map((p) => (
              <View key={p} style={s.heroPill}>
                <Text style={s.heroPillText}>{p}</Text>
              </View>
            ))}
          </View>
        </View>

        {roadmap.phases?.map((phase, idx) => (
          <PhaseCard
            key={idx}
            phase={phase}
            idx={idx}
            defaultOpen={idx === 0}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function PhaseCard({
  phase,
  idx,
  defaultOpen,
}: {
  phase: Phase;
  idx: number;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const c = PhaseColors[idx % PhaseColors.length];

  return (
    <View style={[s.phaseCard, Shadow.sm]}>
      <TouchableOpacity
        style={s.phaseHdr}
        onPress={() => setOpen((o) => !o)}
        activeOpacity={0.8}
      >
        <View style={[s.phaseNum, { backgroundColor: c.bg }]}>
          <Text style={[s.phaseNumText, { color: c.text }]}>
            P{phase.number}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.phaseName}>{phase.name}</Text>
          <Text style={s.phaseMeta}>
            ⏱ {phase.duration} · {phase.goal}
          </Text>
        </View>
        <Text style={s.phaseChevron}>{open ? "⌃" : "⌄"}</Text>
      </TouchableOpacity>

      {open && (
        <View style={s.phaseBody}>
          {[
            { key: "topics", label: "Topics", color: Colors.primary },
            { key: "tools", label: "Tools", color: Colors.purple },
            { key: "resources", label: "Resources", color: Colors.amber },
            { key: "exercises", label: "Exercises", color: Colors.success },
          ].map(({ key, label, color }) => (
            <View key={key} style={{ marginBottom: 12 }}>
              <View
                style={[
                  s.secTag,
                  { backgroundColor: color + "18", borderColor: color + "40" },
                ]}
              >
                <Text style={[s.secTagText, { color }]}>{label}</Text>
              </View>
              {(phase as any)[key]?.map((item: string, i: number) => (
                <Text key={i} style={s.bullet}>
                  • {item}
                </Text>
              ))}
            </View>
          ))}

          <View style={s.projBox}>
            <Text style={s.projTitle}>🚀 {phase.project?.name}</Text>
            <Text style={s.projDesc}>{phase.project?.description}</Text>
          </View>

          <View style={s.milestoneBox}>
            <Text style={s.milestoneText}>🏁 {phase.milestone}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: Colors.text },
  headerSub: { fontSize: 13, color: Colors.muted, marginTop: 2 },
  empty: { alignItems: "center", paddingVertical: 48, paddingHorizontal: 24 },
  emptyIcon: { fontSize: 48, marginBottom: 12, opacity: 0.35 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 2,
  },
  cardSub: { fontSize: 12, color: Colors.muted },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  pct: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.primary,
    width: 36,
    textAlign: "right",
  },
  pillRow: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginBottom: 12 },
  actionRow: { flexDirection: "row", gap: 8 },
  backBtn: { paddingVertical: 8 },
  backText: { fontSize: 15, fontWeight: "700", color: Colors.primary },
  hero: {
    margin: 12,
    borderRadius: 20,
    padding: 20,
    background: "#1E3B8A",
    overflow: "hidden",
    backgroundColor: "#2563EB",
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 6,
    lineHeight: 24,
  },
  heroSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 20,
    marginBottom: 12,
  },
  heroPills: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  heroPill: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  heroPillText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  phaseCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 12,
    marginBottom: 10,
    overflow: "hidden",
  },
  phaseHdr: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
  },
  phaseNum: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  phaseNumText: { fontSize: 13, fontWeight: "900" },
  phaseName: { fontSize: 15, fontWeight: "800", color: Colors.text },
  phaseMeta: { fontSize: 11, color: Colors.muted, marginTop: 1 },
  phaseChevron: { fontSize: 18, color: Colors.muted2 },
  phaseBody: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 14,
    backgroundColor: Colors.bg,
  },
  secTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
    marginBottom: 7,
  },
  secTagText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  bullet: {
    fontSize: 13,
    color: Colors.text2,
    paddingVertical: 2,
    paddingLeft: 4,
    lineHeight: 20,
  },
  projBox: {
    backgroundColor: Colors.successLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    padding: 12,
    marginTop: 8,
  },
  projTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.success,
    marginBottom: 3,
  },
  projDesc: { fontSize: 12, color: "#166534", lineHeight: 18 },
  milestoneBox: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    padding: 11,
    marginTop: 8,
  },
  milestoneText: { fontSize: 13, color: Colors.primary, lineHeight: 20 },
});
