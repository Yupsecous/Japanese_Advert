// Brand-prompt assembly. Shared so backend prompt construction matches
// what web/android pass through. Brand prompts go INTO the system prompt
// of every generation call.

import { isBrandDictionaryEmpty, type BrandDictionary } from './types';

export function brandPromptBlock(brand: BrandDictionary | undefined): string {
  if (!brand || isBrandDictionaryEmpty(brand)) return '';
  const lines = ['', '<brand_dictionary>'];
  if (brand.name) lines.push(`Brand: ${brand.name}`);
  if (brand.voiceCharacter) lines.push(`Voice character: ${brand.voiceCharacter}`);
  if (brand.preferredTerms.length > 0) {
    lines.push(`Preferred terms (lean into when natural): ${brand.preferredTerms.join(', ')}`);
  }
  if (brand.bannedTerms.length > 0) {
    lines.push(`Banned terms (must NEVER appear): ${brand.bannedTerms.join(', ')}`);
  }
  if (brand.audienceRefinement) {
    lines.push(`Audience refinement: ${brand.audienceRefinement}`);
  }
  if (brand.learnedInsights.length > 0) {
    lines.push('Learned insights from prior campaigns:');
    for (const insight of brand.learnedInsights) lines.push(`  - ${insight}`);
  }
  lines.push('</brand_dictionary>');
  return lines.join('\n');
}

export function brandVisualBlock(brand: BrandDictionary | undefined): string {
  if (!brand || !brand.visualRules.trim()) return '';
  return `\n<brand_visual_rules>\n${brand.visualRules.trim()}\n</brand_visual_rules>`;
}
