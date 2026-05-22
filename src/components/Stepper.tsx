import { useAppStore, activeStepId, isStepUnlocked } from '../store';
import { useT } from '../i18n/hooks';
import { STEP_ORDER, type StepId, type StepStatus } from '../types';

function statusGlyph(status: StepStatus): string {
  switch (status) {
    case 'approved':
      return '✓';
    case 'generating':
      return '…';
    case 'options':
    case 'refining':
      return '•';
    case 'pending':
    default:
      return '';
  }
}

export function Stepper() {
  const state = useAppStore();
  const active = activeStepId(state);
  const t = useT();

  return (
    // Horizontal scroll fallback on very narrow viewports (<360px or long
    // localized labels). On sm+, the row sits comfortably on one line.
    <ol className="flex w-full items-center gap-1.5 overflow-x-auto pb-1 sm:gap-2 sm:overflow-visible sm:pb-0">
      {STEP_ORDER.map((id, idx) => {
        const step = state.steps[id];
        const unlocked = isStepUnlocked(state, id);
        const isActive = active === id;
        const isApproved = step.status === 'approved';
        const clickable = isApproved;

        // Mobile: compact pill — glyph circle + step label, no "Step N" eyebrow, no connector.
        // sm+: full layout with eyebrow + connector between steps.
        const base =
          'flex shrink-0 items-center gap-2 rounded-md border px-2.5 py-2 transition-colors sm:flex-1 sm:gap-3 sm:px-4 sm:py-3';
        const tone = !unlocked
          ? 'border-rule bg-canvas-deep text-ink-faint'
          : isActive
            ? 'border-brand bg-paper text-ink shadow-sm'
            : isApproved
              ? 'border-success-200 bg-success-50 text-success-700'
              : 'border-rule-strong bg-paper text-ink-soft';
        const interactivity = clickable ? 'cursor-pointer hover:bg-success-50/60' : 'cursor-default';

        return (
          <li key={id} className="flex shrink-0 items-center gap-1.5 sm:flex-1 sm:gap-2">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && state.reopenStep(id as StepId)}
              className={`${base} ${tone} ${interactivity}`}
              aria-current={isActive ? 'step' : undefined}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-[11px] font-medium sm:h-7 sm:w-7 sm:text-xs">
                {statusGlyph(step.status) || idx + 1}
              </span>
              <span className="flex flex-col items-start leading-tight">
                <span className="hidden text-xs uppercase tracking-wide opacity-60 sm:block">
                  {t('stepper.step')} {idx + 1}
                </span>
                <span className="text-[13px] font-medium sm:text-sm">{t(`step.${id}`)}</span>
              </span>
            </button>
            {idx < STEP_ORDER.length - 1 && (
              <span className="hidden h-px w-4 bg-neutral-200 sm:block" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
