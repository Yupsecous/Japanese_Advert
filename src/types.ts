export type StepId = 'copy' | 'image' | 'script' | 'audio' | 'design';

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

export type AudioVariant = {
  kind: 'audio';
  id: string;
  audioUrl: string;
  audioBlob?: Blob; // absent for sample-preset variants; fetched on demand for zip export
  voiceId: string;
  scriptId: string;
  durationSeconds?: number;
  createdAt: number;
};

export type DesignVariant = {
  kind: 'design';
  id: string;
  componentName: string;
  code: string; // single-file TSX, default export named componentName
  rationale: string;
  createdAt: number;
};

export type Variant = CopyVariant | ImageVariant | ScriptVariant | AudioVariant | DesignVariant;

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

// Brand dictionary — a per-brand override that gets threaded into every
// generation prompt. All fields are optional; the empty default has zero
// effect on output. When set, the dictionary takes priority over the
// model's default register and pushes outputs toward a consistent brand
// voice across runs.
export type BrandDictionary = {
  // Display name for the brand. Surfaced in the header indicator chip.
  name: string;
  // Words/phrases the LLM must NEVER use. One per line in the UI; trimmed
  // and de-duplicated on save.
  bannedTerms: string[];
  // Words/phrases the LLM should LEAN INTO when natural. Use sparingly —
  // forcing too many breaks tone.
  preferredTerms: string[];
  // Free-prose description of overall brand voice. Example:
  //   "Plainspoken, confident, never preachy. Short clauses. No emoji.
  //    Cite specifics over abstractions."
  voiceCharacter: string;
  // Free-prose visual constraints that apply to image generation. Example:
  //   "No human faces. Earth-tone palette only. Natural daylight, no studio
  //    strobes. Minimal background."
  visualRules: string;
  // Optional audience refinements that apply on top of the per-brief
  // audience field. Example: "Always assume B2B enterprise context."
  audienceRefinement: string;
};

export const EMPTY_BRAND_DICTIONARY: BrandDictionary = {
  name: '',
  bannedTerms: [],
  preferredTerms: [],
  voiceCharacter: '',
  visualRules: '',
  audienceRefinement: '',
};

export function isBrandDictionaryEmpty(b: BrandDictionary): boolean {
  return (
    b.name.trim().length === 0 &&
    b.bannedTerms.length === 0 &&
    b.preferredTerms.length === 0 &&
    b.voiceCharacter.trim().length === 0 &&
    b.visualRules.trim().length === 0 &&
    b.audienceRefinement.trim().length === 0
  );
}

export type Provider = 'fal' | 'eleven' | 'openai' | 'anthropic';

export type ValidationStatus = 'unchecked' | 'validating' | 'ok' | 'fail';

export type ApiKeys = Record<Provider, string>;
export type Validations = Record<Provider, ValidationStatus>;

export const STEP_ORDER: readonly StepId[] = ['copy', 'image', 'script', 'audio', 'design'] as const;

export const STEP_LABELS: Record<StepId, string> = {
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

// Meta Marketing API ad creative CTA enums (subset). The platform localizes
// the button label on the user's behalf — these stay English because they
// are API-level identifiers, not user-visible text.
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

// X Ads website-card CTA enums (subset).
export const X_CTAS = ['SHOP', 'LEARN_MORE', 'BOOK', 'ORDER', 'INSTALL', 'VISIT_SITE'] as const;
export type XCta = (typeof X_CTAS)[number];

// Each platform output is now an A/B pair. Variant A is tuned for one tonal
// register (confident-direct), variant B for a distinctly different one
// (warm-conversational). Real ad campaigns split-test these.
export type MetaCopyVariant = {
  primaryText: string;
  headline: string;
  description: string;
  ctaButton: MetaCta;
  toneLabel: string; // human-readable: "Confident-direct" / "Warm-conversational"
};

export type XCopyVariant = {
  tweetText: string;
  ctaButton: XCta;
  toneLabel: string;
  // Up to 3 hashtags (without leading '#'). The user can choose whether to
  // append them to the tweet body or use them in a follow-up reply.
  hashtags: string[];
};

export type MetaCopy = {
  variants: [MetaCopyVariant, MetaCopyVariant];
};

export type XCopy = {
  variants: [XCopyVariant, XCopyVariant];
};

export type PlatformCopy = {
  meta: MetaCopy;
  x: XCopy;
  // Heuristic: was anything flagged as Meta-restricted? Surfaces in the
  // checklist so the user can manually verify before submitting.
  restrictedCategoryWarning: string | null;
};

// Aspect-ratio identifiers used for per-platform image variants. The 4x5
// variant is always present (it's the approved hero image from the pipeline);
// the other three are generated on-demand via Flux.
export type AspectRatio = '1x1' | '4x5' | '9x16' | '1.91x1';

// A/B image pair per aspect. Variant A is the approved-style hero (or a
// re-render at the new aspect). Variant B is a deliberately different
// framing — different angle, different energy — for split-testing.
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

// Meta carousel: 3 single-image cards telling the same story from three
// different framings of the hero scene. Always 1:1 (Meta carousel default).
export type CarouselImage = {
  imageUrl: string;
  width: number;
  height: number;
  index: number; // 0..2
};

export type CarouselSet = {
  images: CarouselImage[]; // length 1..3, ideally 3
};

// Browser-generated slideshow video (Canvas + MediaRecorder). Always WebM
// — universally accepted by Meta Reels / Stories and X video ads.
export type PlatformVideo = {
  aspect: '9x16' | '1x1';
  blob: Blob;
  durationSeconds: number;
  mimeType: string; // typically 'video/webm'
  width: number;
  height: number;
};

export type PlatformAssetsBundle = {
  copy: PlatformCopy;
  imagePairs: PlatformImagePair[];
  carousel: CarouselSet | null; // null if not generated
  videos: PlatformVideo[]; // 0..2 entries (9:16 for Reels, 1:1 for X)
  generatedAt: number;
};
