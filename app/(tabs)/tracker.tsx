// app/(tabs)/tracker.tsx
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { Btn, ProgressBar } from "../../components/ui";
import { FIELD_ICONS } from "../../constants/data";
import {
    Colors,
    PhaseColors,
    Radius,
    Shadow,
    Spacing,
    StatusConfig,
} from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";
import { storageService } from "../../services/storageService";
import { Phase, Progress, Roadmap } from "../../types";

export default function TrackerScreen() {
  const { user } = useAuth();
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, Progress>>({});
  const [activeRm, setActiveRm] = useState<Roadmap | null>(null);
  const [modal, setModal] = useState<{
    phaseIdx: number;
    nextPhase: Phase | null;
  } | null>(null);

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

  const activeProgress = activeRm ? progressMap[activeRm.id] : null;
  const phases = activeRm?.phases || [];

  function getStatus(i: number): "locked" | "current" | "completed" {
    if (!activeProgress) return "locked";
    if (activeProgress.completedPhases.includes(i)) return "completed";
    if (i === activeProgress.currentPhase) return "current";
    return "locked";
  }

  async function toggleCheck(phaseIdx: number, taskIdx: number) {
    if (!activeRm || !activeProgress || !user) return;
    const updated: Progress = {
      ...activeProgress,
      checks: {
        ...activeProgress.checks,
        [phaseIdx]: {
          ...activeProgress.checks[phaseIdx],
          [taskIdx]: !activeProgress.checks[phaseIdx]?.[taskIdx],
        },
      },
    };
    await storageService.saveProgress(user.id, activeRm.id, updated);
    setProgressMap((pm) => ({ ...pm, [activeRm.id]: updated }));
  }

  async function completePhase(phaseIdx: number) {
    if (!activeRm || !activeProgress || !user) return;
    const newDone = [...new Set([...activeProgress.completedPhases, phaseIdx])];
    const nextIdx = phaseIdx + 1 < phases.length ? phaseIdx + 1 : phaseIdx;
    const updated: Progress = {
      ...activeProgress,
      completedPhases: newDone,
      currentPhase: nextIdx,
    };
    await storageService.saveProgress(user.id, activeRm.id, updated);
    setProgressMap((pm) => ({ ...pm, [activeRm.id]: updated }));
    setModal({ phaseIdx, nextPhase: phases[phaseIdx + 1] || null });
  }

  // ── Select roadmap screen ──────────────────────────────────────────────────
  if (!activeRm) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <Text style={s.headerTitle}>Progress Tracker</Text>
          <Text style={s.headerSub}>Select a roadmap to track</Text>
        </View>
        <ScrollView contentContainerStyle={s.scroll}>
          {roadmaps.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyIcon}>📊</Text>
              <Text style={s.emptyTitle}>No roadmaps yet</Text>
              <Text style={s.emptySub}>
                Generate a roadmap first, then come back to track your progress.
              </Text>
            </View>
          ) : (
            <>
              <Text style={s.sectionLabel}>Choose a Roadmap</Text>
              {roadmaps.map((rm) => {
                const p = progressMap[rm.id];
                const total = rm.phases?.length || 0;
                const done = p?.completedPhases?.length || 0;
                const pct = total ? Math.round((done / total) * 100) : 0;
                return (
                  <TouchableOpacity
                    key={rm.id}
                    style={[s.selectCard, Shadow.sm]}
                    onPress={() => setActiveRm(rm)}
                    activeOpacity={0.85}
                  >
                    <View style={s.selectCardTop}>
                      <View
                        style={[
                          s.selectIcon,
                          { backgroundColor: PhaseColors[0].bg },
                        ]}
                      >
                        <Text style={{ fontSize: 22 }}>
                          {FIELD_ICONS[rm.form?.field] || "💻"}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.selectTitle} numberOfLines={1}>
                          {rm.title}
                        </Text>
                        <Text style={s.selectSub}>
                          {rm.form?.field} · {done}/{total} phases
                        </Text>
                      </View>
                      <Text style={{ fontSize: 22, color: Colors.muted2 }}>
                        ›
                      </Text>
                    </View>
                    <ProgressBar pct={pct} height={5} />
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Active tracker ─────────────────────────────────────────────────────────
  const compCount = activeProgress?.completedPhases.length || 0;
  const overallPct = phases.length
    ? Math.round((compCount / phases.length) * 100)
    : 0;
  const allDone = compCount === phases.length && phases.length > 0;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle} numberOfLines={1}>
            {activeRm.title}
          </Text>
          <Text style={s.headerSub}>
            {compCount}/{phases.length} phases complete
          </Text>
        </View>
        <TouchableOpacity onPress={() => setActiveRm(null)}>
          <Text
            style={{ fontSize: 14, fontWeight: "700", color: Colors.primary }}
          >
            Switch
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Overall progress */}
        <View style={s.overallCard}>
          <View style={s.overallTop}>
            <View>
              <Text style={s.overallTitle}>Overall Progress</Text>
              <Text style={s.overallSub}>
                {activeRm.totalMonths}mo roadmap · {activeRm.weeklyHours}h/wk
              </Text>
            </View>
            <Text style={s.overallPct}>
              {overallPct}
              <Text style={{ fontSize: 18, fontWeight: "400", opacity: 0.7 }}>
                %
              </Text>
            </Text>
          </View>
          <View style={s.overallBar}>
            <View
              style={[s.overallBarFill, { width: `${overallPct}%` as any }]}
            />
          </View>
          <View style={s.overallStats}>
            {[
              ["Done", compCount],
              ["Left", phases.length - compCount],
              ["Total", phases.length],
            ].map(([l, v]) => (
              <View key={l as string}>
                <Text style={s.oStatVal}>{v}</Text>
                <Text style={s.oStatLbl}>{l}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pipeline */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.pipeline}
          contentContainerStyle={s.pipelineInner}
        >
          {phases.map((ph, i) => {
            const st = getStatus(i);
            const c = PhaseColors[i % PhaseColors.length];
            return (
              <React.Fragment key={ph.number}>
                <View style={s.pipeNode}>
                  <View
                    style={[
                      s.pipeDot,
                      st === "locked" && s.pipeDotLocked,
                      st === "current" && {
                        borderColor: c.solid,
                        backgroundColor: c.bg,
                      },
                      st === "completed" && {
                        borderColor: Colors.success,
                        backgroundColor: Colors.success,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        s.pipeDotText,
                        st === "current" && { color: c.text },
                        st === "completed" && { color: "#fff" },
                      ]}
                    >
                      {st === "completed" ? "✓" : ph.number}
                    </Text>
                  </View>
                  <Text
                    style={[
                      s.pipeLabel,
                      st === "current" && { color: c.text },
                      st === "completed" && { color: Colors.success },
                    ]}
                    numberOfLines={1}
                  >
                    {ph.name}
                  </Text>
                </View>
                {i < phases.length - 1 && (
                  <View
                    style={[
                      s.pipeConn,
                      st === "completed" && { backgroundColor: Colors.success },
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </ScrollView>

        {/* All done celebration */}
        {allDone ? (
          <View style={s.allDone}>
            <Text style={s.trophyEmoji}>🏆</Text>
            <Text style={s.allDoneTitle}>Roadmap Complete!</Text>
            <Text style={s.allDoneSub}>
              You've finished every phase. Your skills are ready — time to build
              something great!
            </Text>
          </View>
        ) : (
          phases.map((ph, i) => (
            <PhaseTrackCard
              key={i}
              phase={ph}
              idx={i}
              status={getStatus(i)}
              checks={activeProgress?.checks[i] || {}}
              onToggle={(ti) => toggleCheck(i, ti)}
              onComplete={() => completePhase(i)}
            />
          ))
        )}
      </ScrollView>

      {/* Completion modal */}
      {modal && (
        <Modal
          transparent
          animationType="slide"
          visible={!!modal}
          onRequestClose={() => setModal(null)}
        >
          <View style={s.modalBg}>
            <View style={s.modalSheet}>
              <View style={s.modalHandle} />
              <Text style={s.modalEmoji}>{modal.nextPhase ? "🎉" : "🏆"}</Text>
              <Text style={s.modalTitle}>
                {modal.nextPhase
                  ? `Phase ${phases[modal.phaseIdx].number} Complete!`
                  : "All Done! 🎓"}
              </Text>
              <Text style={s.modalSub}>
                {modal.nextPhase
                  ? phases[modal.phaseIdx].milestone
                  : `You've completed all ${phases.length} phases. Time to apply your skills!`}
              </Text>
              {modal.nextPhase && (
                <View style={s.modalNext}>
                  <Text style={s.modalNextLbl}>UP NEXT</Text>
                  <Text style={s.modalNextName}>
                    Phase {modal.nextPhase.number}: {modal.nextPhase.name}
                  </Text>
                  <Text style={s.modalNextDur}>
                    ⏱ {modal.nextPhase.duration}
                  </Text>
                </View>
              )}
              <View style={{ gap: 10 }}>
                {modal.nextPhase && (
                  <Btn
                    label={`⚡ Start Phase ${modal.nextPhase.number}`}
                    onPress={() => setModal(null)}
                    variant="success"
                    style={{ width: "100%" }}
                  />
                )}
                <Btn
                  label="Close"
                  onPress={() => setModal(null)}
                  variant="outline"
                  style={{ width: "100%" }}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

// ── PhaseTrackCard ────────────────────────────────────────────────────────────
function MiniRing({ pct, color }: { pct: number; color: string }) {
  const r = 20,
    circ = 2 * Math.PI * r;
  return (
    <View style={{ width: 48, height: 48, position: "relative" }}>
      <Svg width="48" height="48" style={{ transform: [{ rotate: "-90deg" }] }}>
        <Circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke={Colors.bg2}
          strokeWidth="4"
        />
        <Circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={`${(pct / 100) * circ} ${circ}`}
          strokeLinecap="round"
        />
      </Svg>
      <View
        style={{
          position: "absolute",
          inset: 0,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: "900", color }}>{pct}%</Text>
      </View>
    </View>
  );
}

function PhaseTrackCard({
  phase,
  idx,
  status,
  checks,
  onToggle,
  onComplete,
}: {
  phase: Phase;
  idx: number;
  status: "locked" | "current" | "completed";
  checks: Record<number, boolean>;
  onToggle: (i: number) => void;
  onComplete: () => void;
}) {
  const [open, setOpen] = useState(status === "current");
  const c = PhaseColors[idx % PhaseColors.length];
  const sc = StatusConfig[status];
  const items = phase.checklist || phase.topics?.slice(0, 5) || [];
  const doneCount = items.filter((_, i) => checks[i]).length;
  const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0;
  const allDone = doneCount === items.length && items.length > 0;

  return (
    <View
      style={[
        ts.card,
        status === "current" && ts.cardCurrent,
        status === "completed" && ts.cardDone,
        status === "locked" && ts.cardLocked,
      ]}
    >
      <TouchableOpacity
        style={ts.cardHdr}
        activeOpacity={0.8}
        onPress={() => status !== "locked" && setOpen((o) => !o)}
        disabled={status === "locked"}
      >
        <View style={[ts.phaseTag, { backgroundColor: c.bg }]}>
          <Text style={[ts.phaseTagText, { color: c.text }]}>
            P{phase.number}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={ts.phaseLbl}>PHASE {phase.number}</Text>
          <Text style={ts.phaseName}>{phase.name}</Text>
          <Text style={ts.phaseDur}>⏱ {phase.duration}</Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 6 }}>
          <View
            style={[
              ts.statusPill,
              { backgroundColor: sc.bg, borderColor: sc.border },
            ]}
          >
            <Text style={{ fontSize: 11, fontWeight: "800", color: sc.color }}>
              {sc.icon} {sc.label}
            </Text>
          </View>
          {status !== "locked" && (
            <Text
              style={{ fontSize: 11, color: Colors.muted, fontWeight: "700" }}
            >
              {doneCount}/{items.length}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {open && status !== "locked" && (
        <View style={ts.cardBody}>
          {/* Ring + progress */}
          <View style={ts.ringRow}>
            <MiniRing
              pct={pct}
              color={status === "completed" ? Colors.success : c.text}
            />
            <View>
              <Text style={ts.ringPct}>{pct}% complete</Text>
              <Text style={ts.ringSub}>
                {doneCount} of {items.length} tasks done
              </Text>
            </View>
          </View>

          {/* Checklist */}
          <View style={{ marginBottom: 12, gap: 7 }}>
            {items.map((task, i) => (
              <TouchableOpacity
                key={i}
                style={[ts.chk, checks[i] && ts.chkOn]}
                onPress={() => status !== "completed" && onToggle(i)}
                activeOpacity={0.8}
                disabled={status === "completed"}
              >
                <View style={[ts.chkBox, checks[i] && ts.chkBoxOn]}>
                  {checks[i] && (
                    <Text
                      style={{ color: "#fff", fontSize: 11, fontWeight: "900" }}
                    >
                      ✓
                    </Text>
                  )}
                </View>
                <Text style={[ts.chkText, checks[i] && ts.chkTextDone]}>
                  {task}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Milestone */}
          <View style={ts.milestone}>
            <Text style={ts.milestoneText}>🏁 {phase.milestone}</Text>
          </View>

          {/* Complete button */}
          {status === "current" && (
            <Btn
              label={
                allDone
                  ? `✅ Mark Phase ${phase.number} Complete`
                  : `${items.length - doneCount} tasks remaining`
              }
              onPress={onComplete}
              disabled={!allDone}
              variant={allDone ? "success" : "outline"}
              style={{ marginTop: 12, width: "100%" }}
            />
          )}
          {status === "completed" && (
            <Text
              style={{
                color: Colors.success,
                fontWeight: "800",
                fontSize: 13,
                marginTop: 4,
              }}
            >
              ✅ Phase complete — great work!
            </Text>
          )}
        </View>
      )}

      {status === "locked" && (
        <View style={ts.cardBody}>
          <View style={ts.lockedNote}>
            <Text
              style={{ fontSize: 13, color: Colors.muted, fontWeight: "700" }}
            >
              🔒 Complete Phase {phase.number - 1} to unlock.
            </Text>
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
  sectionLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  empty: { alignItems: "center", paddingVertical: 60 },
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
  },
  selectCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
  },
  selectCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  selectIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  selectTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 2,
  },
  selectSub: { fontSize: 12, color: Colors.muted },
  overallCard: {
    margin: 12,
    borderRadius: 20,
    padding: 18,
    backgroundColor: Colors.primary,
  },
  overallTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  overallTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
    opacity: 0.9,
  },
  overallSub: { fontSize: 11, color: "#fff", opacity: 0.65, marginTop: 2 },
  overallPct: {
    fontSize: 38,
    fontWeight: "900",
    color: "#fff",
    lineHeight: 40,
  },
  overallBar: {
    height: 7,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 4,
    marginBottom: 12,
    overflow: "hidden",
  },
  overallBarFill: {
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 4,
  },
  overallStats: { flexDirection: "row", gap: 24 },
  oStatVal: { fontSize: 18, fontWeight: "900", color: "#fff" },
  oStatLbl: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.65)",
    marginTop: 1,
  },
  pipeline: { marginHorizontal: 12, marginBottom: 10 },
  pipelineInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  pipeNode: { alignItems: "center", gap: 4 },
  pipeDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  pipeDotLocked: { borderColor: Colors.border2, backgroundColor: Colors.bg2 },
  pipeDotText: { fontSize: 12, fontWeight: "900", color: Colors.muted2 },
  pipeLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.muted2,
    maxWidth: 54,
    textAlign: "center",
  },
  pipeConn: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    minWidth: 12,
    marginBottom: 22,
  },
  allDone: { alignItems: "center", padding: 40 },
  trophyEmoji: { fontSize: 64, marginBottom: 16 },
  allDoneTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: Colors.text,
    marginBottom: 10,
  },
  allDoneSub: {
    fontSize: 14,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 22,
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border2,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalEmoji: { fontSize: 48, textAlign: "center", marginBottom: 14 },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 18,
  },
  modalNext: {
    backgroundColor: Colors.bg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  modalNextLbl: {
    fontSize: 10,
    fontWeight: "900",
    color: Colors.muted2,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  modalNextName: { fontSize: 15, fontWeight: "800", color: Colors.text },
  modalNextDur: { fontSize: 12, color: Colors.muted, marginTop: 2 },
});

const ts = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginHorizontal: 12,
    marginBottom: 10,
    overflow: "hidden",
  },
  cardCurrent: { borderColor: Colors.primary },
  cardDone: { borderColor: Colors.success },
  cardLocked: { opacity: 0.55 },
  cardHdr: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 14,
    backgroundColor: Colors.bg,
  },
  phaseTag: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  phaseTagText: { fontSize: 12, fontWeight: "900" },
  phaseLbl: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.muted2,
    letterSpacing: 0.5,
  },
  phaseName: { fontSize: 15, fontWeight: "800", color: Colors.text },
  phaseDur: { fontSize: 11, color: Colors.muted, marginTop: 1 },
  statusPill: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  ringRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ringPct: { fontSize: 15, fontWeight: "800", color: Colors.text },
  ringSub: { fontSize: 12, color: Colors.muted, marginTop: 1 },
  chk: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 11,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chkOn: { backgroundColor: Colors.successLight, borderColor: "#BBF7D0" },
  chkBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
    marginTop: 1,
    flexShrink: 0,
  },
  chkBoxOn: { backgroundColor: Colors.success, borderColor: Colors.success },
  chkText: { fontSize: 13, color: Colors.text2, lineHeight: 20, flex: 1 },
  chkTextDone: { color: Colors.muted2, textDecorationLine: "line-through" },
  milestone: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    padding: 11,
  },
  milestoneText: { fontSize: 13, color: Colors.primary, lineHeight: 20 },
  lockedNote: { backgroundColor: Colors.bg2, borderRadius: 10, padding: 12 },
});
