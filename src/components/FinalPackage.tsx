import { useState } from 'react';
import { useAppStore } from '../store';
import { downloadPackage } from '../services/exportService';
import { WaveformPlayer } from './WaveformPlayer';
import { DirectorsNotes } from './DirectorsNotes';
import { BackButton } from './BackButton';
import { ViewportFrame } from './ViewportFrame';
import { useT } from '../i18n/hooks';
import { resolveVoice } from '../data/voiceLibrary';
import {
  audioVariantsOf,
  copyVariantsOf,
  designVariantsOf,
  imageVariantsOf,
  scriptVariantsOf,
} from '../types';

function scrollToStepper() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function FinalPackage() {
  const state = useAppStore();
  const reopenStep = useAppStore((s) => s.reopenStep);
  const t = useT();
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadWarning, setDownloadWarning] = useState<string | null>(null);

  const copy = copyVariantsOf(state.steps.copy.variants)[state.steps.copy.selectedIndex ?? -1];
  const image = imageVariantsOf(state.steps.image.variants)[state.steps.image.selectedIndex ?? -1];
  const script = scriptVariantsOf(state.steps.script.variants)[state.steps.script.selectedIndex ?? -1];
  const audio = audioVariantsOf(state.steps.audio.variants)[state.steps.audio.selectedIndex ?? -1];
  const design = designVariantsOf(state.steps.design.variants)[state.steps.design.selectedIndex ?? -1];
  const voice = resolveVoice(state.steps.script.selectedVoiceId, state.steps.script.history);

  if (!copy || !image || !script || !audio || !voice) {
    return (
      <section className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <p className="font-medium">{t('final.incompleteTitle')}</p>
        <p className="mt-1">{t('final.incompleteBody')}</p>
      </section>
    );
  }

  async function handleDownload() {
    setDownloading(true);
    setDownloadError(null);
    setDownloadWarning(null);
    try {
      const result = await downloadPackage(state);
      if (result.imageWarning) {
        setDownloadWarning(result.imageWarning);
      }
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : String(err));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <article className="space-y-8">
      <div>
        <BackButton label={t('final.backToAudio')} onClick={() => reopenStep('audio')} />
      </div>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-success-700">{t('final.eyebrow')}</p>
          <h2 className="font-serif mt-2 text-4xl font-medium leading-tight tracking-tight text-ink">
            {t('final.heading')}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
            {t('final.body')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={scrollToStepper}
            className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            {t('final.editAny')}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:bg-ink-faint"
          >
            {downloading ? t('final.packaging') : t('final.download')}
          </button>
        </div>
      </header>

      {downloadError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-medium">{t('final.downloadFailed')}</p>
          <p className="mt-1">{downloadError}</p>
        </div>
      )}
      {downloadWarning && !downloadError && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {downloadWarning}
        </div>
      )}

      <section className="rounded-lg border border-neutral-200 bg-white p-6">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t('final.copy')}</h3>
        <dl className="mt-3 space-y-3 text-sm">
          <div className="grid grid-cols-[80px_1fr] items-baseline gap-3">
            <dt className="text-neutral-500">{t('final.headline')}</dt>
            <dd className="font-semibold text-neutral-900">{copy.headline}</dd>
          </div>
          <div className="grid grid-cols-[80px_1fr] items-baseline gap-3">
            <dt className="text-neutral-500">{t('final.caption')}</dt>
            <dd className="text-neutral-800">{copy.caption}</dd>
          </div>
          <div className="grid grid-cols-[80px_1fr] items-baseline gap-3">
            <dt className="text-neutral-500">{t('final.cta')}</dt>
            <dd>
              <span className="inline-flex rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-700">
                {copy.cta}
              </span>
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-6">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t('final.image')}</h3>
        <div className="mt-3 overflow-hidden rounded-md border border-neutral-200">
          <img
            src={image.imageUrl}
            alt={t('final.image')}
            className="w-full object-cover"
          />
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-6">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t('final.voiceover')}</h3>
        <div className="mt-3 grid gap-5 md:grid-cols-[1fr_260px]">
          <div className="space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500">{t('final.script')}</p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">
                {script.script}
              </p>
            </div>
            <div className="border-t border-neutral-100 pt-4">
              <WaveformPlayer audioUrl={audio.audioUrl} />
            </div>
          </div>
          <aside className="space-y-3 rounded-md border border-neutral-100 bg-neutral-50 p-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500">{t('final.voice')}</p>
              <p className="mt-1 text-base font-semibold tracking-tight text-neutral-900">
                {voice.displayName}
              </p>
              <p className="text-xs text-neutral-500">{voice.toneLabel}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500">{t('final.tone')}</p>
              <p className="mt-1 text-sm text-neutral-800">{script.toneDescription}</p>
            </div>
          </aside>
        </div>
      </section>

      {design && (
        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {t('final.design')}
          </h3>
          {design.rationale && (
            <p className="mt-2 text-sm text-neutral-700">{design.rationale}</p>
          )}
          <div className="mt-4">
            <ViewportFrame
              srcDoc={`<!doctype html><html><head><meta charset="utf-8" /><script src="https://cdn.tailwindcss.com"></script><script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script><script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script><script src="https://unpkg.com/@babel/standalone/babel.min.js"></script><style>html,body{margin:0;padding:0;background:#fff}</style></head><body><div id="root"></div><script type="text/babel" data-presets="react,typescript">try{${design.code}\nReactDOM.createRoot(document.getElementById('root')).render(React.createElement(${design.componentName || 'GeneratedComponent'}));}catch(e){document.body.innerHTML='<pre style="padding:16px;color:#991b1b">'+(e.message||e)+'</pre>'}</script></body></html>`}
              frameKey={design.id}
              defaultViewport="desktop"
              title="Landing page preview"
            />
          </div>
        </section>
      )}

      <section className="rounded-lg border border-neutral-200 bg-white p-6">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {t('final.directorsNotes')}
        </h3>
        <div className="mt-4">
          <DirectorsNotes />
        </div>
      </section>
    </article>
  );
}
