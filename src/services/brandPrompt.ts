import { isBrandDictionaryEmpty, type BrandDictionary } from '../types';

// Builds an injectable system-prompt block describing the active brand
// dictionary. Empty if the dictionary is unset (so the feature is purely
// additive — never hurts output quality when off). Uses XML-style tags
// because both Claude and GPT-4o reliably scope to fenced blocks like this.
//
// Split into two helpers:
//   - brandPromptBlock: the textual / voice / banned-terms / preferred-terms
//     portion that applies to copy, script, design copy, platform copy, etc.
//   - brandVisualBlock: the visual-rules portion that applies to the image
//     prompt builder.
//
// Either returns '' when the relevant fields are empty.

export function brandPromptBlock(brand: BrandDictionary | undefined | null): string {
  if (!brand || isBrandDictionaryEmpty(brand)) return '';
  const lines: string[] = ['', '<brand_dictionary>'];
  if (brand.name.trim()) {
    lines.push(`Brand: ${brand.name.trim()}`);
  }
  if (brand.voiceCharacter.trim()) {
    lines.push(`Brand voice: ${brand.voiceCharacter.trim()}`);
  }
  if (brand.bannedTerms.length > 0) {
    lines.push(
      `NEVER use these words or phrases (case-insensitive, including stems): ${brand.bannedTerms.join(', ')}`,
    );
  }
  if (brand.preferredTerms.length > 0) {
    lines.push(
      `PREFERRED words/phrases — lean into these when natural; do NOT force them in: ${brand.preferredTerms.join(', ')}`,
    );
  }
  if (brand.audienceRefinement.trim()) {
    lines.push(`Audience refinement applied on top of per-brief audience: ${brand.audienceRefinement.trim()}`);
  }
  lines.push(
    'These brand constraints take priority over your default tone. If a banned term appears anywhere in your output, regenerate the line.',
    '</brand_dictionary>',
  );
  return lines.join('\n');
}

export function brandVisualBlock(brand: BrandDictionary | undefined | null): string {
  if (!brand || isBrandDictionaryEmpty(brand)) return '';
  if (!brand.visualRules.trim()) return '';
  return [
    '',
    '<brand_visual_rules>',
    brand.visualRules.trim(),
    'These rules take priority over the default photographic guidance. Compose so they are respected.',
    '</brand_visual_rules>',
  ].join('\n');
}
