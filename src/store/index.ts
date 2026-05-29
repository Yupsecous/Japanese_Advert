import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createSettingsSlice, type SettingsSlice } from './settings.slice';
import { createBriefSlice, type BriefSlice } from './brief.slice';
import { createStepsSlice, type StepsSlice } from './steps.slice';
import { createAudienceSlice, type AudienceSlice } from './audience.slice';
import { createAuthSlice, type AuthSlice } from './auth.slice';
import { type StepId, type StepState, type VariantCache } from '../types';
import { tierStepOrder } from '../tiers';

export type AppState = SettingsSlice & BriefSlice & StepsSlice & AudienceSlice & AuthSlice;

// Audio variants carry a Blob and an object URL — neither survives JSON
// serialization, so on rehydrate we strip the audio variants and demote
// the audio status so the auto-fire effect regenerates fresh audio.
function partializeAudio(audio: StepState): StepState {
  const demotedStatus =
    audio.status === 'approved' || audio.status === 'options' || audio.status === 'refining'
      ? 'generating'
      : audio.status;
  return {
    ...audio,
    variants: [],
    selectedIndex: null,
    selectedVoiceId: null,
    status: demotedStatus,
  };
}

function partializeCache(cache: VariantCache): VariantCache {
  const out: VariantCache = {};
  for (const [k, v] of Object.entries(cache)) {
    if (k.startsWith('audio:')) continue; // Blobs don't round-trip
    out[k] = v;
  }
  return out;
}

export const useAppStore = create<AppState>()(
  persist(
    (...a) => ({
      ...createSettingsSlice(...a),
      ...createBriefSlice(...a),
      ...createStepsSlice(...a),
      ...createAudienceSlice(...a),
      ...createAuthSlice(...a),
    }),
    {
      name: 'demo-v2-state',
      // v7 → v8: audience slice added, 'audience' inserted as STEP_ORDER[0]
      // v8 → v9: accounts migration — provider keys + the client-side `authed`
      //   flag are no longer persisted (server holds keys; the httpOnly
      //   session cookie is the source of truth). Strip them from old state.
      version: 9,
      migrate: (persisted) => {
        if (persisted && typeof persisted === 'object') {
          const p = persisted as Record<string, unknown>;
          delete p.keys;
          delete p.authed;
        }
        return persisted as AppState;
      },
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        locale: state.locale,
        brief: state.brief,
        briefSubmitted: state.briefSubmitted,
        steps: {
          audience: state.steps.audience,
          copy: state.steps.copy,
          image: state.steps.image,
          script: state.steps.script,
          audio: partializeAudio(state.steps.audio),
          design: state.steps.design,
        },
        variantCache: partializeCache(state.variantCache),
        // Persist the lighter audience fields. Skip generatedAssets — they
        // can contain blob URLs (Phase 2) that don't survive serialization.
        customers: state.customers,
        briefCache: state.briefCache,
        deliveryLog: state.deliveryLog,
        effectivenessData: state.effectivenessData,
        learnedInsights: state.learnedInsights,
        runVersion: state.runVersion,
      }),
    },
  ),
);

// The active step order depends on the user's tier (Free skips Audience +
// Design). All flow helpers operate over this effective order so locked steps
// are simply not part of the pipeline for that tier.
export function effectiveStepOrder(state: AppState): StepId[] {
  return tierStepOrder(state.user?.tier ?? 'free');
}

export function isStepUnlocked(state: AppState, id: StepId): boolean {
  if (!state.briefSubmitted) return false;
  const order = effectiveStepOrder(state);
  const idx = order.indexOf(id);
  if (idx === -1) return false;
  if (idx === 0) return true;
  const prev = order[idx - 1];
  if (!prev) return false;
  return state.steps[prev].status === 'approved';
}

export function activeStepId(state: AppState): StepId | null {
  if (!state.briefSubmitted) return null;
  for (const id of effectiveStepOrder(state)) {
    if (state.steps[id].status !== 'approved') return id;
  }
  return null;
}

export function allApproved(state: AppState): boolean {
  if (!state.briefSubmitted) return false;
  return effectiveStepOrder(state).every((id) => state.steps[id].status === 'approved');
}
