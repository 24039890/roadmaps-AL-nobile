// components/ui/index.tsx
import React from "react";
import {
    ActivityIndicator,
    Text,
    TextInput,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle
} from "react-native";
import { Colors, Radius, Shadow, Spacing } from "../../constants/theme";

// ── Button ──────────────────────────────────────────────────────────────────
interface BtnProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "success" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  style?: ViewStyle;
}
export function Btn({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  icon,
  style,
}: BtnProps) {
  const bg = {
    primary: Colors.primary,
    success: Colors.success,
    outline: Colors.white,
    ghost: "transparent",
    danger: Colors.dangerLight,
  }[variant];

  const color = {
    primary: Colors.white,
    success: Colors.white,
    outline: Colors.text2,
    ghost: Colors.muted,
    danger: Colors.danger,
  }[variant];

  const border =
    variant === "outline"
      ? { borderWidth: 1.5, borderColor: Colors.border }
      : variant === "danger"
        ? { borderWidth: 1, borderColor: "#FECACA" }
        : {};

  const pad = {
    sm: { paddingHorizontal: 14, paddingVertical: 8 },
    md: { paddingHorizontal: 20, paddingVertical: 11 },
    lg: { paddingHorizontal: 24, paddingVertical: 14 },
  }[size];
  const fs = { sm: 12, md: 13, lg: 15 }[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        {
          backgroundColor: bg,
          borderRadius: Radius.md,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          opacity: disabled || loading ? 0.45 : 1,
        },
        border,
        pad,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <>
          {icon && <Text style={{ fontSize: fs }}>{icon}</Text>}
          <Text style={{ color, fontWeight: "700", fontSize: fs }}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: Colors.white,
          borderRadius: Radius.lg,
          borderWidth: 1,
          borderColor: Colors.border,
          padding: Spacing.xl,
        },
        Shadow.sm,
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ── SectionTitle ─────────────────────────────────────────────────────────────
export function SectionTitle({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: TextStyle;
}) {
  return (
    <Text
      style={[
        {
          fontWeight: "800",
          fontSize: 18,
          color: Colors.text,
          marginBottom: 4,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// ── BodyText ──────────────────────────────────────────────────────────────────
export function BodyText({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: TextStyle;
}) {
  return (
    <Text
      style={[{ fontSize: 14, color: Colors.muted, lineHeight: 22 }, style]}
    >
      {children}
    </Text>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
interface BadgeProps {
  label: string;
  color: string;
  bg: string;
  border: string;
}
export function Badge({ label, color, bg, border }: BadgeProps) {
  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: Radius.full,
        borderWidth: 1,
        borderColor: border,
        paddingHorizontal: 10,
        paddingVertical: 3,
      }}
    >
      <Text style={{ color, fontWeight: "700", fontSize: 11 }}>{label}</Text>
    </View>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address";
}
export function Field({
  label,
  value,
  onChange,
  placeholder,
  secureTextEntry,
  autoCapitalize = "sentences",
  keyboardType = "default",
}: FieldProps) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: Colors.text2,
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.muted2}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        style={{
          backgroundColor: Colors.white,
          borderWidth: 1.5,
          borderColor: Colors.border,
          borderRadius: Radius.md,
          padding: 12,
          fontSize: 15,
          color: Colors.text,
        }}
      />
    </View>
  );
}

// ── Chip (single + multi) ─────────────────────────────────────────────────────
export function Chip({
  label,
  selected,
  onPress,
  color = Colors.primary,
  bg = Colors.primaryLight,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  color?: string;
  bg?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        paddingHorizontal: 13,
        paddingVertical: 7,
        borderRadius: Radius.sm,
        borderWidth: 1.5,
        borderColor: selected ? color : Colors.border,
        backgroundColor: selected ? bg : Colors.white,
        margin: 3,
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: "600",
          color: selected ? color : Colors.muted,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── ProgressBar ───────────────────────────────────────────────────────────────
export function ProgressBar({
  pct,
  color = Colors.primary,
  height = 6,
  style,
}: {
  pct: number;
  color?: string;
  height?: number;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: Colors.bg2,
          borderRadius: height / 2,
          overflow: "hidden",
          height,
        },
        style,
      ]}
    >
      <View
        style={{
          width: `${Math.min(pct, 100)}%`,
          backgroundColor: color,
          height,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ style }: { style?: ViewStyle }) {
  return (
    <View
      style={[
        { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
        style,
      ]}
    />
  );
}
