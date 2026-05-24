import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../store';
import {
  generatePlatformCopy,
  generatePlatformImagePairs,
  generateCarousel,
} from '../services/platformService';
import { generateSlideshowVideo, type VideoAspect } from '../services/videoService';
import { generateAiVideo, type AiVideoAspect, KLING_COST_USD_PER_CLIP } from '../services/aiVideoService';
import { TIER_COST_USD } from '../services/fluxClient';
import {
  downloadMetaPackage,
  downloadXPackage,
  type PlatformDownloadResult,
} from '../services/exportService';
import { InlineError } from './InlineError';
import { useT } from '../i18n/hooks';
import {
  audioVariantsOf,
  scriptVariantsOf,
  type AspectRatio,
  type CopyVariant,
  type ImageVariant,
  type PlatformAssetsBundle,
  type PlatformVideo,
} from '../types';

type Props = {
  approvedCopy: CopyVariant;
  approvedImage: ImageVariant;
};

type Phase =
  | 'idle'
  | 'generating-copy'
  | 'generating-images'
  | 'generating-carousel'
  | 'generating-video'
  | 'ready'
  | 'error';

const META_ASPECTS_TO_SHOW: AspectRatio[] = ['1x1', '4x5', '9x16'];
const X_ASPECTS_TO_SHOW: AspectRatio[] = ['1.91x1', '1x1'];

function CharBudget({ used, limit }: { used: number; limit: number }) {
  const over = used > limit;
  return (
    <span
      className={`font-mono text-[11px] tabular-nums ${
        over ? 'text-red-600' : used > limit * 0.9 ? 'text-amber-700' : 'text-neutral-500'
      }`}
    >
      {used}/{limit}
    </span>
  );
}

const aspectStyle: Record<AspectRatio, string> = {
  '1x1': 'aspect-square',
  '4x5': 'aspect-[4/5]',
  '9x16': 'aspect-[9/16]',
  '1.91x1': 'aspect-[1.91/1]',
};

