// constants/theme.ts
export const Colors = {
  primary: "#2563EB",
  primaryLight: "#EFF6FF",
  primaryDark: "#1D4ED8",
  success: "#16A34A",
  successLight: "#F0FDF4",
  purple: "#7C3AED",
  purpleLight: "#F5F3FF",
  amber: "#D97706",
  amberLight: "#FFFBEB",
  danger: "#DC2626",
  dangerLight: "#FEF2F2",

  white: "#FFFFFF",
  bg: "#F8FAFC",
  bg2: "#F1F5F9",
  surface: "#FFFFFF",
  border: "#E2E8F0",
  border2: "#CBD5E1",

  text: "#0F172A",
  text2: "#334155",
  muted: "#64748B",
  muted2: "#94A3B8",
};

export const PhaseColors = [
  { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE", solid: "#3B82F6" },
  { bg: "#F5F3FF", text: "#7C3AED", border: "#DDD6FE", solid: "#8B5CF6" },
  { bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0", solid: "#22C55E" },
  { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A", solid: "#F59E0B" },
  { bg: "#FFF1F2", text: "#E11D48", border: "#FECDD3", solid: "#F43F5E" },
  { bg: "#FDF4FF", text: "#9333EA", border: "#E9D5FF", solid: "#A855F7" },
];

export const StatusConfig = {
  locked: {
    label: "Locked",
    icon: "🔒",
    color: "#94A3B8",
    bg: "#F8FAFC",
    border: "#E2E8F0",
  },
  current: {
    label: "In Progress",
    icon: "⚡",
    color: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
  },
  completed: {
    label: "Completed",
    icon: "✅",
    color: "#16A34A",
    bg: "#F0FDF4",
    border: "#BBF7D0",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const Shadow = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};
