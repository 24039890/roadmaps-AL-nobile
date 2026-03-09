// app/(tabs)/build.tsx
import { router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BodyText,
  Btn,
  Card,
  Chip,
  Field,
  SectionTitle,
} from "../../components/ui";
import {
  FIELDS,
  FRAMEWORKS,
  GOALS,
  LANGUAGES,
  LEVELS,
  LOADING_MESSAGES
} from "../../constants/data";
import {
  Colors,
  Spacing
} from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";
import { generateRoadmap } from "../../services/aiService";
import { initProgress, storageService } from "../../services/storageService";
import { RoadmapForm } from "../../types";

const STEPS = ["Profile", "Goals", "Schedule", "Review"];

const INIT: RoadmapForm = {
  level: "",
  languages: [],
  field: "",
  frameworks: [],
  hours: 15,
  goal: "",
  focus: "",
};

export default function BuildScreen() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<RoadmapForm>(INIT);
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [error, setError] = useState("");

  const patch = (k: keyof RoadmapForm, v: any) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleArr = (k: "languages" | "frameworks", val: string) => {
    const arr = form[k] as string[];
    patch(k, arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const canNext0 = !!form.level && form.languages.length > 0;
  const canNext1 = !!form.field && !!form.goal;

  async function generate() {
    if (!user) return;

    // ── Reset state ──────────────────────────────────────────────────────────
    setLoading(true);
    setError("");
    setLoadStep(0);

    // ── Animate loading steps independently of the API call ──────────────────
    // Steps 0-4 animate on a timer; step 5 (final) only shows on success.
    let currentStep = 0;
    const LAST_ANIMATED = LOADING_MESSAGES.length - 2; // stop one before last
    const timer = setInterval(() => {
      if (currentStep < LAST_ANIMATED) {
        currentStep += 1;
        setLoadStep(currentStep);
      }
    }, 4500);

    // ── API call ─────────────────────────────────────────────────────────────
    let result: any = null;
    let caughtError: string | null = null;

    try {
      result = await generateRoadmap(form);
    } catch (e: any) {
      console.error("[generate] generateRoadmap threw:", e);
      const msg: string = e?.message ?? String(e);

      if (!msg || msg === "undefined") {
        caughtError = "Network error — check your internet connection.";
      } else if (
        msg.includes("not configured") ||
        msg.includes("EXPO_PUBLIC_ANTHROPIC")
      ) {
        caughtError =
          "API key missing.\n\nAdd EXPO_PUBLIC_ANTHROPIC_API_KEY to .env then run: expo start --clear";
      } else if (
        msg.includes("401") ||
        msg.includes("invalid x-api-key") ||
        msg.includes("authentication_error")
      ) {
        caughtError =
          "Invalid API key (401).\n\nCheck your key in .env — no extra spaces or quotes.";
      } else if (msg.includes("403")) {
        caughtError =
          "API key forbidden (403).\n\nYour key may be inactive. Check console.anthropic.com.";
      } else if (msg.includes("429")) {
        caughtError = "Rate limit (429) — wait a minute then try again.";
      } else if (msg.includes("529") || msg.includes("overloaded")) {
        caughtError =
          "Anthropic servers are busy — wait a moment and try again.";
      } else if (
        msg.includes("invalid JSON") ||
        msg.includes("parse") ||
        msg.includes("SyntaxError")
      ) {
        caughtError =
          "AI returned invalid JSON. Please try again — this is usually a one-off.";
      } else if (
        msg.includes("Network request failed") ||
        msg.includes("fetch")
      ) {
        caughtError =
          "Network request failed — check your internet connection.";
      } else {
        caughtError = msg; // show the real message
      }
    } finally {
      clearInterval(timer);
    }

    // ── Handle error ─────────────────────────────────────────────────────────
    if (caughtError || !result) {
      setError(caughtError ?? "Unknown error — please try again.");
      setLoading(false);
      return;
    }

    // ── Success — show final step briefly then navigate ───────────────────────
    setLoadStep(LOADING_MESSAGES.length - 1);
    try {
      const rm = {
        ...result,
        id: `rm_${Date.now()}`,
        createdAt: Date.now(),
        form: { ...form },
      };
      await storageService.saveRoadmap(user.id, rm);
      await storageService.saveProgress(
        user.id,
        rm.id,
        initProgress(rm.id, result.phases?.length || 0),
      );
      await new Promise((r) => setTimeout(r, 800));
      setForm(INIT);
      setStep(0);
      router.push("/(tabs)/roadmaps");
    } catch (saveErr: any) {
      console.error("[generate] Save error:", saveErr);
      setError(
        "Roadmap generated but failed to save: " +
          (saveErr?.message ?? "unknown error"),
      );
    } finally {
      setLoading(false);
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.loadingWrap}>
          <View style={s.spinner} />
          <Text style={s.loadTitle}>Building Your Roadmap</Text>
          <Text style={s.loadSub}>
            Claude AI is crafting your personalised{"\n"}learning path…
          </Text>
          <View style={{ width: "100%", marginTop: 24 }}>
            {LOADING_MESSAGES.map((msg, i) => (
              <View
                key={i}
                style={[
                  s.loadStep,
                  i === loadStep && s.loadStepActive,
                  i < loadStep && s.loadStepDone,
                ]}
              >
                <Text style={{ fontSize: 13, marginRight: 8 }}>
                  {i < loadStep ? "✓" : i === loadStep ? "⟳" : "○"}
                </Text>
                <Text
                  style={[
                    s.loadStepText,
                    i === loadStep && { color: Colors.primary },
                    i < loadStep && { color: Colors.success },
                  ]}
                >
                  {msg}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>New Roadmap</Text>
          <Text style={s.headerSub}>
            Step {step + 1} of {STEPS.length}
          </Text>
        </View>

        {/* Step indicator */}
        <View style={s.stepBar}>
          {STEPS.map((label, i) => (
            <React.Fragment key={label}>
              <View style={s.stepItem}>
                <View
                  style={[
                    s.stepDot,
                    i === step && s.stepDotActive,
                    i < step && s.stepDotDone,
                  ]}
                >
                  <Text
                    style={[
                      s.stepDotText,
                      i <= step && {
                        color: i === step ? Colors.primary : "#fff",
                      },
                    ]}
                  >
                    {i < step ? "✓" : `${i + 1}`}
                  </Text>
                </View>
                <Text
                  style={[s.stepLabel, i === step && { color: Colors.primary }]}
                >
                  {label}
                </Text>
              </View>
              {i < STEPS.length - 1 && (
                <View
                  style={[
                    s.stepLine,
                    i < step && { backgroundColor: Colors.success },
                  ]}
                />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Error */}
        {!!error && (
          <View style={s.errBox}>
            <Text style={s.errText}>⚠ {error}</Text>
          </View>
        )}

        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Step 0: Profile ── */}
          {step === 0 && (
            <>
              <Card style={{ marginBottom: 12 }}>
                <SectionTitle>Experience Level</SectionTitle>
                <BodyText style={{ marginBottom: 12 }}>
                  How would you rate your current programming experience?
                </BodyText>
                <View style={s.chipRow}>
                  {LEVELS.map((l) => (
                    <Chip
                      key={l}
                      label={l}
                      selected={form.level === l}
                      onPress={() => patch("level", l)}
                    />
                  ))}
                </View>
              </Card>

              <Card style={{ marginBottom: 12 }}>
                <SectionTitle>Languages You Know</SectionTitle>
                <BodyText style={{ marginBottom: 12 }}>
                  Select all that you're comfortable with.
                </BodyText>
                <View style={s.chipRow}>
                  {LANGUAGES.map((l) => (
                    <Chip
                      key={l}
                      label={l}
                      selected={form.languages.includes(l)}
                      onPress={() => toggleArr("languages", l)}
                      color={Colors.purple}
                      bg={Colors.purpleLight}
                    />
                  ))}
                </View>
              </Card>

              <View style={s.btnRow}>
                <Btn
                  label="Continue →"
                  onPress={() => setStep(1)}
                  disabled={!canNext0}
                  style={{ flex: 1 }}
                />
              </View>
            </>
          )}

          {/* ── Step 1: Goals ── */}
          {step === 1 && (
            <>
              <Card style={{ marginBottom: 12 }}>
                <SectionTitle>Target Field</SectionTitle>
                <BodyText style={{ marginBottom: 12 }}>
                  What area do you want to specialise in?
                </BodyText>
                <View style={s.chipRow}>
                  {FIELDS.map((f) => (
                    <Chip
                      key={f}
                      label={f}
                      selected={form.field === f}
                      onPress={() => patch("field", f)}
                    />
                  ))}
                </View>
              </Card>

              <Card style={{ marginBottom: 12 }}>
                <SectionTitle>
                  Preferred Technologies{" "}
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "400",
                      color: Colors.muted2,
                    }}
                  >
                    (optional)
                  </Text>
                </SectionTitle>
                <View style={[s.chipRow, { marginTop: 8 }]}>
                  {FRAMEWORKS.map((f) => (
                    <Chip
                      key={f}
                      label={f}
                      selected={form.frameworks.includes(f)}
                      onPress={() => toggleArr("frameworks", f)}
                      color={Colors.success}
                      bg={Colors.successLight}
                    />
                  ))}
                </View>
              </Card>

              <Card style={{ marginBottom: 12 }}>
                <SectionTitle>Primary Goal</SectionTitle>
                <BodyText style={{ marginBottom: 12 }}>
                  What do you want to achieve with this roadmap?
                </BodyText>
                <View style={s.chipRow}>
                  {GOALS.map((g) => (
                    <Chip
                      key={g}
                      label={g}
                      selected={form.goal === g}
                      onPress={() => patch("goal", g)}
                    />
                  ))}
                </View>
              </Card>

              <View style={s.btnRow}>
                <Btn
                  label="← Back"
                  onPress={() => setStep(0)}
                  variant="ghost"
                />
                <Btn
                  label="Continue →"
                  onPress={() => setStep(2)}
                  disabled={!canNext1}
                  style={{ flex: 1 }}
                />
              </View>
            </>
          )}

          {/* ── Step 2: Schedule ── */}
          {step === 2 && (
            <>
              <Card style={{ marginBottom: 12 }}>
                <SectionTitle>Weekly Study Hours</SectionTitle>
                <BodyText style={{ marginBottom: 16 }}>
                  Realistic estimates produce a timeline you'll actually follow.
                </BodyText>
                <View style={s.sliderRow}>
                  {[5, 10, 15, 20, 25, 30, 35, 40].map((h) => (
                    <TouchableOpacity
                      key={h}
                      onPress={() => patch("hours", h)}
                      style={[s.hourBtn, form.hours === h && s.hourBtnActive]}
                    >
                      <Text
                        style={[
                          s.hourBtnText,
                          form.hours === h && s.hourBtnTextActive,
                        ]}
                      >
                        {h}h
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={s.hoursVal}>{form.hours} hrs / week</Text>
              </Card>

              <Field
                label="Specific Focus (optional)"
                value={form.focus}
                onChange={(v) => patch("focus", v)}
                placeholder="e.g. 'Need job in 6 months', 'iOS only'"
              />

              <View style={s.btnRow}>
                <Btn
                  label="← Back"
                  onPress={() => setStep(1)}
                  variant="ghost"
                />
                <Btn
                  label="Review →"
                  onPress={() => setStep(3)}
                  style={{ flex: 1 }}
                />
              </View>
            </>
          )}

          {/* ── Step 3: Review ── */}
          {step === 3 && (
            <>
              <Card style={{ marginBottom: 12 }}>
                <SectionTitle>Review Your Profile</SectionTitle>
                <BodyText style={{ marginBottom: 16 }}>
                  Confirm everything looks correct before Claude generates your
                  roadmap.
                </BodyText>

                {[
                  ["Level", form.level],
                  ["Languages", form.languages.join(", ") || "None"],
                  ["Field", form.field],
                  ["Tech", form.frameworks.join(", ") || "Open"],
                  ["Goal", form.goal],
                  ["Hours", `${form.hours} hrs/week`],
                  ...(form.focus ? [["Focus", form.focus]] : []),
                ].map(([label, val]) => (
                  <View key={label} style={s.reviewRow}>
                    <Text style={s.reviewLabel}>{label}</Text>
                    <Text style={s.reviewVal} numberOfLines={1}>
                      {val}
                    </Text>
                  </View>
                ))}
              </Card>

              <View style={s.btnRow}>
                <Btn
                  label="← Back"
                  onPress={() => setStep(2)}
                  variant="ghost"
                />
                <Btn
                  label="🚀 Generate"
                  onPress={generate}
                  style={{ flex: 1 }}
                />
              </View>
            </>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.xl, paddingBottom: 40 },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: Colors.text },
  headerSub: { fontSize: 13, color: Colors.muted, marginTop: 2 },
  stepBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stepItem: { alignItems: "center", gap: 4 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.bg,
  },
  stepDotActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  stepDotDone: { borderColor: Colors.success, backgroundColor: Colors.success },
  stepDotText: { fontSize: 11, fontWeight: "800", color: Colors.muted2 },
  stepLabel: { fontSize: 10, fontWeight: "700", color: Colors.muted2 },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
    marginBottom: 16,
    borderRadius: 1,
  },
  errBox: {
    margin: Spacing.lg,
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: 12,
  },
  errText: { color: Colors.danger, fontSize: 13, fontWeight: "700" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  btnRow: { flexDirection: "row", gap: 10, alignItems: "center", marginTop: 8 },
  sliderRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  hourBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  hourBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  hourBtnText: { fontSize: 13, fontWeight: "700", color: Colors.muted },
  hourBtnTextActive: { color: Colors.primary },
  hoursVal: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.primary,
    textAlign: "right",
    marginTop: 4,
  },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  reviewLabel: { fontSize: 13, color: Colors.muted, fontWeight: "600" },
  reviewVal: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
    maxWidth: "60%",
    textAlign: "right",
  },
  loadingWrap: {
    flex: 1,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    borderColor: Colors.border,
    borderTopColor: Colors.primary,
    marginBottom: 24,
  },
  loadTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  loadSub: {
    fontSize: 14,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 8,
  },
  loadStep: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: 7,
  },
  loadStepActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: "#BFDBFE",
  },
  loadStepDone: {
    backgroundColor: Colors.successLight,
    borderColor: "#BBF7D0",
  },
  loadStepText: { fontSize: 13, fontWeight: "600", color: Colors.muted },
});