function AspectPair({
  aspect,
  variantA,
  variantB,
}: {
  aspect: AspectRatio;
  variantA: { imageUrl: string; width: number; height: number };
  variantB: { imageUrl: string; width: number; height: number };
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold tracking-tight text-neutral-700">{aspect}</span>
        <span className="font-mono text-[10px] tabular-nums text-neutral-400">
          {variantA.width}×{variantA.height}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {([variantA, variantB] as const).map((v, idx) => (
          <div key={idx} className="group relative">
            <div
              className={`${aspectStyle[aspect]} overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 transition-shadow hover:shadow-md`}
            >
              <img
                src={v.imageUrl}
                alt={`${aspect} variant ${idx === 0 ? 'A' : 'B'}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <span className="absolute left-1.5 top-1.5 rounded bg-neutral-900/80 px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-white shadow-sm">
              {idx === 0 ? 'A' : 'B'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VideoPreview({ video }: { video: PlatformVideo }) {
  const url = useMemo(() => URL.createObjectURL(video.blob), [video.blob]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return (
    <div className="flex flex-col gap-2">
      <div
        className={`${video.aspect === '9x16' ? 'aspect-[9/16]' : 'aspect-square'} overflow-hidden rounded-md border border-neutral-200 bg-black`}
      >
        <video
          src={url}
          controls
          playsInline
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex items-center justify-between text-[11px] text-neutral-500">
        <span className="font-medium text-neutral-700">{video.aspect} · {Math.round(video.durationSeconds)}s</span>
        <span className="font-mono tabular-nums">{video.width}×{video.height}</span>
      </div>
    </div>
  );
}

function CopyVariantCard({
  label,
  tone,
  rows,
  ctaButton,
}: {
  label: 'A' | 'B';
  tone: string;
  rows: { name: string; value: string; limit: number; bold?: boolean }[];
  ctaButton: string;
}) {
  return (
    <div className="rounded-md border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-neutral-900 font-mono text-[11px] font-semibold text-white">
            {label}
          </span>
          <span className="text-sm font-medium text-neutral-900">{tone}</span>
        </div>
        <code className="rounded bg-neutral-50 px-1.5 py-0.5 font-mono text-[10px] text-neutral-700">
          {ctaButton}
        </code>
      </div>
      <dl className="mt-3 space-y-2">
        {rows.map((row) => (
          <div key={row.name} className="grid grid-cols-[88px_1fr_auto] items-baseline gap-3">
            <dt className="text-[11px] uppercase tracking-wide text-neutral-500">{row.name}</dt>
            <dd className={row.bold ? 'font-semibold text-neutral-900' : 'text-neutral-800'}>
              {row.value}
            </dd>
            <CharBudget used={row.value.length} limit={row.limit} />
          </div>
        ))}
      </dl>
    </div>
  );
}

export function PlatformAssets({ approvedCopy, approvedImage }: Props) {
  const apiKeys = useAppStore((s) => s.keys);
  const locale = useAppStore((s) => s.locale);
  const brand = useAppStore((s) => s.brand);
  const brief = useAppStore((s) => s.brief);
  const imageQualityTier = useAppStore((s) => s.imageQualityTier);
  const videoProvider = useAppStore((s) => s.videoProvider);
  const audioVariants = useAppStore((s) => audioVariantsOf(s.steps.audio.variants));
  const audioSelectedIndex = useAppStore((s) => s.steps.audio.selectedIndex);
  const scriptVariants = useAppStore((s) => scriptVariantsOf(s.steps.script.variants));
  const scriptSelectedIndex = useAppStore((s) => s.steps.script.selectedIndex);
  const openDrawer = useAppStore((s) => s.openDrawer);
  const t = useT();

  const approvedAudio =
    audioSelectedIndex !== null ? audioVariants[audioSelectedIndex] : undefined;
  const approvedScript =
    scriptSelectedIndex !== null ? scriptVariants[scriptSelectedIndex] : undefined;

  const [phase, setPhase] = useState<Phase>('idle');
  const [bundle, setBundle] = useState<PlatformAssetsBundle | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [downloading, setDownloading] = useState<'meta' | 'x' | null>(null);
  const [downloadResult, setDownloadResult] = useState<PlatformDownloadResult | null>(null);

  // Generation options — checkbox-style toggles the user can opt out of for speed.
  const [includeCarousel, setIncludeCarousel] = useState(true);
  const [includeVideo, setIncludeVideo] = useState(true);

  const falMissing = apiKeys.fal.trim().length === 0;
  const aiKeyMissing = apiKeys.openai.trim().length === 0 && apiKeys.anthropic.trim().length === 0;
  const keysMissing = falMissing || aiKeyMissing;

  // Pre-flight cost estimate. Pipeline:
  //   - Platform image pairs: 7 fresh Flux calls (4 aspects × A+B, minus the
  //     4:5 A which reuses the approved hero)
  //   - Carousel: +3 Flux calls when opted in
  //   - AI video: +2 Kling clips (9:16 + 1:1) when ai_kling provider is set
  //     AND audio is approved (slideshow is the gate for video tasks)
  const flux = TIER_COST_USD[imageQualityTier];
  const platformImageCost = 7 * flux;
  const carouselCost = includeCarousel ? 3 * flux : 0;
  const aiVideoCost =
    includeVideo && approvedAudio && videoProvider === 'ai_kling'
      ? 2 * KLING_COST_USD_PER_CLIP
      : 0;
  const estimatedCost = platformImageCost + carouselCost + aiVideoCost;
  const costLabel = estimatedCost < 0.01 ? '<$0.01' : `$${estimatedCost.toFixed(2)}`;

  async function runGenerate() {
    setError(null);
    setDownloadResult(null);
    setBundle(null);
    try {
      // 1. Copy adaptation
      setPhase('generating-copy');
      const copy = await generatePlatformCopy({
        brief,
        approvedCopy,
        apiKeys: { openai: apiKeys.openai, anthropic: apiKeys.anthropic },
        locale,
        brand,
      });

      // 2. Image pairs (A/B per aspect)
      setPhase('generating-images');
      const imagePairs = await generatePlatformImagePairs({
        approvedImagePrompt: approvedImage.prompt,
        approvedImageUrl: approvedImage.imageUrl,
        apiKeys: { fal: apiKeys.fal },
        brand,
        tier: imageQualityTier,
      });

      // 3. Carousel (Meta, optional)
      let carousel = null;
      if (includeCarousel) {
        try {
          setPhase('generating-carousel');
          carousel = await generateCarousel({
            approvedImagePrompt: approvedImage.prompt,
            approvedImageUrl: approvedImage.imageUrl,
            apiKeys: { fal: apiKeys.fal },
            brand,
            tier: imageQualityTier,
          });
        } catch (e) {
          // Carousel failure is non-fatal — log and continue.
          // eslint-disable-next-line no-console
          console.warn('[platform] carousel failed:', e);
        }
      }

      // 4. Video (multi-shot slideshow, optional, needs audio; ai_kling is
      // an additional silent motion clip generated in parallel when the
      // user opts in via Settings)
      const videos: PlatformVideo[] = [];
      if (includeVideo && approvedAudio) {
        setPhase('generating-video');

        // Pass every available same-aspect image as a shot for variety, plus
        // carousel cards for the 1:1 video (carousel is square-only).
        const reelsImages = (imagePairs.find((p) => p.aspect === '9x16')?.variants ?? []).map(
          (v) => v.imageUrl,
        );
        const xImagesBase = (imagePairs.find((p) => p.aspect === '1x1')?.variants ?? []).map(
          (v) => v.imageUrl,
        );
        const carouselImageUrls = carousel?.images.map((c) => c.imageUrl) ?? [];
        const xImages = [...xImagesBase, ...carouselImageUrls];

        const scriptText = approvedScript?.script ?? '';
        const alignment = approvedAudio.alignment;
        const tasks: Promise<PlatformVideo | null>[] = [];
        if (reelsImages.length > 0) {
          tasks.push(
            generateSlideshowVideo({
              aspect: '9x16' as VideoAspect,
              imageUrls: reelsImages,
              audioUrl: approvedAudio.audioUrl,
              headline: approvedCopy.headline,
              cta: approvedCopy.cta,
              brandName: brand.name,
              scriptText,
              ...(alignment ? { alignment } : {}),
            }).catch((e) => {
              // eslint-disable-next-line no-console
              console.warn('[platform] 9x16 video failed:', e);
              return null;
            }),
          );
        }
        if (xImages.length > 0) {
          tasks.push(
            generateSlideshowVideo({
              aspect: '1x1' as VideoAspect,
              imageUrls: xImages,
              audioUrl: approvedAudio.audioUrl,
              headline: approvedCopy.headline,
              cta: approvedCopy.cta,
              brandName: brand.name,
              scriptText,
              ...(alignment ? { alignment } : {}),
            }).catch((e) => {
              // eslint-disable-next-line no-console
              console.warn('[platform] 1x1 video failed:', e);
              return null;
            }),
          );
        }

        // AI motion clip (Kling) — opt-in via Settings. Generates silent
        // 5-second clips with real camera + subject motion that the
        // slideshow path can't produce. Runs in parallel with slideshow so
        // total wall-clock is bounded by the slowest call (~75s).
        if (videoProvider === 'ai_kling' && apiKeys.fal.trim()) {
          const aiPrompt = approvedImage.prompt;
          if (reelsImages.length > 0) {
            tasks.push(
              generateAiVideo({
                aspect: '9x16' as AiVideoAspect,
                imageUrl: reelsImages[0]!,
                prompt: aiPrompt,
                falKey: apiKeys.fal,
              }).catch((e) => {
                // eslint-disable-next-line no-console
                console.warn('[platform] 9x16 ai video failed:', e);
                return null;
              }),
            );
          }
          if (xImages.length > 0) {
            tasks.push(
              generateAiVideo({
                aspect: '1x1' as AiVideoAspect,
                imageUrl: xImages[0]!,
                prompt: aiPrompt,
                falKey: apiKeys.fal,
              }).catch((e) => {
                // eslint-disable-next-line no-console
                console.warn('[platform] 1x1 ai video failed:', e);
                return null;
              }),
            );
          }
        }

        const results = await Promise.all(tasks);
        for (const r of results) if (r) videos.push(r);
      }

      setBundle({ copy, imagePairs, carousel, videos, generatedAt: Date.now() });
      setPhase('ready');
    } catch (err) {
      setError(err);
      setPhase('error');
    }
  }

  async function runDownload(platform: 'meta' | 'x') {
    if (!bundle) return;
    setDownloading(platform);
    setDownloadResult(null);
    try {
      const extras = {
        scriptText: approvedScript?.script,
        audioDurationSeconds:
          approvedAudio?.durationSeconds ?? bundle.videos[0]?.durationSeconds,
        alignment: approvedAudio?.alignment,
      };
      const result =
        platform === 'meta'
          ? await downloadMetaPackage(brief.productName, bundle, extras)
          : await downloadXPackage(brief.productName, bundle, extras);
      setDownloadResult(result);
    } catch (err) {
      setError(err);
    } finally {
      setDownloading(null);
    }
  }

  const metaPairs = bundle?.imagePairs.filter((p) => META_ASPECTS_TO_SHOW.includes(p.aspect)) ?? [];
  const xPairs = bundle?.imagePairs.filter((p) => X_ASPECTS_TO_SHOW.includes(p.aspect)) ?? [];
  // Slideshow has audio, so it's the primary preview slot. AI clips are
  // shown alongside as silent-motion alternates when generated.
  const reelsSlideshow = bundle?.videos.find(
    (v) => v.aspect === '9x16' && v.provider !== 'ai_kling',
  );
  const reelsAiVideo = bundle?.videos.find((v) => v.aspect === '9x16' && v.provider === 'ai_kling');
  const xSlideshow = bundle?.videos.find(
    (v) => v.aspect === '1x1' && v.provider !== 'ai_kling',
  );
  const xAiVideo = bundle?.videos.find((v) => v.aspect === '1x1' && v.provider === 'ai_kling');

  const progressLabel: Partial<Record<Phase, string>> = {
    'generating-copy': t('platform.progressCopy'),
    'generating-images': t('platform.progressImages'),
    'generating-carousel': t('platform.progressCarousel'),
    'generating-video': t('platform.progressVideo'),
  };

  return (
    <section className="overflow-hidden rounded-lg border border-rule bg-white">
      <header className="border-b border-rule bg-gradient-to-r from-neutral-50 to-white px-6 py-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
              {t('platform.eyebrow')}
            </p>
            <h3 className="font-serif mt-1 text-2xl font-medium tracking-tight text-ink">
              {t('platform.heading')}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
              {t('platform.subtitle')}
            </p>
          </div>
          {phase === 'ready' && bundle && (
            <span className="font-mono text-[11px] tabular-nums text-neutral-500">
              {t('platform.generatedAt')} {new Date(bundle.generatedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      </header>

      <div className="px-6 py-6">
        {keysMissing && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-medium">{t('platform.keysMissingTitle')}</p>
            <ul className="mt-1 list-disc pl-5 text-xs">
              {falMissing && <li>{t('platform.keyMissing.fal')}</li>}
              {aiKeyMissing && <li>{t('platform.keyMissing.ai')}</li>}
            </ul>
            <button
              type="button"
              onClick={openDrawer}
              className="mt-3 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100"
            >
              {t('common.openSettings')}
            </button>
          </div>
        )}

        {phase === 'idle' && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-md border border-neutral-200 bg-white p-3 transition-colors hover:bg-neutral-50">
                <input
                  type="checkbox"
                  checked={includeCarousel}
                  onChange={(e) => setIncludeCarousel(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-neutral-900"
                />
                <div>
                  <p className="text-sm font-medium text-neutral-900">{t('platform.option.carousel')}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">{t('platform.option.carouselNote')}</p>
                </div>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-md border border-neutral-200 bg-white p-3 transition-colors hover:bg-neutral-50">
                <input
                  type="checkbox"
                  checked={includeVideo}
                  onChange={(e) => setIncludeVideo(e.target.checked)}
                  disabled={!approvedAudio}
                  className="mt-0.5 h-4 w-4 accent-neutral-900 disabled:opacity-50"
                />
                <div>
                  <p className="text-sm font-medium text-neutral-900">{t('platform.option.video')}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {approvedAudio ? t('platform.option.videoNote') : t('platform.option.videoNoAudio')}
                  </p>
                </div>
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={runGenerate}
                disabled={keysMissing}
                className="rounded-md bg-brand px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-ink-faint"
              >
                {t('platform.generate')}
                <span className="ml-2 font-mono text-[11px] tabular-nums opacity-80">~{costLabel}</span>
              </button>
              <span className="text-xs text-neutral-500">
                {t('platform.costEstimate', {
                  tier: t(`generation.tier.${imageQualityTier}` as const),
                  videoMode: t(`generation.video.${videoProvider}` as const),
                })}
              </span>
            </div>
          </div>
        )}

        {(phase === 'generating-copy' ||
          phase === 'generating-images' ||
          phase === 'generating-carousel' ||
          phase === 'generating-video') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-neutral-700">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-brand" aria-hidden="true" />
              <span>{progressLabel[phase]}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="aspect-square animate-pulse rounded-md bg-neutral-100" />
              <div className="aspect-[4/5] animate-pulse rounded-md bg-neutral-100" />
              <div className="aspect-[9/16] animate-pulse rounded-md bg-neutral-100" />
              <div className="aspect-[1.91/1] animate-pulse rounded-md bg-neutral-100" />
            </div>
          </div>
        )}

        {phase === 'error' && (
          <InlineError error={error} onRetry={runGenerate} />
        )}

        {phase === 'ready' && bundle && (
          <div className="space-y-10">
            {bundle.copy.restrictedCategoryWarning && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <p className="font-medium">{t('platform.restrictedTitle')}</p>
                <p className="mt-1">{bundle.copy.restrictedCategoryWarning}</p>
              </div>
            )}

            {/* Meta */}
            <div className="space-y-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-200 pb-2">
                <div className="flex items-baseline gap-2">
                  <h4 className="font-serif text-lg font-medium tracking-tight text-ink">Meta Ads</h4>
                  <span className="text-xs text-neutral-500">{t('platform.metaPlacements')}</span>
                </div>
                <button
                  type="button"
                  onClick={() => void runDownload('meta')}
                  disabled={downloading !== null}
                  className="rounded-md bg-neutral-900 px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
                >
                  {downloading === 'meta' ? t('platform.downloading') : t('platform.downloadMeta')}
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {metaPairs.map((pair) => (
                  <AspectPair
                    key={`meta-${pair.aspect}`}
                    aspect={pair.aspect}
                    variantA={pair.variants[0]}
                    variantB={pair.variants[1]}
                  />
                ))}
              </div>

              {reelsSlideshow && (
                <div className="grid gap-4 md:grid-cols-[280px_1fr]">
                  <VideoPreview video={reelsSlideshow} />
                  <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                    <p className="font-medium text-neutral-900">{t('platform.videoForReels')}</p>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-600">{t('platform.videoNote')}</p>
                  </div>
                </div>
              )}

              {reelsAiVideo && (
                <div className="grid gap-4 md:grid-cols-[280px_1fr]">
                  <VideoPreview video={reelsAiVideo} />
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                    <p className="font-medium">{t('platform.aiVideoForReels')}</p>
                    <p className="mt-1 text-xs leading-relaxed">{t('platform.aiVideoNote')}</p>
                  </div>
                </div>
              )}

              {bundle.carousel && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-neutral-500">{t('platform.carousel')}</p>
                  <div className="mt-2 grid grid-cols-3 gap-3">
                    {bundle.carousel.images.map((card) => (
                      <div key={card.index} className="aspect-square overflow-hidden rounded-md border border-neutral-200 bg-neutral-100">
                        <img
                          src={card.imageUrl}
                          alt={`Carousel card ${card.index + 1}`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                <CopyVariantCard
                  label="A"
                  tone={bundle.copy.meta.variants[0].toneLabel}
                  ctaButton={bundle.copy.meta.variants[0].ctaButton}
                  rows={[
                    { name: 'Headline', value: bundle.copy.meta.variants[0].headline, limit: 27, bold: true },
                    { name: 'Primary', value: bundle.copy.meta.variants[0].primaryText, limit: 125 },
                    { name: 'Description', value: bundle.copy.meta.variants[0].description, limit: 27 },
                  ]}
                />
                <CopyVariantCard
                  label="B"
                  tone={bundle.copy.meta.variants[1].toneLabel}
                  ctaButton={bundle.copy.meta.variants[1].ctaButton}
                  rows={[
                    { name: 'Headline', value: bundle.copy.meta.variants[1].headline, limit: 27, bold: true },
                    { name: 'Primary', value: bundle.copy.meta.variants[1].primaryText, limit: 125 },
                    { name: 'Description', value: bundle.copy.meta.variants[1].description, limit: 27 },
                  ]}
                />
              </div>
            </div>

            {/* X */}
            <div className="space-y-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-200 pb-2">
                <div className="flex items-baseline gap-2">
                  <h4 className="font-serif text-lg font-medium tracking-tight text-ink">X Ads</h4>
                  <span className="text-xs text-neutral-500">{t('platform.xPlacements')}</span>
                </div>
                <button
                  type="button"
                  onClick={() => void runDownload('x')}
                  disabled={downloading !== null}
                  className="rounded-md bg-neutral-900 px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
                >
                  {downloading === 'x' ? t('platform.downloading') : t('platform.downloadX')}
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {xPairs.map((pair) => (
                  <AspectPair
                    key={`x-${pair.aspect}`}
                    aspect={pair.aspect}
                    variantA={pair.variants[0]}
                    variantB={pair.variants[1]}
                  />
                ))}
              </div>

              {xSlideshow && (
                <div className="grid gap-4 md:grid-cols-[280px_1fr]">
                  <VideoPreview video={xSlideshow} />
                  <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                    <p className="font-medium text-neutral-900">{t('platform.videoForX')}</p>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-600">{t('platform.videoNote')}</p>
                  </div>
                </div>
              )}

              {xAiVideo && (
                <div className="grid gap-4 md:grid-cols-[280px_1fr]">
                  <VideoPreview video={xAiVideo} />
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                    <p className="font-medium">{t('platform.aiVideoForX')}</p>
                    <p className="mt-1 text-xs leading-relaxed">{t('platform.aiVideoNote')}</p>
                  </div>
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                {bundle.copy.x.variants.map((v, idx) => (
                  <div
                    key={idx}
                    className="rounded-md border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-sm"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="flex items-baseline gap-2">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-neutral-900 font-mono text-[11px] font-semibold text-white">
                          {idx === 0 ? 'A' : 'B'}
                        </span>
                        <span className="text-sm font-medium text-neutral-900">{v.toneLabel}</span>
                      </div>
                      <code className="rounded bg-neutral-50 px-1.5 py-0.5 font-mono text-[10px] text-neutral-700">
                        {v.ctaButton}
                      </code>
                    </div>
                    <dl className="mt-3 space-y-2">
                      <div className="grid grid-cols-[88px_1fr_auto] items-baseline gap-3">
                        <dt className="text-[11px] uppercase tracking-wide text-neutral-500">Tweet</dt>
                        <dd className="whitespace-pre-wrap text-neutral-800">{v.tweetText}</dd>
                        <CharBudget used={v.tweetText.length} limit={280} />
                      </div>
                      {v.hashtags.length > 0 && (
                        <div className="grid grid-cols-[88px_1fr_auto] items-baseline gap-3">
                          <dt className="text-[11px] uppercase tracking-wide text-neutral-500">Hashtags</dt>
                          <dd className="flex flex-wrap gap-1.5">
                            {v.hashtags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 font-mono text-[11px] text-sky-700"
                              >
                                #{tag}
                              </span>
                            ))}
                          </dd>
                          <span />
                        </div>
                      )}
                    </dl>
                  </div>
                ))}
              </div>
            </div>

            {downloadResult && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-900">
                <p>
                  <span className="font-mono">{downloadResult.filename}</span> —{' '}
                  {t('platform.embeddedCount', {
                    n: downloadResult.imagesEmbedded,
                    failed: downloadResult.imagesFailed,
                  })}
                  {downloadResult.videoEmbedded && <> · {t('platform.videoEmbedded')}</>}
                  {downloadResult.carouselCardsEmbedded > 0 && (
                    <> · {t('platform.carouselEmbedded', { n: downloadResult.carouselCardsEmbedded })}</>
                  )}
                </p>
                {downloadResult.copyOverages.length > 0 && (
                  <p className="mt-1 text-amber-700">
                    {t('platform.copyOverages')}: {downloadResult.copyOverages.join(', ')}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 border-t border-neutral-100 pt-4">
              <button
                type="button"
                onClick={runGenerate}
                disabled={downloading !== null}
                className="rounded-md border border-neutral-300 bg-white px-3.5 py-1.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50 disabled:opacity-50"
              >
                {t('platform.regenerate')}
              </button>
              <span className="text-xs text-neutral-500">{t('platform.regenerateNote')}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
