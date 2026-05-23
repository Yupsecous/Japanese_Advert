import JSZip from 'jszip';
import { generateDirectorsNotesMarkdown } from './directorsNotes';
import {
  audioVariantsOf,
  copyVariantsOf,
  designVariantsOf,
  imageVariantsOf,
  type AspectRatio,
  type PlatformAssetsBundle,
  type PlatformImagePair,
} from '../types';
import type { AppState } from '../store';

export type DownloadResult = {
  imageEmbedded: boolean;
  imageWarning?: string;
};

function sanitize(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'package'
  );
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function extensionForMime(mime: string): string {
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  return 'jpg';
}

export async function downloadPackage(state: AppState): Promise<DownloadResult> {
  const zip = new JSZip();

  const copyStep = state.steps.copy;
  const imageStep = state.steps.image;
  const audioStep = state.steps.audio;
  const designStep = state.steps.design;

  const copy = copyVariantsOf(copyStep.variants)[copyStep.selectedIndex ?? -1];
  const image = imageVariantsOf(imageStep.variants)[imageStep.selectedIndex ?? -1];
  const audio = audioVariantsOf(audioStep.variants)[audioStep.selectedIndex ?? -1];
  const design = designVariantsOf(designStep.variants)[designStep.selectedIndex ?? -1];

  if (!copy || !image || !audio) {
    throw new Error('Final package is incomplete — re-approve missing steps.');
  }

  zip.file(
    'copy.txt',
    `Headline: ${copy.headline}\n\nCaption: ${copy.caption}\n\nCTA: ${copy.cta}\n`,
  );

  let imageEmbedded = false;
  let imageWarning: string | undefined;
  try {
    const res = await fetch(image.imageUrl);
    if (!res.ok) {
      throw new Error(`Image fetch returned ${res.status}`);
    }
    const blob = await res.blob();
    const ext = extensionForMime(blob.type);
    zip.file(`image.${ext}`, blob);
    imageEmbedded = true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    imageWarning = `Image direct fetch was blocked (${msg}). Saved the URL instead.`;
    zip.file('image-url.txt', `${image.imageUrl}\n\nPrompt:\n${image.prompt}\n`);
  }

  // audioBlob is absent for sample-preset variants — fetch the audioUrl in
  // that case (works for both local /samples/audio/ and external mp3s).
  let audioBlob: Blob | null = audio.audioBlob ?? null;
  if (!audioBlob) {
    try {
      const res = await fetch(audio.audioUrl);
      if (res.ok) audioBlob = await res.blob();
    } catch {
      audioBlob = null;
    }
  }
  if (audioBlob) {
    zip.file('voiceover.mp3', audioBlob);
  } else {
    zip.file(
      'voiceover-url.txt',
      `${audio.audioUrl}\n\nAudio could not be fetched as bytes. Open the URL above to download the file.\n`,
    );
  }
  if (design) {
    const header = [
      `// Generated landing-page component.`,
      `// Single-file React + Tailwind v4, no imports required (React is provided by host).`,
      `//`,
      `// Component: ${design.componentName}`,
      `// Rationale: ${design.rationale.replace(/\n/g, ' ')}`,
      ``,
    ].join('\n');
    zip.file('landing-page.tsx', header + design.code + '\n');
  }

  zip.file('director-notes.md', generateDirectorsNotesMarkdown(state));

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  triggerDownload(zipBlob, `${sanitize(state.brief.productName)}-package.zip`);

  return { imageEmbedded, ...(imageWarning ? { imageWarning } : {}) };
}

// ---------------------------------------------------------------------------
// Platform-ready exports (Meta, X)
// ---------------------------------------------------------------------------

// Per-aspect file names for each platform. These map onto how the user will
// pick the asset in Ads Manager. Naming uses underscores so the file stays
// readable in OS file pickers.
const META_ASPECT_FILES: Partial<Record<AspectRatio, string>> = {
  '1x1': 'feed-1x1',
  '4x5': 'feed-4x5',
  '9x16': 'stories-reels-9x16',
};

const X_ASPECT_FILES: Partial<Record<AspectRatio, string>> = {
  '1x1': 'square-1x1',
  '1.91x1': 'landscape-1.91x1',
};

async function fetchAsBlob(url: string): Promise<Blob | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}

function extensionForMimeOrJpg(mime: string): string {
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  return 'jpg';
}

