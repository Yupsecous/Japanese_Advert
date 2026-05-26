// Shared type definitions for web + android + backend. Identical to
// packages/web/src/types.ts at the moment (copy, not re-export, so each
// surface can evolve independently). Eventually web will import from
// here and the duplicate will be deleted.
//
// Note on Blob: both web and React Native expose a Blob global, so the
// PlatformVideo type below uses Blob. Backend doesn't construct
// PlatformVideo so it never trips on this.

export type StepId = 'audience' | 'copy' | 'image' | 'script' | 'audio' | 'design';

export type StepStatus =
  | 'pending'
  | 'generating'
  | 'options'
  | 'refining'
  | 'approved';

export type CopyVariant = {
  kind: 'copy';
  id: string;
  headline: string;
  caption: string;
  cta: string;
  createdAt: number;
};

export type ImageVariant = {
  kind: 'image';
  id: string;
  imageUrl: string;
  prompt: string;
  modsApplied?: ImagePromptMods;
  createdAt: number;
};

export type Critique = {
  variantId: string;
  text: string;
  createdAt: number;
};

export type ScriptVariant = {
  kind: 'script';
  id: string;
  script: string;
  durationEstimate: number;
  toneDescription: string;
  modsApplied?: VoiceMods;
  createdAt: number;
};

export type AudioAlignment = {
  characters: string[];
  charStartSec: number[];
  charEndSec: number[];
};

export type AudioVariant = {
  kind: 'audio';
  id: string;
  audioUrl: string;
  audioBlob?: unknown; // Blob on web, untyped on RN; only consumed within its own platform
  voiceId: string;
  scriptId: string;
  durationSeconds?: number;
  createdAt: number;
  alignment?: AudioAlignment;
};

export type DesignVariant = {
  kind: 'design';
  id: string;
  componentName: string;
  code: string;
  rationale: string;
  createdAt: number;
};

export type Variant =
  | CopyVariant
  | ImageVariant
  | ScriptVariant
  | AudioVariant
  | DesignVariant;

export type RefineKind = 'initial' | 'more' | 'refine' | 'critique-applied';

export type GenerationLogEntry = {
  id: string;
  kind: RefineKind;
  direction: string | null;
  variantCount: number;
  timestamp: number;
};

export type VoicePickLogEntry = {
  id: string;
  kind: 'voice-pick';
  voiceId: string;
  voiceName: string;
  timestamp: number;
};

export type RegenerateLogEntry = {
  id: string;
  kind: 'regenerate';
  discardedDurationSeconds: number | null;
  timestamp: number;
};

export type CacheRestoreLogEntry = {
  id: string;
  kind: 'cache-restore';
  timestamp: number;
};

export type RefineEntry =
  | GenerationLogEntry
  | VoicePickLogEntry
  | RegenerateLogEntry
  | CacheRestoreLogEntry;

export type StepState = {
  id: StepId;
  label: string;
  status: StepStatus;
  variants: Variant[];
  selectedIndex: number | null;
  selectedVoiceId: string | null;
  history: RefineEntry[];
  critiques: Record<string, Critique>;
};

export type Brief = {
  productName: string;
  targetAudience: string;
  adAngle: string;
};

export type BrandDictionary = {
  name: string;
  bannedTerms: string[];
  preferredTerms: string[];
  voiceCharacter: string;
  visualRules: string;
  audienceRefinement: string;
  learnedInsights: string[];
};

export const EMPTY_BRAND_DICTIONARY: BrandDictionary = {
  name: '',
  bannedTerms: [],
  preferredTerms: [],
  voiceCharacter: '',
  visualRules: '',
  audienceRefinement: '',
  learnedInsights: [],
};

export function isBrandDictionaryEmpty(b: BrandDictionary): boolean {
  return (
    b.name.trim().length === 0 &&
    b.bannedTerms.length === 0 &&
    b.preferredTerms.length === 0 &&
    b.voiceCharacter.trim().length === 0 &&
    b.visualRules.trim().length === 0 &&
    b.audienceRefinement.trim().length === 0 &&
    b.learnedInsights.length === 0
  );
}

export type Provider = 'fal' | 'eleven' | 'openai' | 'anthropic';
export type ValidationStatus = 'unchecked' | 'validating' | 'ok' | 'fail';
export type ApiKeys = Record<Provider, string>;
export type Validations = Record<Provider, ValidationStatus>;

export const STEP_ORDER: readonly StepId[] = [
  'audience',
  'copy',
  'image',
  'script',
  'audio',
  'design',
] as const;

export const STEP_LABELS: Record<StepId, string> = {
  audience: 'Audience',
  copy: 'Copy',
  image: 'Image',
  script: 'Script',
  audio: 'Audio',
  design: 'Design',
};

export const PROVIDER_LABELS: Record<Provider, string> = {
  fal: 'fal.ai',
  eleven: 'ElevenLabs',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
};

export type CachedStepState = {
  variants: Variant[];
  selectedIndex: number | null;
  selectedVoiceId?: string | null;
  critiques: Record<string, Critique>;
  cachedAt: number;
};

export type VariantCache = Record<string, CachedStepState>;

export function cacheKey(stepId: StepId, hash: string): string {
  return `${stepId}:${hash}`;
}

export type AssetType = 'copy' | 'image' | 'voice';
export const ASSET_TYPES: readonly AssetType[] = ['copy', 'image', 'voice'] as const;

export type CopyMods = {
  enrichedDirection: string;
  avoid: string[];
  emphasize: string[];
};

