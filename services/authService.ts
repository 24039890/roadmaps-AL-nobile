// services/authService.ts
// All auth now goes through Supabase — sessions persist on device via
// AsyncStorage and automatically refresh. Passwords are hashed server-side
// by Supabase (bcrypt) — we never store them ourselves.
import { supabase } from "../lib/supabase";
import { User } from "../types";

export const authService = {
  // ── Sign Up ────────────────────────────────────────────────────────────────
  async signup(name: string, email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Sign up failed — please try again.");
    return {
      id: data.user.id,
      name: name,
      email: data.user.email ?? email,
    };
  },

  // ── Sign In ────────────────────────────────────────────────────────────────
  async login(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Login failed — please try again.");
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", data.user.id)
      .single();
    return {
      id: data.user.id,
      name: profile?.name ?? email.split("@")[0],
      email: data.user.email ?? email,
    };
  },

  // ── Restore session on app start ───────────────────────────────────────────
  async getSession(): Promise<User | null> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", session.user.id)
      .single();
    return {
      id: session.user.id,
      name: profile?.name ?? session.user.email?.split("@")[0] ?? "User",
      email: session.user.email ?? "",
    };
  },

  // ── Sign Out ───────────────────────────────────────────────────────────────
  async logout(): Promise<void> {
    await supabase.auth.signOut();
  },

  // ── Real-time session listener ─────────────────────────────────────────────
  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        callback(null);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", session.user.id)
        .single();
      callback({
        id: session.user.id,
        name: profile?.name ?? session.user.email?.split("@")[0] ?? "User",
        email: session.user.email ?? "",
      });
    });
  },
};
