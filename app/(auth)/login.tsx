// app/(auth)/login.tsx
import { router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Btn, Field } from "../../components/ui";
import { Colors } from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";
import { authService } from "../../services/authService";

export default function LoginScreen() {
  const { setUser } = useAuth();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  function switchTab(t: "login" | "signup") {
    setTab(t);
    setError("");
    setInfo("");
  }

  async function submit() {
    setError("");
    setInfo("");
    setLoading(true);
    try {
      if (tab === "signup") {
        if (!name.trim()) {
          setError("Please enter your full name.");
          setLoading(false);
          return;
        }
        const user = await authService.signup(name.trim(), email.trim(), pass);
        if (user.id) {
          setUser(user);
          router.replace("/(tabs)/dashboard");
        } else {
          setInfo("Account created! Check your email to confirm.");
          setTab("login");
        }
      } else {
        const user = await authService.login(email.trim(), pass);
        setUser(user);
        router.replace("/(tabs)/dashboard");
      }
    } catch (e: any) {
      const msg: string = e.message ?? "";
      if (msg.includes("Invalid login"))
        setError("Incorrect email or password.");
      else if (msg.includes("Email not confirmed"))
        setError("Please confirm your email first.");
      else if (msg.includes("already registered"))
        setError("Email already registered. Sign in instead.");
      else setError(msg || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.logoWrap}>
            <View style={s.logoIcon}>
              <Text style={{ fontSize: 34 }}>🗺</Text>
            </View>
            <Text style={s.appName}>
              AI Roadmap <Text style={{ color: Colors.primary }}>Builder</Text>
            </Text>
            <Text style={s.appSub}>
              Your learning journey — synced across all devices
            </Text>
          </View>

          <View style={s.card}>
            <View style={s.tabs}>
              <TouchableOpacity
                style={[s.tab, tab === "login" && s.tabActive]}
                onPress={() => switchTab("login")}
              >
                <Text style={[s.tabText, tab === "login" && s.tabTextActive]}>
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.tab, tab === "signup" && s.tabActive]}
                onPress={() => switchTab("signup")}
              >
                <Text style={[s.tabText, tab === "signup" && s.tabTextActive]}>
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>

            {!!info && (
              <View style={s.infoBox}>
                <Text style={s.infoText}>ℹ {info}</Text>
              </View>
            )}
            {!!error && (
              <View style={s.errBox}>
                <Text style={s.errText}>⚠ {error}</Text>
              </View>
            )}

            {tab === "signup" && (
              <Field
                label="Full Name"
                value={name}
                onChange={setName}
                placeholder="Your full name"
              />
            )}

            <Field
              label="Email Address"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <View style={s.passWrap}>
              <Field
                label="Password"
                value={pass}
                onChange={setPass}
                placeholder={
                  tab === "signup" ? "At least 6 characters" : "Your password"
                }
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={s.eyeBtn}
                onPress={() => setShowPass((v) => !v)}
                activeOpacity={0.7}
              >
                <Text style={s.eyeText}>{showPass ? "🙈" : "👁️"}</Text>
              </TouchableOpacity>
            </View>

            <Btn
              label={tab === "login" ? "Sign In" : "Create Account"}
              onPress={submit}
              loading={loading}
              size="lg"
              style={{ width: "100%" }}
            />

            <View style={s.switchRow}>
              <Text style={s.switchText}>
                {tab === "login"
                  ? "Don't have an account?  "
                  : "Already have one?  "}
              </Text>
              <TouchableOpacity
                onPress={() => switchTab(tab === "login" ? "signup" : "login")}
              >
                <Text style={s.switchLink}>
                  {tab === "login" ? "Sign up" : "Sign in"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={s.footer}>
            🔒 Secured by Supabase · Synced across all your devices
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 48,
    paddingBottom: 32,
    justifyContent: "center",
  },
  logoWrap: { alignItems: "center", marginBottom: 32 },
  logoIcon: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 2,
    borderColor: "#BFDBFE",
  },
  appName: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 5,
  },
  appSub: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 20,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: Colors.bg,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  tabActive: { backgroundColor: Colors.white },
  tabText: { fontSize: 13, fontWeight: "700", color: Colors.muted },
  tabTextActive: { color: Colors.text },
  infoBox: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    padding: 12,
    marginBottom: 14,
  },
  infoText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
  },
  errBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: 12,
    marginBottom: 14,
  },
  errText: { color: Colors.danger, fontSize: 13, fontWeight: "700" },
  passWrap: {
    position: "relative",
  },
  eyeBtn: {
    position: "absolute",
    right: 14,
    bottom: 22,
    padding: 4,
    zIndex: 10,
  },
  eyeText: {
    fontSize: 18,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 18,
    flexWrap: "wrap",
  },
  switchText: { fontSize: 13, color: Colors.muted },
  switchLink: { fontSize: 13, fontWeight: "800", color: Colors.primary },
  footer: {
    textAlign: "center",
    marginTop: 24,
    fontSize: 12,
    color: Colors.muted2,
    lineHeight: 18,
  },
});