export type ImagePromptMods = {
  lighting: string;
  composition: string;
  palette: string;
  mood: string;
  subject: string;
  background: string;
  energy: 'high' | 'medium' | 'low';
  avoid: string[];
};

export type VoiceMods = {
  scriptTone: string;
  pace: 'slower' | 'normal' | 'faster';
  delivery: string;
  emphasis: string;
  voiceCharacter: string;
};

export type TranslatorOutput =
  | { kind: 'copy'; mods: CopyMods }
  | { kind: 'image'; mods: ImagePromptMods }
  | { kind: 'voice'; mods: VoiceMods };

export const META_CTAS = [
  'SHOP_NOW',
  'LEARN_MORE',
  'SIGN_UP',
  'SUBSCRIBE',
  'DOWNLOAD',
  'GET_OFFER',
  'GET_QUOTE',
  'CONTACT_US',
  'APPLY_NOW',
  'BOOK_NOW',
  'ORDER_NOW',
  'WATCH_MORE',
] as const;
export type MetaCta = (typeof META_CTAS)[number];

export const X_CTAS = ['SHOP', 'LEARN_MORE', 'BOOK', 'ORDER', 'INSTALL', 'VISIT_SITE'] as const;
export type XCta = (typeof X_CTAS)[number];

export type MetaCopyVariant = {
  primaryText: string;
  headline: string;
  description: string;
  ctaButton: MetaCta;
  toneLabel: string;
};

export type XCopyVariant = {
  tweetText: string;
  ctaButton: XCta;
  toneLabel: string;
  hashtags: string[];
};

export type MetaCopy = { variants: [MetaCopyVariant, MetaCopyVariant] };
export type XCopy = { variants: [XCopyVariant, XCopyVariant] };

export type PlatformCopy = {
  meta: MetaCopy;
  x: XCopy;
  restrictedCategoryWarning: string | null;
};

export type AspectRatio = '1x1' | '4x5' | '9x16' | '1.91x1';

export type PlatformImageVariant = {
  imageUrl: string;
  width: number;
  height: number;
  variantLabel: 'A' | 'B';
};

export type PlatformImagePair = {
  aspect: AspectRatio;
  variants: [PlatformImageVariant, PlatformImageVariant];
};

export type CarouselImage = {
  imageUrl: string;
  width: number;
  height: number;
  index: number;
};

export type CarouselSet = {
  images: CarouselImage[];
};

export type PlatformVideo = {
  aspect: '9x16' | '1x1';
  blob: unknown; // Blob on web, file URI string on RN; platform-specific
  durationSeconds: number;
  mimeType: string;
  width: number;
  height: number;
  provider?: 'slideshow' | 'ai_kling';
};

export type PlatformAssetsBundle = {
  copy: PlatformCopy;
  imagePairs: PlatformImagePair[];
  carousel: CarouselSet | null;
  videos: PlatformVideo[];
  generatedAt: number;
};

export type CustomerGender = 'female' | 'male' | 'nonbinary' | 'unspecified';

export type Customer = {
  id: string;
  name: string;
  age: number;
  gender: CustomerGender;
  location: string;
  segment: string;
  recentInterest: string;
  recentPurchase: string;
  socialSignalSummary: string;
};

export type IndividualBrief = {
  customerId: string;
  product: string;
  audience: string;
  tone: string;
  recommendedFormat: 'text' | 'image' | 'video' | 'voice';
  rationale: string;
  generatedAt: number;
};

export type DeliveryChannel = 'line' | 'instagram_dm' | 'email' | 'web_push';

export type DeliveryRecord = {
  customerId: string;
  channel: DeliveryChannel;
  deliveredAt: string;
  format: 'text' | 'image' | 'video' | 'voice';
  assetId: string;
};

export type EffectivenessRecord = {
  customerId: string;
  opened: boolean;
  clicked: boolean;
  converted: boolean;
  watchTimeSeconds: number | null;
  dropOffPoint: string | null;
};

export type ImageQualityTier = 'fast' | 'balanced' | 'realistic';
export type VideoProvider = 'slideshow' | 'ai_kling';

export type GeneratedAssetSet = {
  customerId: string;
  headline: string;
  caption: string;
  cta: string;
  imageUrl: string | null;
  script: string | null;
  generatedAt: number;
};

// Type guards for filtering variants.
export function isCopyVariant(v: Variant): v is CopyVariant {
  return v.kind === 'copy';
}
export function copyVariantsOf(variants: Variant[]): CopyVariant[] {
  return variants.filter(isCopyVariant);
}
export function isImageVariant(v: Variant): v is ImageVariant {
  return v.kind === 'image';
}
export function imageVariantsOf(variants: Variant[]): ImageVariant[] {
  return variants.filter(isImageVariant);
}
export function isScriptVariant(v: Variant): v is ScriptVariant {
  return v.kind === 'script';
}
export function scriptVariantsOf(variants: Variant[]): ScriptVariant[] {
  return variants.filter(isScriptVariant);
}
export function isAudioVariant(v: Variant): v is AudioVariant {
  return v.kind === 'audio';
}
export function audioVariantsOf(variants: Variant[]): AudioVariant[] {
  return variants.filter(isAudioVariant);
}
export function isDesignVariant(v: Variant): v is DesignVariant {
  return v.kind === 'design';
}
export function designVariantsOf(variants: Variant[]): DesignVariant[] {
  return variants.filter(isDesignVariant);
}
