// services/storageService.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Progress, Roadmap } from "../types";

const roadmapKey = (uid: string) => `@roadmaps_${uid}`;
const progressKey = (uid: string, rmId: string) => `@progress_${uid}_${rmId}`;

export const storageService = {
  async getRoadmaps(uid: string): Promise<Roadmap[]> {
    const raw = await AsyncStorage.getItem(roadmapKey(uid));
    return raw ? JSON.parse(raw) : [];
  },

  async saveRoadmap(uid: string, roadmap: Roadmap): Promise<void> {
    const list = await storageService.getRoadmaps(uid);
    const idx = list.findIndex((r) => r.id === roadmap.id);
    if (idx >= 0) list[idx] = roadmap;
    else list.unshift(roadmap);
    await AsyncStorage.setItem(roadmapKey(uid), JSON.stringify(list));
  },

  async deleteRoadmap(uid: string, id: string): Promise<void> {
    const list = await storageService.getRoadmaps(uid);
    const filtered = list.filter((r) => r.id !== id);
    await AsyncStorage.setItem(roadmapKey(uid), JSON.stringify(filtered));
    await AsyncStorage.removeItem(progressKey(uid, id));
  },

  async getProgress(uid: string, rmId: string): Promise<Progress | null> {
    const raw = await AsyncStorage.getItem(progressKey(uid, rmId));
    return raw ? JSON.parse(raw) : null;
  },

  async saveProgress(
    uid: string,
    rmId: string,
    progress: Progress,
  ): Promise<void> {
    await AsyncStorage.setItem(
      progressKey(uid, rmId),
      JSON.stringify(progress),
    );
  },
};

export function initProgress(roadmapId: string, phaseCount: number): Progress {
  const checks: { [k: number]: {} } = {};
  for (let i = 0; i < phaseCount; i++) checks[i] = {};
  return { roadmapId, currentPhase: 0, completedPhases: [], checks };
}