function extensionForVideoMime(mime: string): string {
  if (mime.includes('mp4')) return 'mp4';
  if (mime.includes('webm')) return 'webm';
  return 'webm';
}

function metaChecklist(bundle: PlatformAssetsBundle, includedVideo: boolean): string {
  const [a, b] = bundle.copy.meta.variants;
  const overLimit = (n: number, limit: number) => (n > limit ? '✗ OVER LIMIT' : '✓');
  const lines = [
    '# Meta Ads — Spec Checklist',
    '',
    '## Image variants in this package',
    '',
    'Each aspect ratio ships with two variants (`-a` and `-b`) for split testing.',
    '',
  ];
  for (const aspect of Object.keys(META_ASPECT_FILES) as AspectRatio[]) {
    const base = META_ASPECT_FILES[aspect];
    const pair = bundle.imagePairs.find((p) => p.aspect === aspect);
    if (!base || !pair) continue;
    lines.push(`- ${aspect} (${pair.variants[0].width}×${pair.variants[0].height}) → \`${base}-a\` & \`${base}-b\``);
  }
  if (bundle.carousel) {
    lines.push(`- Carousel (1:1) → \`carousel-1.png\`, \`carousel-2.png\`, \`carousel-3.png\` (${bundle.carousel.images.length} card${bundle.carousel.images.length === 1 ? '' : 's'})`);
  }
  if (includedVideo) {
    lines.push('- Video (9:16, Reels/Stories) → `stories-reels-9x16.{webm|mp4}`');
  }
  lines.push(
    '',
    '## Placement guidance',
    '- 1:1 — Facebook Feed (square), Instagram Feed (square)',
    '- 4:5 — Facebook Feed (portrait), Instagram Feed (portrait, best mobile real estate)',
    '- 9:16 — Stories, Reels (image and/or video)',
    '- Carousel — Instagram & Facebook Feed multi-card ad. Upload all 3 in order.',
    '',
    '## Copy variant A — ' + a.toneLabel,
    `- Headline: "${a.headline}" (${a.headline.length}/27) ${overLimit(a.headline.length, 27)}`,
    `- Primary text: "${a.primaryText}" (${a.primaryText.length}/125) ${overLimit(a.primaryText.length, 125)}`,
    `- Description: "${a.description}" (${a.description.length}/27) ${overLimit(a.description.length, 27)}`,
    `- CTA button: \`${a.ctaButton}\` (Meta API enum)`,
    '',
    '## Copy variant B — ' + b.toneLabel,
    `- Headline: "${b.headline}" (${b.headline.length}/27) ${overLimit(b.headline.length, 27)}`,
    `- Primary text: "${b.primaryText}" (${b.primaryText.length}/125) ${overLimit(b.primaryText.length, 125)}`,
    `- Description: "${b.description}" (${b.description.length}/27) ${overLimit(b.description.length, 27)}`,
    `- CTA button: \`${b.ctaButton}\` (Meta API enum)`,
    '',
    '## A/B test setup',
    "- Recommended: create one ad set per variant pair (image-A + copy-A vs image-B + copy-B), or use Meta's built-in Advantage+ creative test to let the platform mix.",
    '- Same audience, same budget, same placement. Variant tone is the independent variable.',
    '',
    '## Notes',
    "- Image-text ratio: not measured. All generated images are photographic with no overlaid text. Meta deprecated the strict 20% rule but still recommends keeping overlay text minimal.",
    '- The video file is a Ken Burns slideshow over your approved hero image, with the approved voiceover. ~20s.',
  );
  if (bundle.copy.restrictedCategoryWarning) {
    lines.push(
      '',
      '## ⚠ Restricted-category notice',
      bundle.copy.restrictedCategoryWarning,
      "- Meta restricts ads in categories like alcohol, financial services, gambling, dating, and political content. Verify your account is approved for the relevant category before submitting.",
    );
  }
  return lines.join('\n') + '\n';
}

