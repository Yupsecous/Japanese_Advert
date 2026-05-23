// Hash inputs per the dependency chain:
//
//   audience: brief — not cached via the variant cache (audience uses its
//             own briefCache in the audience slice). Included here only so
//             computeStepHash(state, 'audience') has a defined return.
//   copy   : brief + copy.refines
//   image  : brief + copy.approvedId + image.refines
//   script : brief + copy.approvedId + image.approvedId + script.refines
//   audio  : brief + copy.approvedId + image.approvedId + script.approvedId
//            + script.selectedVoiceId + audio.refines
//   design : brief + copy.approvedId + image.approvedId + design.refines
//
// Voice ID belongs to audio's hash, NOT script's. Changing voice
// invalidates audio only. Design depends on the visual identity (copy +
// image) but not on the spoken assets, so changing the voice/audio
// re-render does not invalidate the design.

import type { StepId } from '../types';
import type { AppState } from '../store';

const SEP = '\x1f'; // ASCII unit separator — won't appear in user input

function fnv1aHex(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function approvedVariantId(state: AppState, stepId: StepId): string {
  const step = state.steps[stepId];
  if (step.selectedIndex === null) return '';
  const v = step.variants[step.selectedIndex];
  return v?.id ?? '';
}

function refineDirections(state: AppState, stepId: StepId): string[] {
  const out: string[] = [];
  for (const h of state.steps[stepId].history) {
    if ((h.kind === 'refine' || h.kind === 'critique-applied') && h.direction) {
      out.push(h.direction);
    }
  }
  return out;
}

export function computeStepHash(state: AppState, stepId: StepId): string {
  const parts: string[] = [];

  parts.push(state.brief.productName);
  parts.push(state.brief.targetAudience);
  parts.push(state.brief.adAngle);

  if (stepId === 'image' || stepId === 'script' || stepId === 'audio' || stepId === 'design') {
    parts.push(approvedVariantId(state, 'copy'));
  }
  if (stepId === 'script' || stepId === 'audio' || stepId === 'design') {
    parts.push(approvedVariantId(state, 'image'));
  }
  if (stepId === 'audio') {
    parts.push(approvedVariantId(state, 'script'));
    parts.push(state.steps.script.selectedVoiceId ?? '');
  }

  parts.push('|REFINES|');
  for (const d of refineDirections(state, stepId)) parts.push(d);

  return fnv1aHex(parts.join(SEP));
}
