import { useAppStore } from '../store';
import { useT } from '../i18n/hooks';
import { TIER_COST_USD, TIER_LATENCY_SECONDS } from '../services/fluxClient';
import { KLING_COST_USD_PER_CLIP, KLING_LATENCY_SECONDS } from '../services/aiVideoService';
import { allowedImageTiers, canKling } from '../tiers';
import type { ImageQualityTier, VideoProvider } from '../types';

// Generation quality settings — global, per-browser, durable. Controls
// how realistic vs cheap/fast the generated images and videos look.
// Defaults preserve current behavior (Schnell + slideshow). Opt-in only.

const IMAGE_TIERS: ImageQualityTier[] = ['fast', 'balanced', 'realistic'];
const VIDEO_PROVIDERS: VideoProvider[] = ['slideshow', 'ai_kling'];

function formatCost(usd: number): string {
  if (usd < 0.01) return `<$0.01`;
  return `$${usd.toFixed(2)}`;
}

function Pill({ children, tone }: { children: React.ReactNode; tone: 'cost' | 'time' | 'note' }) {
  const cls =
    tone === 'cost'
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : tone === 'time'
        ? 'border-sky-200 bg-sky-50 text-sky-800'
        : 'border-neutral-200 bg-neutral-50 text-neutral-700';
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] ${cls}`}>
      {children}
    </span>
  );
}

export function GenerationSettings() {
  const imageQualityTier = useAppStore((s) => s.imageQualityTier);
  const setImageQualityTier = useAppStore((s) => s.setImageQualityTier);
  const videoProvider = useAppStore((s) => s.videoProvider);
  const setVideoProvider = useAppStore((s) => s.setVideoProvider);
  const userTier = useAppStore((s) => s.user?.tier ?? 'free');
  const allowedTiers = allowedImageTiers(userTier);
  const t = useT();

  return (
    <div className="space-y-5">
      {/* Image quality tier */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-neutral-800">{t('generation.imageQuality')}</p>
        <p className="text-xs text-neutral-500">{t('generation.imageQualityNote')}</p>
        <div className="space-y-1.5">
          {IMAGE_TIERS.map((tier) => {
            const selected = imageQualityTier === tier;
            const locked = !allowedTiers.includes(tier);
            return (
              <label
                key={tier}
                className={`flex items-start gap-3 rounded-md border p-3 transition-colors ${
                  locked
                    ? 'cursor-not-allowed border-neutral-200 opacity-60'
                    : selected
                      ? 'cursor-pointer border-neutral-900 bg-neutral-50'
                      : 'cursor-pointer border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                <input
                  type="radio"
                  name="image-tier"
                  value={tier}
                  checked={selected}
                  disabled={locked}
                  onChange={() => setImageQualityTier(tier)}
                  className="mt-0.5 h-4 w-4 accent-neutral-900"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-neutral-900">
                      {t(`generation.tier.${tier}` as const)}
                    </span>
                    <Pill tone="cost">{formatCost(TIER_COST_USD[tier])}/img</Pill>
                    <Pill tone="time">~{TIER_LATENCY_SECONDS[tier]}s</Pill>
                    {locked && <Pill tone="note">🔒 {tier === 'realistic' ? 'Ultra' : 'Pro'}</Pill>}
                  </div>
                  <p className="mt-1 text-xs text-neutral-600">
                    {t(`generation.tier.${tier}.desc` as const)}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Video provider */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-neutral-800">{t('generation.videoProvider')}</p>
        <p className="text-xs text-neutral-500">{t('generation.videoProviderNote')}</p>
        <div className="space-y-1.5">
          {VIDEO_PROVIDERS.map((provider) => {
            const selected = videoProvider === provider;
            const isKling = provider === 'ai_kling';
            const klingLocked = isKling && !canKling(userTier);
            return (
              <label
                key={provider}
                className={`flex items-start gap-3 rounded-md border p-3 transition-colors ${
                  klingLocked
                    ? 'cursor-not-allowed border-neutral-200 opacity-60'
                    : selected
                      ? 'cursor-pointer border-neutral-900 bg-neutral-50'
                      : 'cursor-pointer border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                <input
                  type="radio"
                  name="video-provider"
                  value={provider}
                  checked={selected}
                  disabled={klingLocked}
                  onChange={() => setVideoProvider(provider)}
                  className="mt-0.5 h-4 w-4 accent-neutral-900"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-neutral-900">
                      {t(`generation.video.${provider}` as const)}
                    </span>
                    {isKling ? (
                      <>
                        <Pill tone="cost">{formatCost(KLING_COST_USD_PER_CLIP)}/clip</Pill>
                        <Pill tone="time">~{KLING_LATENCY_SECONDS}s</Pill>
                        {klingLocked && <Pill tone="note">🔒 Ultra</Pill>}
                      </>
                    ) : (
                      <Pill tone="note">free</Pill>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-neutral-600">
                    {t(`generation.video.${provider}.desc` as const)}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