function xChecklist(bundle: PlatformAssetsBundle, includedVideo: boolean): string {
  const [a, b] = bundle.copy.x.variants;
  const overLimit = (n: number, limit: number) => (n > limit ? '✗ OVER LIMIT' : '✓');
  const lines = [
    '# X Ads — Spec Checklist',
    '',
    '## Image variants in this package',
    '',
    'Each aspect ratio ships with two variants (`-a` and `-b`) for split testing.',
    '',
  ];
  for (const aspect of Object.keys(X_ASPECT_FILES) as AspectRatio[]) {
    const base = X_ASPECT_FILES[aspect];
    const pair = bundle.imagePairs.find((p) => p.aspect === aspect);
    if (!base || !pair) continue;
    lines.push(`- ${aspect} (${pair.variants[0].width}×${pair.variants[0].height}) → \`${base}-a\` & \`${base}-b\``);
  }
  if (includedVideo) {
    lines.push('- Video (1:1, Promoted tweet) → `square-1x1.{webm|mp4}`');
  }
  lines.push(
    '',
    '## Placement guidance',
    '- 1.91:1 — Promoted tweet with website card (landscape)',
    '- 1:1 — Promoted tweet (square in-timeline)',
    '- Video (1:1) — Promoted tweet with autoplay video. ~20s.',
    '',
    '## Copy variant A — ' + a.toneLabel,
    `- Tweet text (${a.tweetText.length}/280) ${overLimit(a.tweetText.length, 280)}`,
    `- "${a.tweetText}"`,
    `- CTA button: \`${a.ctaButton}\` (X website-card enum)`,
    ...(a.hashtags.length > 0
      ? [`- Hashtags: ${a.hashtags.map((h) => '#' + h).join(' ')}`]
      : []),
    '',
    '## Copy variant B — ' + b.toneLabel,
    `- Tweet text (${b.tweetText.length}/280) ${overLimit(b.tweetText.length, 280)}`,
    `- "${b.tweetText}"`,
    `- CTA button: \`${b.ctaButton}\` (X website-card enum)`,
    ...(b.hashtags.length > 0
      ? [`- Hashtags: ${b.hashtags.map((h) => '#' + h).join(' ')}`]
      : []),
    '',
    '## Notes',
    '- The tweet body should leave room for any handle or URL X auto-appends. Aim for ≤260 to be safe.',
    '- The website-card CTA only fires when the tweet includes a destination URL — set that in Ads Manager.',
  );
  if (bundle.copy.restrictedCategoryWarning) {
    lines.push(
      '',
      '## ⚠ Restricted-category notice',
      bundle.copy.restrictedCategoryWarning,
      '- X has its own restricted-content categories. Verify your account is approved before submitting.',
    );
  }
  return lines.join('\n') + '\n';
}

export type PlatformDownloadResult = {
  productName: string;
  filename: string;
  imagesEmbedded: number;
  imagesFailed: number;
  videoEmbedded: boolean;
  carouselCardsEmbedded: number;
  copyOverages: string[];
};

async function addImagePairToZip(args: {
  zip: JSZip;
  pair: PlatformImagePair;
  baseName: string;
}): Promise<{ embedded: number; failed: number }> {
  let embedded = 0;
  let failed = 0;
  for (const variant of args.pair.variants) {
    const blob = await fetchAsBlob(variant.imageUrl);
    if (!blob) {
      failed += 1;
      args.zip.file(
        `${args.baseName}-${variant.variantLabel.toLowerCase()}-url.txt`,
        `${variant.imageUrl}\n\nDirect fetch was blocked. Open the URL above to download manually.\n`,
      );
      continue;
    }
    const ext = extensionForMimeOrJpg(blob.type);
    args.zip.file(`${args.baseName}-${variant.variantLabel.toLowerCase()}.${ext}`, blob);
    embedded += 1;
  }
  return { embedded, failed };
}

