import type { StateCreator } from 'zustand';
import type {
  Customer,
  DeliveryRecord,
  EffectivenessRecord,
  GeneratedAssetSet,
  IndividualBrief,
} from '../types';

// Audience Console state. Phase 1 wires customers + briefCache. Phases 2-5
// populate the remaining fields (generatedAssets, deliveryLog,
// effectivenessData, learnedInsights). All fields are declared now so the
// slice shape is stable and persist v8 doesn't need a follow-up bump.

export type AudienceState = {
  customers: Customer[];
  briefCache: Record<string, IndividualBrief>;
  generatedAssets: Record<string, GeneratedAssetSet>;
  deliveryLog: DeliveryRecord[];
  effectivenessData: Record<string, EffectivenessRecord>;
  // Per-campaign log of feedback summaries. Brand-level durable insights
  // live on the BrandDictionary so they apply across campaigns.
  learnedInsights: string[];
  // Increments each time a feedback-loop run folds insights into future
  // generations. UI surfaces "Learning vN applied" when > 0.
  runVersion: number;
};

export type AudienceSlice = AudienceState & {
  setCustomers: (customers: Customer[]) => void;
  appendCustomers: (customers: Customer[]) => void;
  clearCustomers: () => void;

  setBriefForCustomer: (customerId: string, brief: IndividualBrief) => void;
  setBriefCache: (cache: Record<string, IndividualBrief>) => void;
  clearBriefCache: () => void;

  // Phase 2+ — exposed now so the slice surface is complete.
  setAssetForCustomer: (customerId: string, assets: GeneratedAssetSet) => void;
  clearGeneratedAssets: () => void;

  appendDeliveryRecord: (record: DeliveryRecord) => void;
  clearDeliveryLog: () => void;

  setEffectivenessForCustomer: (customerId: string, record: EffectivenessRecord) => void;
  clearEffectiveness: () => void;

  appendLearnedInsight: (insight: string) => void;
  clearLearnedInsights: () => void;
  bumpRunVersion: () => void;

  resetAudience: () => void;
};

export const emptyAudienceState: AudienceState = {
  customers: [],
  briefCache: {},
  generatedAssets: {},
  deliveryLog: [],
  effectivenessData: {},
  learnedInsights: [],
  runVersion: 0,
};

export const createAudienceSlice: StateCreator<AudienceSlice, [], [], AudienceSlice> = (
  set,
) => ({
  ...emptyAudienceState,

  setCustomers: (customers) =>
    set({ customers, briefCache: {}, generatedAssets: {}, deliveryLog: [], effectivenessData: {} }),
  appendCustomers: (customers) =>
    set((s) => ({ customers: [...s.customers, ...customers] })),
  clearCustomers: () =>
    set({ customers: [], briefCache: {}, generatedAssets: {}, deliveryLog: [], effectivenessData: {} }),

  setBriefForCustomer: (customerId, brief) =>
    set((s) => ({ briefCache: { ...s.briefCache, [customerId]: brief } })),
  setBriefCache: (cache) => set({ briefCache: cache }),
  clearBriefCache: () => set({ briefCache: {} }),

  setAssetForCustomer: (customerId, assets) =>
    set((s) => ({ generatedAssets: { ...s.generatedAssets, [customerId]: assets } })),
  clearGeneratedAssets: () => set({ generatedAssets: {} }),

  appendDeliveryRecord: (record) =>
    set((s) => ({ deliveryLog: [...s.deliveryLog, record] })),
  clearDeliveryLog: () => set({ deliveryLog: [] }),

  setEffectivenessForCustomer: (customerId, record) =>
    set((s) => ({ effectivenessData: { ...s.effectivenessData, [customerId]: record } })),
  clearEffectiveness: () => set({ effectivenessData: {} }),

  appendLearnedInsight: (insight) =>
    set((s) => ({ learnedInsights: [...s.learnedInsights, insight] })),
  clearLearnedInsights: () => set({ learnedInsights: [] }),
  bumpRunVersion: () => set((s) => ({ runVersion: s.runVersion + 1 })),

  resetAudience: () => set({ ...emptyAudienceState }),
});