async function buildPlatformZip(args: {
  productName: string;
  platform: 'meta' | 'x';
  bundle: PlatformAssetsBundle;
}): Promise<{ blob: Blob; result: PlatformDownloadResult }> {
  const zip = new JSZip();
  const isMeta = args.platform === 'meta';
  const fileMap = isMeta ? META_ASPECT_FILES : X_ASPECT_FILES;
  const aspects = Object.keys(fileMap) as AspectRatio[];

  let imagesEmbedded = 0;
  let imagesFailed = 0;
  for (const aspect of aspects) {
    const baseName = fileMap[aspect];
    if (!baseName) continue;
    const pair = args.bundle.imagePairs.find((p) => p.aspect === aspect);
    if (!pair) {
      imagesFailed += 2;
      zip.file(
        `${baseName}-missing.txt`,
        `Images at aspect ${aspect} were not generated. Re-run "Generate platform assets" or check fal.ai quota.\n`,
      );
      continue;
    }
    const r = await addImagePairToZip({ zip, pair, baseName });
    imagesEmbedded += r.embedded;
    imagesFailed += r.failed;
  }

  // Carousel — Meta only
  let carouselCardsEmbedded = 0;
  if (isMeta && args.bundle.carousel) {
    for (const card of args.bundle.carousel.images) {
      const blob = await fetchAsBlob(card.imageUrl);
      const name = `carousel-${card.index + 1}`;
      if (!blob) {
        zip.file(
          `${name}-url.txt`,
          `${card.imageUrl}\n\nDirect fetch was blocked. Open the URL above to download manually.\n`,
        );
        continue;
      }
      const ext = extensionForMimeOrJpg(blob.type);
      zip.file(`${name}.${ext}`, blob);
      carouselCardsEmbedded += 1;
    }
  }

  // Video
  let videoEmbedded = false;
  const wantedVideoAspect = isMeta ? '9x16' : '1x1';
  const video = args.bundle.videos.find((v) => v.aspect === wantedVideoAspect);
  if (video) {
    const ext = extensionForVideoMime(video.mimeType);
    const baseName = isMeta ? 'stories-reels-9x16' : 'square-1x1';
    zip.file(`${baseName}.${ext}`, video.blob);
    videoEmbedded = true;
  }

  // Copy JSON + checklist
  const copyOverages: string[] = [];
  if (isMeta) {
    const [a, b] = args.bundle.copy.meta.variants;
    if (a.headline.length > 27) copyOverages.push(`A.headline ${a.headline.length}/27`);
    if (a.primaryText.length > 125) copyOverages.push(`A.primary_text ${a.primaryText.length}/125`);
    if (a.description.length > 27) copyOverages.push(`A.description ${a.description.length}/27`);
    if (b.headline.length > 27) copyOverages.push(`B.headline ${b.headline.length}/27`);
    if (b.primaryText.length > 125) copyOverages.push(`B.primary_text ${b.primaryText.length}/125`);
    if (b.description.length > 27) copyOverages.push(`B.description ${b.description.length}/27`);
    zip.file(
      'copy.json',
      JSON.stringify(
        {
          variant_a: {
            tone_label: a.toneLabel,
            primary_text: a.primaryText,
            headline: a.headline,
            description: a.description,
            cta_button: a.ctaButton,
          },
          variant_b: {
            tone_label: b.toneLabel,
            primary_text: b.primaryText,
            headline: b.headline,
            description: b.description,
            cta_button: b.ctaButton,
          },
          _limits: { primary_text: 125, headline: 27, description: 27 },
        },
        null,
        2,
      ) + '\n',
    );
    zip.file('spec-checklist.md', metaChecklist(args.bundle, videoEmbedded));
  } else {
    const [a, b] = args.bundle.copy.x.variants;
    if (a.tweetText.length > 280) copyOverages.push(`A.tweet_text ${a.tweetText.length}/280`);
    if (b.tweetText.length > 280) copyOverages.push(`B.tweet_text ${b.tweetText.length}/280`);
    zip.file(
      'tweet.json',
      JSON.stringify(
        {
          variant_a: {
            tone_label: a.toneLabel,
            tweet_text: a.tweetText,
            cta_button: a.ctaButton,
            hashtags: a.hashtags,
          },
          variant_b: {
            tone_label: b.toneLabel,
            tweet_text: b.tweetText,
            cta_button: b.ctaButton,
            hashtags: b.hashtags,
          },
          _limit: 280,
        },
        null,
        2,
      ) + '\n',
    );
    zip.file('spec-checklist.md', xChecklist(args.bundle, videoEmbedded));
  }

  const filename = `${sanitize(args.productName)}-${args.platform}.zip`;
  const blob = await zip.generateAsync({ type: 'blob' });
  return {
    blob,
    result: {
      productName: args.productName,
      filename,
      imagesEmbedded,
      imagesFailed,
      videoEmbedded,
      carouselCardsEmbedded,
      copyOverages,
    },
  };
}

export async function downloadMetaPackage(
  productName: string,
  bundle: PlatformAssetsBundle,
): Promise<PlatformDownloadResult> {
  const { blob, result } = await buildPlatformZip({ productName, platform: 'meta', bundle });
  triggerDownload(blob, result.filename);
  return result;
}

export async function downloadXPackage(
  productName: string,
  bundle: PlatformAssetsBundle,
): Promise<PlatformDownloadResult> {
  const { blob, result } = await buildPlatformZip({ productName, platform: 'x', bundle });
  triggerDownload(blob, result.filename);
  return result;
}
