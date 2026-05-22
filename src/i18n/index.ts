export type Locale = 'en' | 'ja' | 'pt' | 'es' | 'fr' | 'de';

export const LOCALES: readonly Locale[] = ['en', 'ja', 'pt', 'es', 'fr', 'de'] as const;

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  ja: '日本語',
  pt: 'Português',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
};

export const LOCALE_SHORT_LABELS: Record<Locale, string> = {
  en: 'EN',
  ja: 'JA',
  pt: 'PT',
  es: 'ES',
  fr: 'FR',
  de: 'DE',
};

// Dictionary keys live in a single namespace. When a key is missing for the
// current locale we fall back to English — the build-time test below makes
// it hard to forget a key in either language.
type Dict = Record<string, string>;

const EN: Dict = {
  // App header
  'app.title': "Director's Cockpit",
  'app.version': 'v2',
  'app.newBrief': 'New brief',
  'app.settings': 'Settings',
  'app.language': 'Language',

  // Stepper
  'stepper.step': 'Step',
  'step.copy': 'Copy',
  'step.image': 'Image',
  'step.script': 'Script',
  'step.audio': 'Audio',
  'step.design': 'Design',

  // Onboarding
  'onboarding.eyebrow': 'Welcome',
  'onboarding.heading': 'A four-step ad workflow,\ndirected by you.',
  'onboarding.body':
    "This is a director's cockpit for marketing assets. You give a brief, then walk through copy, image, script, and audio — directing each step in plain English (or Japanese) instead of writing prompts. To run it you'll need four API keys, one for each generation service we orchestrate.",
  'onboarding.providers.openai': 'Copy generation and direction translation',
  'onboarding.providers.fal': 'Image generation (Flux Schnell)',
  'onboarding.providers.eleven': 'Voice synthesis',
  'onboarding.providers.anthropic':
    'Image critique and (optional) higher-quality copy via Claude Sonnet',
  'onboarding.keysNote':
    "Keys are stored in your browser session only — they're never sent to a server and they clear when you close this tab.",
  'onboarding.openSettings': 'Open Settings →',
  'onboarding.sampleBrief': 'Try the sample brief instead',

  // Brief form
  'brief.eyebrow': 'The brief',
  'brief.heading': 'Three lines, four assets.',
  'brief.intro':
    "The director's cockpit will walk you through copy, image, script, and audio — one at a time.",
  'brief.sample.title': 'First time? Try the sample brief.',
  'brief.sample.body':
    'Pre-cached run for {product}. The whole pipeline restores instantly — see the shape of the tool, then write your own.',
  'brief.sample.cta': 'Try sample brief & explore →',
  'brief.field.productName': 'Product name',
  'brief.field.targetAudience': 'Target audience',
  'brief.field.adAngle': 'Ad angle',
  'brief.placeholder.productName': 'e.g. Lumen Sleep Mist',
  'brief.placeholder.targetAudience': 'e.g. Burned-out parents, 30–45',
  'brief.placeholder.adAngle': 'e.g. Fall asleep in seven minutes flat',
  'brief.required': '{label} is required.',
  'brief.start': 'Start',

  // Settings drawer
  'settings.title': 'Settings',
  'settings.subtitle': "Keys are kept in this tab's sessionStorage only.",
  'settings.close': 'Close',
  'settings.clear': 'Clear',
  'settings.validating': 'Validating…',
  'settings.validate': 'Validate keys',
  'settings.placeholder': '{provider} API key',

  // Common step UI
  'common.pickThis': 'Pick this',
  'common.selected': 'Selected',
  'common.optionOf': 'Option {n} of {total}',
  'common.showMore': 'Show me 2 more',
  'common.generating': 'Generating…',
  'common.refining': 'Refining…',
  'common.refine': 'Refine',
  'common.refineDirection': 'Describe a direction. Fresh variants take its lead instead of editing the old ones.',
  'common.variantsSoFar': '{n} variant{s} so far',
  'common.directionHistory': 'Direction history ({n})',
  'common.history.initial': 'Initial generation',
  'common.history.more': 'Asked for more variants',
  'common.history.refined': 'Refined:',
  'common.history.cacheRestore': 'Restored from earlier session',
  'common.history.critiqueApplied': 'Applied critique:',
  'common.history.voicePick': 'Voice picked:',
  'common.history.initialRender': 'Initial render',
  'common.history.regenerated': 'Regenerated',
  'common.history.discarded': 'discarded ~{n}s read',
  'common.cacheRestore': 'Restored from your earlier choices · no regeneration',
  'common.openSettings': 'Open Settings',
  'common.tryAgain': 'Try again',
  'common.errorTitle': 'Something interrupted that step',
  'common.errorDetail': 'Show technical detail',
  'common.back': 'Back',

  // Copy step
  'copy.heading': 'Copy',
  'copy.subtitle': 'Pick a variant, ask for more, or describe how to refine.',
  'copy.keyMissingTitle': 'OpenAI key required',
  'copy.keyMissingBody': 'Add your key in Settings to generate copy variants.',
  'copy.anthropicHint':
    'Add an Anthropic key in Settings for higher-quality copy generation. The demo still works without it.',
  'copy.refinePlaceholder': 'e.g. more aggressive, less corporate',

  // Image step
  'image.heading': 'Image',
  'image.subtitle':
    "Pick an image, ask for more, refine in plain language, or get a director's critique.",
  'image.keysMissingTitle': 'Keys required',
  'image.keysMissingBody':
    'Image generation needs both an OpenAI key (prompt builder) and a fal.ai key (Flux Schnell). Add them in Settings.',
  'image.anthropicMissing': 'Anthropic key missing — critique disabled',
  'image.critique': 'Critique',
  'image.hideCritique': 'Hide critique',
  'image.showCritique': 'Show critique',
  'image.critiqueLabel': 'Creative-director critique',
  'image.critiqueHide': 'Hide',
  'image.critiqueFailed': 'Critique failed',
  'image.critiqueRetry': 'Retry',
  'image.applyCritique': 'Apply this critique',
  'image.critiqueDisabled': 'Add Anthropic key in Settings to enable critique.',
  'image.critiqueAppliedTo': 'Pipes the critique into the refine flow for variant',
  'image.refinePlaceholder': 'e.g. lighter background, the guy should smile more, more energy',
  'image.backToCopy': 'Back to copy',
  'image.copyMissingTitle': 'Approved copy missing.',
  'image.copyMissingBody':
    'The image step opened without a selected copy variant. Re-open step 1 and pick one.',

  // Script step
  'script.heading': 'Script',
  'script.subtitle':
    'Pick a script, ask for more, refine in plain language, then pick a voice tone.',
  'script.keyMissingTitle': 'OpenAI key required',
  'script.keyMissingBody': 'Add your key in Settings to generate scripts.',
  'script.refinePlaceholder': 'e.g. more urgent, calmer, punchier',
  'script.backToImage': 'Back to image',
  'script.backToPicker': 'Back to script picker',
  'script.pickedRest': 'Now pick a voice tone.',
  'script.pickedStrong': 'Script picked.',
  'script.voiceLocked': 'Voice locked:',
  'script.missingTitle': 'Upstream selection missing.',
  'script.missingBody':
    'The script step needs an approved copy variant AND an approved image. Reopen the earlier steps and pick one of each.',
  'script.duration': '~{n}s',

  // Audio step
  'audio.heading': 'Audio',
  'audio.subtitle':
    'One final render. Approve to assemble the package, or regenerate for a different take.',
  'audio.keyMissingTitle': 'ElevenLabs key required',
  'audio.keyMissingBody': 'Add your key in Settings to render the voiceover.',
  'audio.backToVoice': 'Back to voice picker',
  'audio.demoNotice': 'Demo audio shown · add ElevenLabs key for live generation.',
  'audio.regenerate': 'Regenerate',
  'audio.rendering': 'Rendering…',
  'audio.approve': 'Approve',
  'audio.voiceNotFoundTitle': "This voice isn't on your ElevenLabs account.",
  'audio.voiceNotFoundBody':
    "The voice you picked isn't in your ElevenLabs account. Go back to step 3 and pick one of your account voices instead.",
  'audio.voiceNotFoundCta': '← Pick a different voice',
  'audio.scriptLabel': 'Script',
  'audio.voiceLabel': 'Voice',
  'audio.toneLabel': 'Tone description',
  'audio.estimatedDuration': 'Estimated duration',
  'audio.historyTitle': 'Audio history ({n})',
  'audio.missingTitle': 'Upstream selection missing.',
  'audio.missingBody':
    'The audio step needs an approved script AND a picked voice. Reopen step 3 and complete both.',

  // Voice picker
  'voice.heading': 'Pick a voice',
  'voice.userAccountHint':
    "Pulled from your ElevenLabs account — these are the voices the final render can actually use.",
  'voice.sampleHint': 'Each sample reads:',
  'voice.count': '{n} voice{s}',
  'voice.fetchFailedTitle': "Couldn't load voices from your ElevenLabs account.",
  'voice.fetchFailedBody':
    "{detail} — using the demo's built-in voice library. If the final render fails with voice_not_found, add the chosen voice to your account at the ElevenLabs Voice Library.",
  'voice.libraryProbeFail':
    "Voice previews are loading. If they don't appear, refresh the page or open Settings to add your ElevenLabs key — the picker will then use your account's voices directly.",
  'voice.loading': 'Loading your ElevenLabs account voices…',
  'voice.previewError':
    "Preview couldn't load. You can still select this voice — the final render will use it.",
  'voice.select': 'Select this voice',
  'voice.play': 'Play {name}',
  'voice.pause': 'Pause {name}',

  // Design step
  'design.heading': 'Design',
  'design.subtitle':
    'Claude generates a one-page landing site that uses your approved copy and hero image. Preview, refine in plain language, or approve to add to the package.',
  'design.keyMissingTitle': 'Anthropic key required',
  'design.keyMissingBody':
    'Design generation runs on Claude. Add your Anthropic key in Settings to continue.',
  'design.backToAudio': 'Back to audio',
  'design.approve': 'Approve design',
  'design.showCode': 'Show code',
  'design.hideCode': 'Hide code',
  'design.refineHint':
    'Describe a direction. The next render starts fresh with that direction in mind.',
  'design.refinePlaceholder': 'e.g. editorial, more whitespace, darker palette',
  'design.rationale': 'Rationale',
  'design.missingTitle': 'Upstream selection missing.',
  'design.missingBody':
    'The design step needs an approved copy variant AND an approved image. Reopen the earlier steps and pick one of each.',

  // Viewport toggle
  'viewport.mobile': 'Mobile',
  'viewport.tablet': 'Tablet',
  'viewport.desktop': 'Desktop',

  // Final package
  'final.eyebrow': 'Approved',
  'final.heading': 'Final package',
  'final.body': 'All five assets locked. Download the bundle or backtrack to any step to revise.',
  'final.editAny': 'Edit any step',
  'final.download': 'Download package',
  'final.packaging': 'Packaging…',
  'final.downloadFailed': 'Download failed',
  'final.backToAudio': 'Back to audio',
  'final.incompleteTitle': 'Final package incomplete.',
  'final.incompleteBody':
    'One or more approved assets are missing. Re-approve the affected steps in the stepper.',
  'final.copy': 'Copy',
  'final.headline': 'Headline',
  'final.caption': 'Caption',
  'final.cta': 'CTA',
  'final.image': 'Image',
  'final.voiceover': 'Voiceover',
  'final.script': 'Script',
  'final.voice': 'Voice',
  'final.tone': 'Tone',
  'final.design': 'Landing page',
  'final.directorsNotes': "Director's notes",

  // Directors notes
  'notes.brief': 'Brief',
  'notes.product': 'Product',
  'notes.audience': 'Audience',
  'notes.angle': 'Angle',
  'notes.approvedVariant': 'Approved variant',
  'notes.refinements': 'Refinements',
  'notes.noRefinements': 'No refinements — picked the first read.',
  'notes.pushedFor': 'pushed for',
  'notes.critiquesApplied': 'Critiques applied',
  'notes.scriptVoice': 'Script + Voice',
  'notes.audioAttempt': 'Approved on attempt',
  'notes.afterRegen': '(after {n} regenerate{s})',

  // Errors (humanize codes)
  'err.openai/auth-failed':
    "Your OpenAI key isn't being accepted. Open Settings and paste it again — sometimes a stray space gets copied with it.",
  'err.openai/rate-limit': 'OpenAI is busy. Try again in a few seconds.',
  'err.openai/insufficient-quota':
    'Your OpenAI account is out of credits. Open platform.openai.com/account/billing and top up, or switch to a key on a funded account.',
  'err.openai/network': "Couldn't reach OpenAI. Check your internet and try again.",
  'err.openai/bad-response':
    'OpenAI returned an unexpected response. Try again — this usually clears on retry.',
  'err.openai/missing-key': 'Add your OpenAI key in Settings to continue.',
  'err.fal/auth-failed': "Your fal.ai key isn't being accepted. Open Settings and check it.",
  'err.fal/no-credits': 'Your fal.ai account is out of credits. Top up at fal.ai/dashboard and try again.',
  'err.fal/forbidden':
    "Your fal.ai key doesn't have access to Flux Schnell. Check the key's permissions in your fal.ai dashboard.",
  'err.fal/rate-limit': 'fal.ai is busy. Wait a moment and try again.',
  'err.fal/network': "Couldn't reach fal.ai. Check your internet and try again.",
  'err.fal/bad-response':
    'fal.ai returned an unexpected response. Try again — this usually clears on retry.',
  'err.fal/missing-key': 'Add your fal.ai key in Settings to generate images.',
  'err.eleven/auth-failed': "Your ElevenLabs key isn't being accepted. Open Settings and check it.",
  'err.eleven/voice-not-found':
    "This voice isn't available on your ElevenLabs account. Pick a different voice.",
  'err.eleven/rate-limit': 'ElevenLabs is busy. Wait a moment and try again.',
  'err.eleven/network': "Couldn't reach ElevenLabs. Check your internet and try again.",
  'err.eleven/bad-response':
    'ElevenLabs returned an unexpected response. Try again — this usually clears on retry.',
  'err.eleven/missing-key': 'Add your ElevenLabs key in Settings to render audio.',
  'err.anthropic/auth-failed':
    "Your Anthropic key isn't being accepted. Open Settings and check it.",
  'err.anthropic/rate-limit': 'Anthropic is busy. Wait a moment and try again.',
  'err.anthropic/insufficient-quota':
    'Your Anthropic account is out of credits. Open console.anthropic.com and top up, or switch to a key on a funded account.',
  'err.anthropic/network': "Couldn't reach Anthropic. Check your internet and try again.",
  'err.anthropic/bad-response':
    'Anthropic returned an unexpected response. Try again — this usually clears on retry.',
  'err.anthropic/missing-key': 'Add your Anthropic key in Settings to enable image critique.',
  'err.translator/wrong-shape': "Couldn't translate the direction. Try a slightly different phrasing.",
  'err.translator/empty-direction': 'Type a direction first, then click Refine.',
  'err.image/all-failed':
    'All image attempts failed. Try once more — fal.ai is sometimes flaky on bursts.',
  'err.unknown':
    'Something went wrong. Try again — and if it keeps happening, open Settings and re-check your keys.',
};

const JA: Dict = {
  // App header
  'app.title': 'ディレクターズ・コックピット',
  'app.version': 'v2',
  'app.newBrief': '新しいブリーフ',
  'app.settings': '設定',
  'app.language': '言語',

  // Stepper
  'stepper.step': 'ステップ',
  'step.copy': 'コピー',
  'step.image': '画像',
  'step.script': 'スクリプト',
  'step.audio': '音声',
  'step.design': 'デザイン',

  // Onboarding
  'onboarding.eyebrow': 'ようこそ',
  'onboarding.heading': '4ステップの広告制作を、\nあなたのディレクションで。',
  'onboarding.body':
    'マーケティング素材のためのディレクターズ・コックピットです。ブリーフを入力すれば、コピー・画像・スクリプト・音声を順に作成できます。プロンプトを書く代わりに、日本語(または英語)でディレクションするだけ。実行には4つのAPIキーが必要です。',
  'onboarding.providers.openai': 'コピー生成とディレクション翻訳',
  'onboarding.providers.fal': '画像生成 (Flux Schnell)',
  'onboarding.providers.eleven': '音声合成',
  'onboarding.providers.anthropic':
    '画像の批評と、(任意で) Claude Sonnetによる高品質コピー生成',
  'onboarding.keysNote':
    'キーはこのブラウザのセッション内のみに保存されます。サーバーには送信されず、タブを閉じると消去されます。',
  'onboarding.openSettings': '設定を開く →',
  'onboarding.sampleBrief': 'サンプルブリーフを試す',

  // Brief form
  'brief.eyebrow': 'ブリーフ',
  'brief.heading': '3行から、4つの素材へ。',
  'brief.intro':
    'ディレクターズ・コックピットがコピー・画像・スクリプト・音声を、一つずつ順番にご案内します。',
  'brief.sample.title': '初めての方はサンプルブリーフをお試しください。',
  'brief.sample.body':
    '{product} のサンプル実行が事前にキャッシュ済みです。すべての工程が即座に復元され、ツールの全体像を確認できます。',
  'brief.sample.cta': 'サンプルブリーフを試す →',
  'brief.field.productName': '製品名',
  'brief.field.targetAudience': 'ターゲット',
  'brief.field.adAngle': '広告の切り口',
  'brief.placeholder.productName': '例: Lumenスリープミスト',
  'brief.placeholder.targetAudience': '例: 30〜45歳の疲れた親世代',
  'brief.placeholder.adAngle': '例: たった7分で眠りに落ちる',
  'brief.required': '{label}は必須です。',
  'brief.start': '開始',

  // Settings drawer
  'settings.title': '設定',
  'settings.subtitle': 'キーはこのタブのsessionStorageにのみ保存されます。',
  'settings.close': '閉じる',
  'settings.clear': 'クリア',
  'settings.validating': '検証中…',
  'settings.validate': 'キーを検証',
  'settings.placeholder': '{provider} APIキー',

  // Common step UI
  'common.pickThis': 'これを選ぶ',
  'common.selected': '選択中',
  'common.optionOf': '案 {n} / {total}',
  'common.showMore': 'さらに2案表示',
  'common.generating': '生成中…',
  'common.refining': '調整中…',
  'common.refine': '調整',
  'common.refineDirection':
    '方向性を記述してください。古いものを編集するのではなく、その指示を反映した新しい案が生成されます。',
  'common.variantsSoFar': 'これまでに {n} 案',
  'common.directionHistory': 'ディレクション履歴 ({n})',
  'common.history.initial': '初回生成',
  'common.history.more': '追加案をリクエスト',
  'common.history.refined': '調整:',
  'common.history.cacheRestore': '以前のセッションから復元',
  'common.history.critiqueApplied': '批評を反映:',
  'common.history.voicePick': '選択した音声:',
  'common.history.initialRender': '初回レンダリング',
  'common.history.regenerated': '再生成',
  'common.history.discarded': '約{n}秒分を破棄',
  'common.cacheRestore': '以前の選択から復元しました · 再生成なし',
  'common.openSettings': '設定を開く',
  'common.tryAgain': 'もう一度試す',
  'common.errorTitle': 'このステップが中断されました',
  'common.errorDetail': '技術的な詳細を表示',
  'common.back': '戻る',

  // Copy step
  'copy.heading': 'コピー',
  'copy.subtitle': '案を選ぶか、追加で生成するか、調整の方向性を記述してください。',
  'copy.keyMissingTitle': 'OpenAIキーが必要です',
  'copy.keyMissingBody': '設定からキーを追加するとコピー案を生成できます。',
  'copy.anthropicHint':
    'Anthropicキーを設定に追加するとより高品質なコピーを生成できます。なくてもデモは動作します。',
  'copy.refinePlaceholder': '例: よりアグレッシブに、企業臭を抑える',

  // Image step
  'image.heading': '画像',
  'image.subtitle':
    '画像を選ぶ、追加で生成する、自然な言葉で調整する、またはディレクターの批評を取得できます。',
  'image.keysMissingTitle': 'キーが必要です',
  'image.keysMissingBody':
    '画像生成にはOpenAIキー(プロンプトビルダー)とfal.aiキー(Flux Schnell)の両方が必要です。設定から追加してください。',
  'image.anthropicMissing': 'Anthropicキー未設定 — 批評機能は無効です',
  'image.critique': '批評',
  'image.hideCritique': '批評を隠す',
  'image.showCritique': '批評を表示',
  'image.critiqueLabel': 'クリエイティブディレクターの批評',
  'image.critiqueHide': '隠す',
  'image.critiqueFailed': '批評の取得に失敗しました',
  'image.critiqueRetry': '再試行',
  'image.applyCritique': 'この批評を反映',
  'image.critiqueDisabled': '設定にAnthropicキーを追加すると批評を有効化できます。',
  'image.critiqueAppliedTo': '批評を以下の案の調整フローへ反映します:',
  'image.refinePlaceholder':
    '例: 背景をもっと明るく、人物に笑顔を、もっと躍動感を',
  'image.backToCopy': 'コピーへ戻る',
  'image.copyMissingTitle': '承認済みコピーがありません。',
  'image.copyMissingBody':
    'コピー案を選択せずに画像ステップが開かれました。ステップ1に戻って選択してください。',

  // Script step
  'script.heading': 'スクリプト',
  'script.subtitle':
    'スクリプトを選ぶ、追加で生成する、自然な言葉で調整する、それから音声トーンを選びます。',
  'script.keyMissingTitle': 'OpenAIキーが必要です',
  'script.keyMissingBody': '設定からキーを追加するとスクリプトを生成できます。',
  'script.refinePlaceholder': '例: より緊迫感を、もっと落ち着いて、もっと切れ味よく',
  'script.backToImage': '画像へ戻る',
  'script.backToPicker': 'スクリプト選択へ戻る',
  'script.pickedRest': '続けて音声トーンを選択してください。',
  'script.pickedStrong': 'スクリプトを選択しました。',
  'script.voiceLocked': '選択中の音声:',
  'script.missingTitle': '上流の選択が不足しています。',
  'script.missingBody':
    'スクリプトステップには、承認済みのコピー案と承認済みの画像の両方が必要です。前のステップに戻り、それぞれを選択してください。',
  'script.duration': '約{n}秒',

  // Audio step
  'audio.heading': '音声',
  'audio.subtitle':
    '最終レンダリングです。承認するとパッケージが組み立てられます。別のテイクが必要なら再生成できます。',
  'audio.keyMissingTitle': 'ElevenLabsキーが必要です',
  'audio.keyMissingBody': '設定からキーを追加するとボイスオーバーをレンダリングできます。',
  'audio.backToVoice': '音声選択へ戻る',
  'audio.demoNotice': 'デモ音声を表示中 · 本番生成にはElevenLabsキーを追加してください。',
  'audio.regenerate': '再生成',
  'audio.rendering': 'レンダリング中…',
  'audio.approve': '承認',
  'audio.voiceNotFoundTitle': 'この音声はElevenLabsアカウントにありません。',
  'audio.voiceNotFoundBody':
    '選択された音声がElevenLabsアカウントに存在しません。ステップ3に戻ってアカウント内の音声を選んでください。',
  'audio.voiceNotFoundCta': '← 別の音声を選ぶ',
  'audio.scriptLabel': 'スクリプト',
  'audio.voiceLabel': '音声',
  'audio.toneLabel': 'トーンの説明',
  'audio.estimatedDuration': '推定の長さ',
  'audio.historyTitle': '音声履歴 ({n})',
  'audio.missingTitle': '上流の選択が不足しています。',
  'audio.missingBody':
    '音声ステップには承認済みのスクリプトと選択済みの音声の両方が必要です。ステップ3に戻ってください。',

  // Voice picker
  'voice.heading': '音声を選ぶ',
  'voice.userAccountHint':
    'お使いのElevenLabsアカウントから取得しました。最終レンダリングで実際に使用できる音声です。',
  'voice.sampleHint': '各サンプルの内容:',
  'voice.count': '{n} 件の音声',
  'voice.fetchFailedTitle': 'ElevenLabsアカウントから音声を取得できませんでした。',
  'voice.fetchFailedBody':
    '{detail} — デモ内蔵の音声ライブラリを使用します。最終レンダリングがvoice_not_foundで失敗した場合は、ElevenLabsのVoice Libraryで該当の音声をアカウントに追加してください。',
  'voice.libraryProbeFail':
    '音声プレビューを読み込み中です。表示されない場合はページを再読み込みするか、設定からElevenLabsキーを追加してください。アカウント内の音声を直接使用できます。',
  'voice.loading': 'ElevenLabsアカウントの音声を読み込み中…',
  'voice.previewError':
    'プレビューを読み込めませんでした。この音声を選択しても、最終レンダリングでは利用されます。',
  'voice.select': 'この音声を選ぶ',
  'voice.play': '{name}を再生',
  'voice.pause': '{name}を一時停止',

  // Design step
  'design.heading': 'デザイン',
  'design.subtitle':
    '承認済みのコピーとヒーロー画像を使って、Claudeがランディングページを生成します。プレビューを確認し、自然な言葉で調整するか、承認してパッケージに追加してください。',
  'design.keyMissingTitle': 'Anthropicキーが必要です',
  'design.keyMissingBody':
    'デザイン生成はClaudeで動作します。設定からAnthropicキーを追加してください。',
  'design.backToAudio': '音声へ戻る',
  'design.approve': 'デザインを承認',
  'design.showCode': 'コードを表示',
  'design.hideCode': 'コードを隠す',
  'design.refineHint':
    '方向性を記述してください。次のレンダリングはその指示を反映してゼロから生成されます。',
  'design.refinePlaceholder': '例: エディトリアル風に、余白を増やす、より落ち着いた配色に',
  'design.rationale': 'デザイン意図',
  'design.missingTitle': '上流の選択が不足しています。',
  'design.missingBody':
    'デザインステップには承認済みのコピー案と承認済みの画像の両方が必要です。前のステップに戻り、それぞれを選択してください。',

  // Viewport toggle
  'viewport.mobile': 'モバイル',
  'viewport.tablet': 'タブレット',
  'viewport.desktop': 'デスクトップ',

  // Final package
  'final.eyebrow': '承認済み',
  'final.heading': '最終パッケージ',
  'final.body':
    '5つの素材すべてが確定しました。バンドルをダウンロードするか、任意のステップに戻って修正できます。',
  'final.editAny': '任意のステップを編集',
  'final.download': 'パッケージをダウンロード',
  'final.packaging': 'パッケージ作成中…',
  'final.downloadFailed': 'ダウンロードに失敗しました',
  'final.backToAudio': '音声へ戻る',
  'final.incompleteTitle': '最終パッケージが未完成です。',
  'final.incompleteBody':
    '承認済みの素材が一つ以上欠けています。ステッパーから該当ステップを再承認してください。',
  'final.copy': 'コピー',
  'final.headline': '見出し',
  'final.caption': 'キャプション',
  'final.cta': 'CTA',
  'final.image': '画像',
  'final.voiceover': 'ボイスオーバー',
  'final.script': 'スクリプト',
  'final.voice': '音声',
  'final.tone': 'トーン',
  'final.design': 'ランディングページ',
  'final.directorsNotes': 'ディレクターズノート',

  // Directors notes
  'notes.brief': 'ブリーフ',
  'notes.product': '製品',
  'notes.audience': 'ターゲット',
  'notes.angle': '切り口',
  'notes.approvedVariant': '承認済み案',
  'notes.refinements': '調整履歴',
  'notes.noRefinements': '調整なし — 最初の案を採用しました。',
  'notes.pushedFor': '方向性:',
  'notes.critiquesApplied': '反映された批評',
  'notes.scriptVoice': 'スクリプト + 音声',
  'notes.audioAttempt': '承認時の試行回数',
  'notes.afterRegen': '({n}回の再生成の後)',

  // Errors
  'err.openai/auth-failed':
    'OpenAIキーが受け付けられませんでした。設定を開いて再度貼り付けてください — 余計な空白が混ざっていることがあります。',
  'err.openai/rate-limit': 'OpenAIが混雑しています。数秒後にもう一度試してください。',
  'err.openai/insufficient-quota':
    'OpenAIアカウントのクレジットが不足しています。platform.openai.com/account/billing でチャージするか、別のキーをご利用ください。',
  'err.openai/network': 'OpenAIに接続できませんでした。ネットワークを確認してください。',
  'err.openai/bad-response':
    'OpenAIから予期しない応答がありました。通常は再試行で解消します。',
  'err.openai/missing-key': '設定からOpenAIキーを追加してください。',
  'err.fal/auth-failed': 'fal.aiキーが受け付けられませんでした。設定を確認してください。',
  'err.fal/no-credits':
    'fal.aiのクレジットが不足しています。fal.ai/dashboard でチャージしてからもう一度試してください。',
  'err.fal/forbidden':
    'fal.aiキーにFlux Schnellへのアクセス権がありません。fal.aiダッシュボードでキーの権限を確認してください。',
  'err.fal/rate-limit': 'fal.aiが混雑しています。少し待ってから再試行してください。',
  'err.fal/network': 'fal.aiに接続できませんでした。ネットワークを確認してください。',
  'err.fal/bad-response':
    'fal.aiから予期しない応答がありました。通常は再試行で解消します。',
  'err.fal/missing-key': '設定からfal.aiキーを追加してください。',
  'err.eleven/auth-failed':
    'ElevenLabsキーが受け付けられませんでした。設定を確認してください。',
  'err.eleven/voice-not-found':
    'この音声はElevenLabsアカウントで利用できません。別の音声を選んでください。',
  'err.eleven/rate-limit': 'ElevenLabsが混雑しています。少し待ってから再試行してください。',
  'err.eleven/network': 'ElevenLabsに接続できませんでした。ネットワークを確認してください。',
  'err.eleven/bad-response':
    'ElevenLabsから予期しない応答がありました。通常は再試行で解消します。',
  'err.eleven/missing-key': '設定からElevenLabsキーを追加してください。',
  'err.anthropic/auth-failed':
    'Anthropicキーが受け付けられませんでした。設定を確認してください。',
  'err.anthropic/rate-limit': 'Anthropicが混雑しています。少し待ってから再試行してください。',
  'err.anthropic/insufficient-quota':
    'Anthropicアカウントのクレジットが不足しています。console.anthropic.com でチャージするか、別のキーをご利用ください。',
  'err.anthropic/network': 'Anthropicに接続できませんでした。ネットワークを確認してください。',
  'err.anthropic/bad-response':
    'Anthropicから予期しない応答がありました。通常は再試行で解消します。',
  'err.anthropic/missing-key': '画像の批評を有効化するには設定からAnthropicキーを追加してください。',
  'err.translator/wrong-shape':
    'ディレクションを翻訳できませんでした。少し違う言い方でお試しください。',
  'err.translator/empty-direction':
    '先にディレクションを入力してから「調整」を押してください。',
  'err.image/all-failed':
    'すべての画像生成が失敗しました。もう一度お試しください — fal.aiは連続リクエストで不安定になることがあります。',
  'err.unknown':
    'エラーが発生しました。再度お試しください。問題が続く場合は設定からキーを再確認してください。',
};

const PT: Dict = {
  // App header
  'app.title': 'Cabine do Diretor',
  'app.version': 'v2',
  'app.newBrief': 'Novo briefing',
  'app.settings': 'Configurações',
  'app.language': 'Idioma',

  // Stepper
  'stepper.step': 'Etapa',
  'step.copy': 'Texto',
  'step.image': 'Imagem',
  'step.script': 'Roteiro',
  'step.audio': 'Áudio',
  'step.design': 'Design',

  // Onboarding
  'onboarding.eyebrow': 'Bem-vindo',
  'onboarding.heading': 'Um fluxo de quatro etapas\npara anúncios, dirigido por você.',
  'onboarding.body':
    'Esta é a cabine do diretor para peças de marketing. Você fornece o briefing e percorre texto, imagem, roteiro e áudio — dirigindo cada etapa em português comum em vez de escrever prompts. Para rodar, você precisa de quatro chaves de API, uma para cada serviço de geração que orquestramos.',
  'onboarding.providers.openai': 'Geração de texto e tradução de direções',
  'onboarding.providers.fal': 'Geração de imagens (Flux Schnell)',
  'onboarding.providers.eleven': 'Síntese de voz',
  'onboarding.providers.anthropic':
    'Crítica de imagem e (opcional) texto de maior qualidade via Claude Sonnet',
  'onboarding.keysNote':
    'As chaves ficam apenas na sessão deste navegador — nunca são enviadas a um servidor e são apagadas quando você fecha a aba.',
  'onboarding.openSettings': 'Abrir configurações →',
  'onboarding.sampleBrief': 'Experimentar com o briefing de exemplo',

  // Brief form
  'brief.eyebrow': 'O briefing',
  'brief.heading': 'Três linhas, quatro entregas.',
  'brief.intro':
    'A cabine do diretor vai conduzir você por texto, imagem, roteiro e áudio — uma etapa por vez.',
  'brief.sample.title': 'Primeira vez? Experimente o briefing de exemplo.',
  'brief.sample.body':
    'Execução pré-cacheada para {product}. Toda a pipeline é restaurada instantaneamente — veja a forma da ferramenta e depois escreva o seu.',
  'brief.sample.cta': 'Experimentar briefing de exemplo →',
  'brief.field.productName': 'Nome do produto',
  'brief.field.targetAudience': 'Público-alvo',
  'brief.field.adAngle': 'Ângulo do anúncio',
  'brief.placeholder.productName': 'ex.: Lumen Sleep Mist',
  'brief.placeholder.targetAudience': 'ex.: Pais esgotados, 30–45',
  'brief.placeholder.adAngle': 'ex.: Adormeça em sete minutos',
  'brief.required': '{label} é obrigatório.',
  'brief.start': 'Começar',

  // Settings drawer
  'settings.title': 'Configurações',
  'settings.subtitle': 'As chaves ficam apenas no sessionStorage desta aba.',
  'settings.close': 'Fechar',
  'settings.clear': 'Limpar',
  'settings.validating': 'Validando…',
  'settings.validate': 'Validar chaves',
  'settings.placeholder': 'Chave de API {provider}',

  // Common step UI
  'common.pickThis': 'Escolher esta',
  'common.selected': 'Selecionada',
  'common.optionOf': 'Opção {n} de {total}',
  'common.showMore': 'Mostrar mais 2',
  'common.generating': 'Gerando…',
  'common.refining': 'Refinando…',
  'common.refine': 'Refinar',
  'common.refineDirection':
    'Descreva uma direção. As novas variantes seguem essa orientação em vez de editar as anteriores.',
  'common.variantsSoFar': '{n} variante{s} até agora',
  'common.directionHistory': 'Histórico de direções ({n})',
  'common.history.initial': 'Geração inicial',
  'common.history.more': 'Pediu mais variantes',
  'common.history.refined': 'Refinado:',
  'common.history.cacheRestore': 'Restaurado de uma sessão anterior',
  'common.history.critiqueApplied': 'Crítica aplicada:',
  'common.history.voicePick': 'Voz escolhida:',
  'common.history.initialRender': 'Renderização inicial',
  'common.history.regenerated': 'Regerado',
  'common.history.discarded': 'descartado ~{n}s de leitura',
  'common.cacheRestore': 'Restaurado das suas escolhas anteriores · sem nova geração',
  'common.openSettings': 'Abrir configurações',
  'common.tryAgain': 'Tentar de novo',
  'common.errorTitle': 'Algo interrompeu essa etapa',
  'common.errorDetail': 'Mostrar detalhe técnico',
  'common.back': 'Voltar',

  // Copy step
  'copy.heading': 'Texto',
  'copy.subtitle': 'Escolha uma variante, peça mais, ou descreva como refinar.',
  'copy.keyMissingTitle': 'Chave da OpenAI necessária',
  'copy.keyMissingBody': 'Adicione sua chave em Configurações para gerar variantes de texto.',
  'copy.anthropicHint':
    'Adicione uma chave da Anthropic em Configurações para geração de texto de maior qualidade. A demo funciona sem ela.',
  'copy.refinePlaceholder': 'ex.: mais agressivo, menos corporativo',

  // Image step
  'image.heading': 'Imagem',
  'image.subtitle':
    'Escolha uma imagem, peça mais, refine em linguagem natural, ou obtenha a crítica do diretor.',
  'image.keysMissingTitle': 'Chaves necessárias',
  'image.keysMissingBody':
    'A geração de imagem precisa de uma chave OpenAI (construtor de prompt) e uma chave fal.ai (Flux Schnell). Adicione-as em Configurações.',
  'image.anthropicMissing': 'Chave Anthropic ausente — crítica desativada',
  'image.critique': 'Crítica',
  'image.hideCritique': 'Ocultar crítica',
  'image.showCritique': 'Mostrar crítica',
  'image.critiqueLabel': 'Crítica do diretor criativo',
  'image.critiqueHide': 'Ocultar',
  'image.critiqueFailed': 'Falha na crítica',
  'image.critiqueRetry': 'Tentar novamente',
  'image.applyCritique': 'Aplicar esta crítica',
  'image.critiqueDisabled': 'Adicione a chave Anthropic em Configurações para ativar a crítica.',
  'image.critiqueAppliedTo': 'Encaminha a crítica para o fluxo de refino da variante',
  'image.refinePlaceholder':
    'ex.: fundo mais claro, o cara deveria sorrir mais, mais energia',
  'image.backToCopy': 'Voltar para texto',
  'image.copyMissingTitle': 'Texto aprovado ausente.',
  'image.copyMissingBody':
    'A etapa de imagem foi aberta sem uma variante de texto selecionada. Reabra a etapa 1 e escolha uma.',

  // Script step
  'script.heading': 'Roteiro',
  'script.subtitle':
    'Escolha um roteiro, peça mais, refine em linguagem natural e depois escolha o tom da voz.',
  'script.keyMissingTitle': 'Chave da OpenAI necessária',
  'script.keyMissingBody': 'Adicione sua chave em Configurações para gerar roteiros.',
  'script.refinePlaceholder': 'ex.: mais urgente, mais calmo, mais incisivo',
  'script.backToImage': 'Voltar para imagem',
  'script.backToPicker': 'Voltar para seleção de roteiro',
  'script.pickedRest': 'Agora escolha um tom de voz.',
  'script.pickedStrong': 'Roteiro escolhido.',
  'script.voiceLocked': 'Voz selecionada:',
  'script.missingTitle': 'Seleção a montante ausente.',
  'script.missingBody':
    'A etapa de roteiro precisa de uma variante de texto aprovada E de uma imagem aprovada. Reabra as etapas anteriores e escolha uma de cada.',
  'script.duration': '~{n}s',

  // Audio step
  'audio.heading': 'Áudio',
  'audio.subtitle':
    'Uma renderização final. Aprove para montar o pacote, ou regenere para uma tomada diferente.',
  'audio.keyMissingTitle': 'Chave ElevenLabs necessária',
  'audio.keyMissingBody': 'Adicione sua chave em Configurações para renderizar a locução.',
  'audio.backToVoice': 'Voltar para seleção de voz',
  'audio.demoNotice': 'Áudio de demonstração · adicione a chave ElevenLabs para geração ao vivo.',
  'audio.regenerate': 'Regenerar',
  'audio.rendering': 'Renderizando…',
  'audio.approve': 'Aprovar',
  'audio.voiceNotFoundTitle': 'Essa voz não está na sua conta ElevenLabs.',
  'audio.voiceNotFoundBody':
    'A voz que você escolheu não está na sua conta ElevenLabs. Volte à etapa 3 e escolha uma das vozes da sua conta.',
  'audio.voiceNotFoundCta': '← Escolher outra voz',
  'audio.scriptLabel': 'Roteiro',
  'audio.voiceLabel': 'Voz',
  'audio.toneLabel': 'Descrição do tom',
  'audio.estimatedDuration': 'Duração estimada',
  'audio.historyTitle': 'Histórico de áudio ({n})',
  'audio.missingTitle': 'Seleção a montante ausente.',
  'audio.missingBody':
    'A etapa de áudio precisa de um roteiro aprovado E de uma voz selecionada. Reabra a etapa 3 e complete ambas.',

  // Voice picker
  'voice.heading': 'Escolha uma voz',
  'voice.userAccountHint':
    'Carregado da sua conta ElevenLabs — estas são as vozes que a renderização final pode usar.',
  'voice.sampleHint': 'Cada amostra diz:',
  'voice.count': '{n} voz{s}',
  'voice.fetchFailedTitle': 'Não foi possível carregar as vozes da sua conta ElevenLabs.',
  'voice.fetchFailedBody':
    '{detail} — usando a biblioteca de vozes embutida na demo. Se a renderização final falhar com voice_not_found, adicione a voz escolhida à sua conta na ElevenLabs Voice Library.',
  'voice.libraryProbeFail':
    'As prévias de voz estão carregando. Se não aparecerem, recarregue a página ou abra Configurações para adicionar sua chave ElevenLabs — o seletor passará a usar as vozes da sua conta diretamente.',
  'voice.loading': 'Carregando vozes da conta ElevenLabs…',
  'voice.previewError':
    'A prévia não carregou. Você ainda pode selecionar esta voz — a renderização final vai usá-la.',
  'voice.select': 'Selecionar esta voz',
  'voice.play': 'Reproduzir {name}',
  'voice.pause': 'Pausar {name}',

  // Design step
  'design.heading': 'Design',
  'design.subtitle':
    'Claude gera uma landing page de uma só página usando seu texto e imagem aprovados. Visualize, refine em linguagem natural ou aprove para incluir no pacote.',
  'design.keyMissingTitle': 'Chave Anthropic necessária',
  'design.keyMissingBody':
    'A geração de design roda no Claude. Adicione sua chave Anthropic em Configurações para continuar.',
  'design.backToAudio': 'Voltar para áudio',
  'design.approve': 'Aprovar design',
  'design.showCode': 'Mostrar código',
  'design.hideCode': 'Ocultar código',
  'design.refineHint':
    'Descreva uma direção. O próximo render começa do zero com essa direção em mente.',
  'design.refinePlaceholder': 'ex.: editorial, mais espaço em branco, paleta mais escura',
  'design.rationale': 'Justificativa',
  'design.missingTitle': 'Seleção a montante ausente.',
  'design.missingBody':
    'A etapa de design precisa de uma variante de texto aprovada E de uma imagem aprovada. Reabra as etapas anteriores e escolha uma de cada.',

  // Viewport toggle
  'viewport.mobile': 'Mobile',
  'viewport.tablet': 'Tablet',
  'viewport.desktop': 'Desktop',

  // Final package
  'final.eyebrow': 'Aprovado',
  'final.heading': 'Pacote final',
  'final.body':
    'Todas as cinco entregas confirmadas. Baixe o pacote ou volte a qualquer etapa para revisar.',
  'final.editAny': 'Editar qualquer etapa',
  'final.download': 'Baixar pacote',
  'final.packaging': 'Empacotando…',
  'final.downloadFailed': 'Falha no download',
  'final.backToAudio': 'Voltar para áudio',
  'final.incompleteTitle': 'Pacote final incompleto.',
  'final.incompleteBody':
    'Uma ou mais entregas aprovadas estão ausentes. Reaprove as etapas afetadas no stepper.',
  'final.copy': 'Texto',
  'final.headline': 'Título',
  'final.caption': 'Legenda',
  'final.cta': 'CTA',
  'final.image': 'Imagem',
  'final.voiceover': 'Locução',
  'final.script': 'Roteiro',
  'final.voice': 'Voz',
  'final.tone': 'Tom',
  'final.design': 'Landing page',
  'final.directorsNotes': 'Notas do diretor',

  // Directors notes
  'notes.brief': 'Briefing',
  'notes.product': 'Produto',
  'notes.audience': 'Público',
  'notes.angle': 'Ângulo',
  'notes.approvedVariant': 'Variante aprovada',
  'notes.refinements': 'Refinamentos',
  'notes.noRefinements': 'Sem refinamentos — escolheu a primeira leitura.',
  'notes.pushedFor': 'direcionou para',
  'notes.critiquesApplied': 'Críticas aplicadas',
  'notes.scriptVoice': 'Roteiro + Voz',
  'notes.audioAttempt': 'Aprovado na tentativa',
  'notes.afterRegen': '(após {n} regeneração{s})',

  // Errors
  'err.openai/auth-failed':
    'Sua chave da OpenAI não está sendo aceita. Abra Configurações e cole de novo — às vezes um espaço extra entra junto.',
  'err.openai/rate-limit': 'A OpenAI está ocupada. Tente novamente em alguns segundos.',
  'err.openai/insufficient-quota':
    'Sua conta OpenAI está sem créditos. Abra platform.openai.com/account/billing e recarregue, ou use uma chave de outra conta com saldo.',
  'err.openai/network': 'Não foi possível alcançar a OpenAI. Verifique sua conexão e tente de novo.',
  'err.openai/bad-response':
    'A OpenAI retornou uma resposta inesperada. Tente de novo — geralmente se resolve no retry.',
  'err.openai/missing-key': 'Adicione sua chave OpenAI em Configurações para continuar.',
  'err.fal/auth-failed':
    'Sua chave fal.ai não está sendo aceita. Abra Configurações e verifique.',
  'err.fal/no-credits':
    'Sua conta fal.ai está sem créditos. Recarregue em fal.ai/dashboard e tente de novo.',
  'err.fal/forbidden':
    'Sua chave fal.ai não tem acesso ao Flux Schnell. Verifique as permissões da chave no painel da fal.ai.',
  'err.fal/rate-limit': 'A fal.ai está ocupada. Espere um momento e tente de novo.',
  'err.fal/network': 'Não foi possível alcançar a fal.ai. Verifique sua conexão.',
  'err.fal/bad-response':
    'A fal.ai retornou uma resposta inesperada. Tente de novo — geralmente se resolve no retry.',
  'err.fal/missing-key': 'Adicione sua chave fal.ai em Configurações para gerar imagens.',
  'err.eleven/auth-failed':
    'Sua chave ElevenLabs não está sendo aceita. Abra Configurações e verifique.',
  'err.eleven/voice-not-found':
    'Essa voz não está disponível na sua conta ElevenLabs. Escolha uma voz diferente.',
  'err.eleven/rate-limit': 'A ElevenLabs está ocupada. Espere um momento e tente de novo.',
  'err.eleven/network': 'Não foi possível alcançar a ElevenLabs. Verifique sua conexão.',
  'err.eleven/bad-response':
    'A ElevenLabs retornou uma resposta inesperada. Tente de novo — geralmente se resolve no retry.',
  'err.eleven/missing-key': 'Adicione sua chave ElevenLabs em Configurações para renderizar áudio.',
  'err.anthropic/auth-failed':
    'Sua chave Anthropic não está sendo aceita. Abra Configurações e verifique.',
  'err.anthropic/rate-limit': 'A Anthropic está ocupada. Espere um momento e tente de novo.',
  'err.anthropic/insufficient-quota':
    'Sua conta Anthropic está sem créditos. Abra console.anthropic.com e recarregue, ou use uma chave de outra conta com saldo.',
  'err.anthropic/network': 'Não foi possível alcançar a Anthropic. Verifique sua conexão.',
  'err.anthropic/bad-response':
    'A Anthropic retornou uma resposta inesperada. Tente de novo — geralmente se resolve no retry.',
  'err.anthropic/missing-key':
    'Adicione sua chave Anthropic em Configurações para habilitar a crítica de imagem.',
  'err.translator/wrong-shape':
    'Não foi possível traduzir a direção. Tente uma formulação ligeiramente diferente.',
  'err.translator/empty-direction':
    'Digite uma direção primeiro, depois clique em Refinar.',
  'err.image/all-failed':
    'Todas as tentativas de imagem falharam. Tente mais uma vez — a fal.ai às vezes falha em rajadas.',
  'err.unknown':
    'Algo deu errado. Tente de novo — se persistir, abra Configurações e reveja suas chaves.',
};

const ES: Dict = {
  // App header
  'app.title': 'Cabina del Director',
  'app.version': 'v2',
  'app.newBrief': 'Nuevo brief',
  'app.settings': 'Ajustes',
  'app.language': 'Idioma',

  // Stepper
  'stepper.step': 'Paso',
  'step.copy': 'Texto',
  'step.image': 'Imagen',
  'step.script': 'Guion',
  'step.audio': 'Audio',
  'step.design': 'Diseño',

  // Onboarding
  'onboarding.eyebrow': 'Bienvenida',
  'onboarding.heading': 'Un flujo publicitario de cuatro pasos,\ndirigido por ti.',
  'onboarding.body':
    'Esta es la cabina del director para activos de marketing. Tú das el brief y recorres texto, imagen, guion y audio — dirigiendo cada paso en español llano en lugar de escribir prompts. Para ejecutarlo necesitas cuatro claves de API, una por cada servicio de generación que orquestamos.',
  'onboarding.providers.openai': 'Generación de texto y traducción de direcciones',
  'onboarding.providers.fal': 'Generación de imágenes (Flux Schnell)',
  'onboarding.providers.eleven': 'Síntesis de voz',
  'onboarding.providers.anthropic':
    'Crítica de imagen y (opcional) texto de mayor calidad vía Claude Sonnet',
  'onboarding.keysNote':
    'Las claves se almacenan solo en la sesión de este navegador — no se envían a ningún servidor y se borran al cerrar la pestaña.',
  'onboarding.openSettings': 'Abrir ajustes →',
  'onboarding.sampleBrief': 'Probar el brief de ejemplo',

  // Brief form
  'brief.eyebrow': 'El brief',
  'brief.heading': 'Tres líneas, cuatro activos.',
  'brief.intro':
    'La cabina del director te guiará por texto, imagen, guion y audio — un paso a la vez.',
  'brief.sample.title': '¿Primera vez? Prueba el brief de ejemplo.',
  'brief.sample.body':
    'Ejecución pre-cacheada para {product}. Toda la pipeline se restaura al instante — observa la forma de la herramienta y después escribe el tuyo.',
  'brief.sample.cta': 'Probar brief de ejemplo →',
  'brief.field.productName': 'Nombre del producto',
  'brief.field.targetAudience': 'Público objetivo',
  'brief.field.adAngle': 'Ángulo del anuncio',
  'brief.placeholder.productName': 'p. ej. Lumen Sleep Mist',
  'brief.placeholder.targetAudience': 'p. ej. Padres agotados, 30–45',
  'brief.placeholder.adAngle': 'p. ej. Dormir en siete minutos',
  'brief.required': '{label} es obligatorio.',
  'brief.start': 'Empezar',

  // Settings drawer
  'settings.title': 'Ajustes',
  'settings.subtitle': 'Las claves se guardan solo en el sessionStorage de esta pestaña.',
  'settings.close': 'Cerrar',
  'settings.clear': 'Limpiar',
  'settings.validating': 'Validando…',
  'settings.validate': 'Validar claves',
  'settings.placeholder': 'Clave de API {provider}',

  // Common step UI
  'common.pickThis': 'Elegir esta',
  'common.selected': 'Seleccionada',
  'common.optionOf': 'Opción {n} de {total}',
  'common.showMore': 'Mostrar 2 más',
  'common.generating': 'Generando…',
  'common.refining': 'Refinando…',
  'common.refine': 'Refinar',
  'common.refineDirection':
    'Describe una dirección. Las nuevas variantes la seguirán en lugar de editar las anteriores.',
  'common.variantsSoFar': '{n} variante{s} hasta ahora',
  'common.directionHistory': 'Historial de direcciones ({n})',
  'common.history.initial': 'Generación inicial',
  'common.history.more': 'Pidió más variantes',
  'common.history.refined': 'Refinado:',
  'common.history.cacheRestore': 'Restaurado de una sesión anterior',
  'common.history.critiqueApplied': 'Crítica aplicada:',
  'common.history.voicePick': 'Voz elegida:',
  'common.history.initialRender': 'Renderizado inicial',
  'common.history.regenerated': 'Regenerado',
  'common.history.discarded': 'descartado ~{n}s de lectura',
  'common.cacheRestore': 'Restaurado de tus elecciones anteriores · sin nueva generación',
  'common.openSettings': 'Abrir ajustes',
  'common.tryAgain': 'Reintentar',
  'common.errorTitle': 'Algo interrumpió este paso',
  'common.errorDetail': 'Mostrar detalle técnico',
  'common.back': 'Atrás',

  // Copy step
  'copy.heading': 'Texto',
  'copy.subtitle': 'Elige una variante, pide más, o describe cómo refinar.',
  'copy.keyMissingTitle': 'Se requiere clave de OpenAI',
  'copy.keyMissingBody': 'Añade tu clave en Ajustes para generar variantes de texto.',
  'copy.anthropicHint':
    'Añade una clave Anthropic en Ajustes para una generación de texto de mayor calidad. La demo funciona sin ella.',
  'copy.refinePlaceholder': 'p. ej. más agresivo, menos corporativo',

  // Image step
  'image.heading': 'Imagen',
  'image.subtitle':
    'Elige una imagen, pide más, refina en lenguaje natural, o solicita la crítica del director.',
  'image.keysMissingTitle': 'Claves requeridas',
  'image.keysMissingBody':
    'La generación de imagen necesita una clave OpenAI (constructor de prompt) y una clave fal.ai (Flux Schnell). Añádelas en Ajustes.',
  'image.anthropicMissing': 'Clave Anthropic ausente — crítica deshabilitada',
  'image.critique': 'Crítica',
  'image.hideCritique': 'Ocultar crítica',
  'image.showCritique': 'Mostrar crítica',
  'image.critiqueLabel': 'Crítica del director creativo',
  'image.critiqueHide': 'Ocultar',
  'image.critiqueFailed': 'Falló la crítica',
  'image.critiqueRetry': 'Reintentar',
  'image.applyCritique': 'Aplicar esta crítica',
  'image.critiqueDisabled': 'Añade la clave Anthropic en Ajustes para habilitar la crítica.',
  'image.critiqueAppliedTo': 'Envía la crítica al flujo de refino para la variante',
  'image.refinePlaceholder':
    'p. ej. fondo más claro, el chico debería sonreír más, más energía',
  'image.backToCopy': 'Volver al texto',
  'image.copyMissingTitle': 'Falta el texto aprobado.',
  'image.copyMissingBody':
    'El paso de imagen se abrió sin una variante de texto seleccionada. Reabre el paso 1 y elige una.',

  // Script step
  'script.heading': 'Guion',
  'script.subtitle':
    'Elige un guion, pide más, refina en lenguaje natural y luego elige un tono de voz.',
  'script.keyMissingTitle': 'Se requiere clave de OpenAI',
  'script.keyMissingBody': 'Añade tu clave en Ajustes para generar guiones.',
  'script.refinePlaceholder': 'p. ej. más urgente, más calmado, más contundente',
  'script.backToImage': 'Volver a imagen',
  'script.backToPicker': 'Volver al selector de guion',
  'script.pickedRest': 'Ahora elige un tono de voz.',
  'script.pickedStrong': 'Guion elegido.',
  'script.voiceLocked': 'Voz seleccionada:',
  'script.missingTitle': 'Falta una selección anterior.',
  'script.missingBody':
    'El paso de guion necesita una variante de texto aprobada Y una imagen aprobada. Reabre los pasos anteriores y elige uno de cada.',
  'script.duration': '~{n}s',

  // Audio step
  'audio.heading': 'Audio',
  'audio.subtitle':
    'Un render final. Aprueba para ensamblar el paquete, o regenera para otra toma.',
  'audio.keyMissingTitle': 'Se requiere clave de ElevenLabs',
  'audio.keyMissingBody': 'Añade tu clave en Ajustes para renderizar la locución.',
  'audio.backToVoice': 'Volver al selector de voz',
  'audio.demoNotice': 'Audio de demostración · añade la clave ElevenLabs para generación en vivo.',
  'audio.regenerate': 'Regenerar',
  'audio.rendering': 'Renderizando…',
  'audio.approve': 'Aprobar',
  'audio.voiceNotFoundTitle': 'Esta voz no está en tu cuenta ElevenLabs.',
  'audio.voiceNotFoundBody':
    'La voz que elegiste no está en tu cuenta ElevenLabs. Vuelve al paso 3 y elige una de las voces de tu cuenta.',
  'audio.voiceNotFoundCta': '← Elegir otra voz',
  'audio.scriptLabel': 'Guion',
  'audio.voiceLabel': 'Voz',
  'audio.toneLabel': 'Descripción del tono',
  'audio.estimatedDuration': 'Duración estimada',
  'audio.historyTitle': 'Historial de audio ({n})',
  'audio.missingTitle': 'Falta una selección anterior.',
  'audio.missingBody':
    'El paso de audio necesita un guion aprobado Y una voz elegida. Reabre el paso 3 y completa ambos.',

  // Voice picker
  'voice.heading': 'Elige una voz',
  'voice.userAccountHint':
    'Cargadas de tu cuenta ElevenLabs — estas son las voces que el render final puede usar.',
  'voice.sampleHint': 'Cada muestra dice:',
  'voice.count': '{n} voz{s}',
  'voice.fetchFailedTitle': 'No se pudieron cargar las voces de tu cuenta ElevenLabs.',
  'voice.fetchFailedBody':
    '{detail} — usando la biblioteca de voces integrada en la demo. Si el render final falla con voice_not_found, añade la voz elegida a tu cuenta en la ElevenLabs Voice Library.',
  'voice.libraryProbeFail':
    'Las previsualizaciones de voz se están cargando. Si no aparecen, recarga la página o abre Ajustes para añadir tu clave ElevenLabs — el selector usará entonces las voces de tu cuenta.',
  'voice.loading': 'Cargando voces de la cuenta ElevenLabs…',
  'voice.previewError':
    'La previsualización no cargó. Puedes seleccionar esta voz igualmente — el render final la usará.',
  'voice.select': 'Seleccionar esta voz',
  'voice.play': 'Reproducir {name}',
  'voice.pause': 'Pausar {name}',

  // Design step
  'design.heading': 'Diseño',
  'design.subtitle':
    'Claude genera una landing page de una sola página usando tu texto e imagen aprobados. Previsualiza, refina en lenguaje natural o aprueba para incluirla en el paquete.',
  'design.keyMissingTitle': 'Se requiere clave de Anthropic',
  'design.keyMissingBody':
    'La generación de diseño funciona con Claude. Añade tu clave Anthropic en Ajustes para continuar.',
  'design.backToAudio': 'Volver al audio',
  'design.approve': 'Aprobar diseño',
  'design.showCode': 'Mostrar código',
  'design.hideCode': 'Ocultar código',
  'design.refineHint':
    'Describe una dirección. El próximo render comienza desde cero con esa dirección en mente.',
  'design.refinePlaceholder': 'p. ej. editorial, más espacio en blanco, paleta más oscura',
  'design.rationale': 'Justificación',
  'design.missingTitle': 'Falta una selección anterior.',
  'design.missingBody':
    'El paso de diseño necesita una variante de texto aprobada Y una imagen aprobada. Reabre los pasos anteriores y elige uno de cada.',

  // Viewport toggle
  'viewport.mobile': 'Móvil',
  'viewport.tablet': 'Tableta',
  'viewport.desktop': 'Escritorio',

  // Final package
  'final.eyebrow': 'Aprobado',
  'final.heading': 'Paquete final',
  'final.body':
    'Los cinco activos confirmados. Descarga el paquete o vuelve a cualquier paso para revisar.',
  'final.editAny': 'Editar cualquier paso',
  'final.download': 'Descargar paquete',
  'final.packaging': 'Empaquetando…',
  'final.downloadFailed': 'Falló la descarga',
  'final.backToAudio': 'Volver al audio',
  'final.incompleteTitle': 'Paquete final incompleto.',
  'final.incompleteBody':
    'Uno o más activos aprobados faltan. Vuelve a aprobar los pasos afectados en el stepper.',
  'final.copy': 'Texto',
  'final.headline': 'Titular',
  'final.caption': 'Pie',
  'final.cta': 'CTA',
  'final.image': 'Imagen',
  'final.voiceover': 'Locución',
  'final.script': 'Guion',
  'final.voice': 'Voz',
  'final.tone': 'Tono',
  'final.design': 'Landing page',
  'final.directorsNotes': 'Notas del director',

  // Directors notes
  'notes.brief': 'Brief',
  'notes.product': 'Producto',
  'notes.audience': 'Público',
  'notes.angle': 'Ángulo',
  'notes.approvedVariant': 'Variante aprobada',
  'notes.refinements': 'Refinamientos',
  'notes.noRefinements': 'Sin refinamientos — elegiste la primera lectura.',
  'notes.pushedFor': 'orientado hacia',
  'notes.critiquesApplied': 'Críticas aplicadas',
  'notes.scriptVoice': 'Guion + Voz',
  'notes.audioAttempt': 'Aprobado en el intento',
  'notes.afterRegen': '(tras {n} regeneración{s})',

  // Errors
  'err.openai/auth-failed':
    'Tu clave de OpenAI no está siendo aceptada. Abre Ajustes y pégala de nuevo — a veces se cuela un espacio extra.',
  'err.openai/rate-limit': 'OpenAI está ocupado. Reintenta en unos segundos.',
  'err.openai/insufficient-quota':
    'Tu cuenta OpenAI se quedó sin créditos. Entra en platform.openai.com/account/billing y recarga, o usa una clave de otra cuenta con saldo.',
  'err.openai/network': 'No se pudo contactar con OpenAI. Verifica tu conexión.',
  'err.openai/bad-response':
    'OpenAI devolvió una respuesta inesperada. Reintenta — suele resolverse al reintentar.',
  'err.openai/missing-key': 'Añade tu clave OpenAI en Ajustes para continuar.',
  'err.fal/auth-failed': 'Tu clave fal.ai no está siendo aceptada. Abre Ajustes y verifícala.',
  'err.fal/no-credits':
    'Tu cuenta fal.ai se quedó sin créditos. Recarga en fal.ai/dashboard y reintenta.',
  'err.fal/forbidden':
    'Tu clave fal.ai no tiene acceso a Flux Schnell. Revisa los permisos de la clave en tu panel fal.ai.',
  'err.fal/rate-limit': 'fal.ai está ocupado. Espera un momento y reintenta.',
  'err.fal/network': 'No se pudo contactar con fal.ai. Verifica tu conexión.',
  'err.fal/bad-response':
    'fal.ai devolvió una respuesta inesperada. Reintenta — suele resolverse al reintentar.',
  'err.fal/missing-key': 'Añade tu clave fal.ai en Ajustes para generar imágenes.',
  'err.eleven/auth-failed':
    'Tu clave ElevenLabs no está siendo aceptada. Abre Ajustes y verifícala.',
  'err.eleven/voice-not-found':
    'Esta voz no está disponible en tu cuenta ElevenLabs. Elige una voz diferente.',
  'err.eleven/rate-limit': 'ElevenLabs está ocupado. Espera un momento y reintenta.',
  'err.eleven/network': 'No se pudo contactar con ElevenLabs. Verifica tu conexión.',
  'err.eleven/bad-response':
    'ElevenLabs devolvió una respuesta inesperada. Reintenta — suele resolverse al reintentar.',
  'err.eleven/missing-key': 'Añade tu clave ElevenLabs en Ajustes para renderizar audio.',
  'err.anthropic/auth-failed':
    'Tu clave Anthropic no está siendo aceptada. Abre Ajustes y verifícala.',
  'err.anthropic/rate-limit': 'Anthropic está ocupado. Espera un momento y reintenta.',
  'err.anthropic/insufficient-quota':
    'Tu cuenta Anthropic se quedó sin créditos. Entra en console.anthropic.com y recarga, o usa una clave de otra cuenta con saldo.',
  'err.anthropic/network': 'No se pudo contactar con Anthropic. Verifica tu conexión.',
  'err.anthropic/bad-response':
    'Anthropic devolvió una respuesta inesperada. Reintenta — suele resolverse al reintentar.',
  'err.anthropic/missing-key':
    'Añade tu clave Anthropic en Ajustes para habilitar la crítica de imagen.',
  'err.translator/wrong-shape':
    'No se pudo traducir la dirección. Prueba una formulación ligeramente diferente.',
  'err.translator/empty-direction':
    'Escribe una dirección primero, luego pulsa Refinar.',
  'err.image/all-failed':
    'Todos los intentos de imagen fallaron. Reintenta — fal.ai a veces falla en ráfagas.',
  'err.unknown':
    'Algo salió mal. Reintenta — y si persiste, abre Ajustes y revisa tus claves.',
};

const FR: Dict = {
  // App header
  'app.title': 'Cockpit du Directeur',
  'app.version': 'v2',
  'app.newBrief': 'Nouveau brief',
  'app.settings': 'Paramètres',
  'app.language': 'Langue',

  // Stepper
  'stepper.step': 'Étape',
  'step.copy': 'Texte',
  'step.image': 'Image',
  'step.script': 'Script',
  'step.audio': 'Audio',
  'step.design': 'Design',

  // Onboarding
  'onboarding.eyebrow': 'Bienvenue',
  'onboarding.heading': 'Un workflow publicitaire\nen quatre étapes, dirigé par vous.',
  'onboarding.body':
    "C'est le cockpit du directeur pour les actifs marketing. Vous fournissez un brief et parcourez texte, image, script et audio — en dirigeant chaque étape en français courant plutôt qu'en écrivant des prompts. Pour le lancer, il vous faut quatre clés d'API, une par service de génération que nous orchestrons.",
  'onboarding.providers.openai': 'Génération de texte et traduction des directions',
  'onboarding.providers.fal': "Génération d'images (Flux Schnell)",
  'onboarding.providers.eleven': 'Synthèse vocale',
  'onboarding.providers.anthropic':
    "Critique d'image et (optionnel) texte de meilleure qualité via Claude Sonnet",
  'onboarding.keysNote':
    "Les clés ne sont stockées que dans la session de ce navigateur — elles ne sont jamais envoyées à un serveur et s'effacent à la fermeture de l'onglet.",
  'onboarding.openSettings': 'Ouvrir les paramètres →',
  'onboarding.sampleBrief': "Essayer le brief d'exemple",

  // Brief form
  'brief.eyebrow': 'Le brief',
  'brief.heading': 'Trois lignes, quatre actifs.',
  'brief.intro':
    'Le cockpit du directeur vous guidera à travers texte, image, script et audio — une étape à la fois.',
  'brief.sample.title': "Première fois ? Essayez le brief d'exemple.",
  'brief.sample.body':
    "Exécution pré-cachée pour {product}. Tout le pipeline est restauré instantanément — voyez la forme de l'outil, puis écrivez le vôtre.",
  'brief.sample.cta': "Essayer le brief d'exemple →",
  'brief.field.productName': 'Nom du produit',
  'brief.field.targetAudience': 'Public cible',
  'brief.field.adAngle': 'Angle publicitaire',
  'brief.placeholder.productName': 'ex. Lumen Sleep Mist',
  'brief.placeholder.targetAudience': 'ex. Parents épuisés, 30–45 ans',
  'brief.placeholder.adAngle': "ex. S'endormir en sept minutes",
  'brief.required': '{label} est requis.',
  'brief.start': 'Démarrer',

  // Settings drawer
  'settings.title': 'Paramètres',
  'settings.subtitle': 'Les clés ne sont conservées que dans le sessionStorage de cet onglet.',
  'settings.close': 'Fermer',
  'settings.clear': 'Effacer',
  'settings.validating': 'Validation…',
  'settings.validate': 'Valider les clés',
  'settings.placeholder': "Clé d'API {provider}",

  // Common step UI
  'common.pickThis': 'Choisir celle-ci',
  'common.selected': 'Sélectionnée',
  'common.optionOf': 'Option {n} sur {total}',
  'common.showMore': 'Afficher 2 de plus',
  'common.generating': 'Génération…',
  'common.refining': 'Affinage…',
  'common.refine': 'Affiner',
  'common.refineDirection':
    "Décrivez une direction. Les nouvelles variantes la suivront au lieu d'éditer les anciennes.",
  'common.variantsSoFar': "{n} variante{s} jusqu'ici",
  'common.directionHistory': 'Historique des directions ({n})',
  'common.history.initial': 'Génération initiale',
  'common.history.more': "A demandé d'autres variantes",
  'common.history.refined': 'Affiné :',
  'common.history.cacheRestore': "Restauré depuis une session antérieure",
  'common.history.critiqueApplied': 'Critique appliquée :',
  'common.history.voicePick': 'Voix choisie :',
  'common.history.initialRender': 'Rendu initial',
  'common.history.regenerated': 'Régénéré',
  'common.history.discarded': 'écarté ~{n}s de lecture',
  'common.cacheRestore': 'Restauré depuis vos choix précédents · aucune régénération',
  'common.openSettings': 'Ouvrir les paramètres',
  'common.tryAgain': 'Réessayer',
  'common.errorTitle': 'Quelque chose a interrompu cette étape',
  'common.errorDetail': 'Afficher le détail technique',
  'common.back': 'Retour',

  // Copy step
  'copy.heading': 'Texte',
  'copy.subtitle': "Choisissez une variante, demandez-en plus, ou décrivez comment l'affiner.",
  'copy.keyMissingTitle': 'Clé OpenAI requise',
  'copy.keyMissingBody': 'Ajoutez votre clé dans les paramètres pour générer des variantes de texte.',
  'copy.anthropicHint':
    "Ajoutez une clé Anthropic dans les paramètres pour une génération de texte de meilleure qualité. La démo fonctionne sans.",
  'copy.refinePlaceholder': 'ex. plus agressif, moins corporate',

  // Image step
  'image.heading': 'Image',
  'image.subtitle':
    "Choisissez une image, demandez-en plus, affinez en langage naturel, ou obtenez la critique d'un directeur.",
  'image.keysMissingTitle': 'Clés requises',
  'image.keysMissingBody':
    "La génération d'image nécessite à la fois une clé OpenAI (constructeur de prompt) et une clé fal.ai (Flux Schnell). Ajoutez-les dans les paramètres.",
  'image.anthropicMissing': 'Clé Anthropic manquante — critique désactivée',
  'image.critique': 'Critique',
  'image.hideCritique': 'Masquer la critique',
  'image.showCritique': 'Afficher la critique',
  'image.critiqueLabel': 'Critique du directeur créatif',
  'image.critiqueHide': 'Masquer',
  'image.critiqueFailed': 'Échec de la critique',
  'image.critiqueRetry': 'Réessayer',
  'image.applyCritique': 'Appliquer cette critique',
  'image.critiqueDisabled': 'Ajoutez la clé Anthropic dans les paramètres pour activer la critique.',
  'image.critiqueAppliedTo': "Envoie la critique vers le flux d'affinage pour la variante",
  'image.refinePlaceholder':
    "ex. fond plus clair, le gars devrait sourire davantage, plus d'énergie",
  'image.backToCopy': 'Retour au texte',
  'image.copyMissingTitle': 'Texte approuvé manquant.',
  'image.copyMissingBody':
    "L'étape image a été ouverte sans variante de texte sélectionnée. Rouvrez l'étape 1 et choisissez-en une.",

  // Script step
  'script.heading': 'Script',
  'script.subtitle':
    'Choisissez un script, demandez-en plus, affinez en langage naturel, puis choisissez un ton de voix.',
  'script.keyMissingTitle': 'Clé OpenAI requise',
  'script.keyMissingBody': 'Ajoutez votre clé dans les paramètres pour générer des scripts.',
  'script.refinePlaceholder': "ex. plus urgent, plus calme, plus incisif",
  'script.backToImage': "Retour à l'image",
  'script.backToPicker': 'Retour au sélecteur de script',
  'script.pickedRest': 'Choisissez maintenant un ton de voix.',
  'script.pickedStrong': 'Script choisi.',
  'script.voiceLocked': 'Voix sélectionnée :',
  'script.missingTitle': 'Sélection amont manquante.',
  'script.missingBody':
    "L'étape script nécessite une variante de texte approuvée ET une image approuvée. Rouvrez les étapes précédentes et choisissez-en une de chaque.",
  'script.duration': '~{n}s',

  // Audio step
  'audio.heading': 'Audio',
  'audio.subtitle':
    'Un rendu final. Approuvez pour assembler le pack, ou régénérez pour une autre prise.',
  'audio.keyMissingTitle': 'Clé ElevenLabs requise',
  'audio.keyMissingBody': 'Ajoutez votre clé dans les paramètres pour faire le rendu de la voix off.',
  'audio.backToVoice': 'Retour au sélecteur de voix',
  'audio.demoNotice': 'Audio de démonstration · ajoutez la clé ElevenLabs pour une génération en direct.',
  'audio.regenerate': 'Régénérer',
  'audio.rendering': 'Rendu…',
  'audio.approve': 'Approuver',
  'audio.voiceNotFoundTitle': "Cette voix n'est pas dans votre compte ElevenLabs.",
  'audio.voiceNotFoundBody':
    "La voix que vous avez choisie n'est pas dans votre compte ElevenLabs. Revenez à l'étape 3 et choisissez une voix de votre compte.",
  'audio.voiceNotFoundCta': '← Choisir une autre voix',
  'audio.scriptLabel': 'Script',
  'audio.voiceLabel': 'Voix',
  'audio.toneLabel': 'Description du ton',
  'audio.estimatedDuration': 'Durée estimée',
  'audio.historyTitle': 'Historique audio ({n})',
  'audio.missingTitle': 'Sélection amont manquante.',
  'audio.missingBody':
    "L'étape audio nécessite un script approuvé ET une voix choisie. Rouvrez l'étape 3 et complétez les deux.",

  // Voice picker
  'voice.heading': 'Choisir une voix',
  'voice.userAccountHint':
    'Chargées depuis votre compte ElevenLabs — ce sont les voix que le rendu final peut réellement utiliser.',
  'voice.sampleHint': 'Chaque échantillon dit :',
  'voice.count': '{n} voix',
  'voice.fetchFailedTitle': "Impossible de charger les voix de votre compte ElevenLabs.",
  'voice.fetchFailedBody':
    '{detail} — utilisation de la bibliothèque de voix intégrée à la démo. Si le rendu final échoue avec voice_not_found, ajoutez la voix choisie à votre compte sur la ElevenLabs Voice Library.',
  'voice.libraryProbeFail':
    "Les aperçus de voix se chargent. S'ils n'apparaissent pas, rechargez la page ou ouvrez les paramètres pour ajouter votre clé ElevenLabs — le sélecteur utilisera alors les voix de votre compte directement.",
  'voice.loading': 'Chargement des voix de votre compte ElevenLabs…',
  'voice.previewError':
    "L'aperçu n'a pas pu se charger. Vous pouvez quand même sélectionner cette voix — le rendu final l'utilisera.",
  'voice.select': 'Sélectionner cette voix',
  'voice.play': 'Lire {name}',
  'voice.pause': 'Mettre en pause {name}',

  // Design step
  'design.heading': 'Design',
  'design.subtitle':
    "Claude génère une landing page d'une seule page à partir de votre texte et image approuvés. Prévisualisez, affinez en langage naturel ou approuvez pour ajouter au pack.",
  'design.keyMissingTitle': 'Clé Anthropic requise',
  'design.keyMissingBody':
    "La génération de design fonctionne avec Claude. Ajoutez votre clé Anthropic dans les paramètres pour continuer.",
  'design.backToAudio': "Retour à l'audio",
  'design.approve': 'Approuver le design',
  'design.showCode': 'Afficher le code',
  'design.hideCode': 'Masquer le code',
  'design.refineHint':
    'Décrivez une direction. Le prochain rendu repart de zéro avec cette direction.',
  'design.refinePlaceholder': 'ex. éditorial, plus de blanc, palette plus sombre',
  'design.rationale': 'Justification',
  'design.missingTitle': 'Sélection amont manquante.',
  'design.missingBody':
    "L'étape design nécessite une variante de texte approuvée ET une image approuvée. Rouvrez les étapes précédentes et choisissez-en une de chaque.",

  // Viewport toggle
  'viewport.mobile': 'Mobile',
  'viewport.tablet': 'Tablette',
  'viewport.desktop': 'Bureau',

  // Final package
  'final.eyebrow': 'Approuvé',
  'final.heading': 'Pack final',
  'final.body':
    "Les cinq actifs sont verrouillés. Téléchargez le pack ou revenez à n'importe quelle étape pour réviser.",
  'final.editAny': "Éditer n'importe quelle étape",
  'final.download': 'Télécharger le pack',
  'final.packaging': 'Empaquetage…',
  'final.downloadFailed': 'Échec du téléchargement',
  'final.backToAudio': "Retour à l'audio",
  'final.incompleteTitle': 'Pack final incomplet.',
  'final.incompleteBody':
    "Un ou plusieurs actifs approuvés sont manquants. Ré-approuvez les étapes concernées dans le stepper.",
  'final.copy': 'Texte',
  'final.headline': 'Titre',
  'final.caption': 'Légende',
  'final.cta': 'CTA',
  'final.image': 'Image',
  'final.voiceover': 'Voix off',
  'final.script': 'Script',
  'final.voice': 'Voix',
  'final.tone': 'Ton',
  'final.design': 'Landing page',
  'final.directorsNotes': 'Notes du directeur',

  // Directors notes
  'notes.brief': 'Brief',
  'notes.product': 'Produit',
  'notes.audience': 'Public',
  'notes.angle': 'Angle',
  'notes.approvedVariant': 'Variante approuvée',
  'notes.refinements': 'Affinages',
  'notes.noRefinements': "Aucun affinage — la première lecture a été choisie.",
  'notes.pushedFor': 'orienté vers',
  'notes.critiquesApplied': 'Critiques appliquées',
  'notes.scriptVoice': 'Script + Voix',
  'notes.audioAttempt': "Approuvé à la tentative",
  'notes.afterRegen': '(après {n} régénération{s})',

  // Errors
  'err.openai/auth-failed':
    "Votre clé OpenAI n'est pas acceptée. Ouvrez les paramètres et collez-la à nouveau — parfois une espace se glisse en plus.",
  'err.openai/rate-limit': 'OpenAI est occupé. Réessayez dans quelques secondes.',
  'err.openai/insufficient-quota':
    "Votre compte OpenAI n'a plus de crédits. Allez sur platform.openai.com/account/billing et rechargez, ou utilisez une clé d'un compte approvisionné.",
  'err.openai/network': "Impossible de joindre OpenAI. Vérifiez votre connexion.",
  'err.openai/bad-response':
    'OpenAI a renvoyé une réponse inattendue. Réessayez — cela se résout généralement au retry.',
  'err.openai/missing-key': 'Ajoutez votre clé OpenAI dans les paramètres pour continuer.',
  'err.fal/auth-failed': "Votre clé fal.ai n'est pas acceptée. Ouvrez les paramètres et vérifiez.",
  'err.fal/no-credits':
    "Votre compte fal.ai n'a plus de crédits. Rechargez sur fal.ai/dashboard et réessayez.",
  'err.fal/forbidden':
    "Votre clé fal.ai n'a pas accès à Flux Schnell. Vérifiez les permissions de la clé dans votre tableau de bord fal.ai.",
  'err.fal/rate-limit': 'fal.ai est occupé. Attendez un moment et réessayez.',
  'err.fal/network': "Impossible de joindre fal.ai. Vérifiez votre connexion.",
  'err.fal/bad-response':
    'fal.ai a renvoyé une réponse inattendue. Réessayez — cela se résout généralement au retry.',
  'err.fal/missing-key': 'Ajoutez votre clé fal.ai dans les paramètres pour générer des images.',
  'err.eleven/auth-failed':
    "Votre clé ElevenLabs n'est pas acceptée. Ouvrez les paramètres et vérifiez.",
  'err.eleven/voice-not-found':
    "Cette voix n'est pas disponible sur votre compte ElevenLabs. Choisissez une autre voix.",
  'err.eleven/rate-limit': 'ElevenLabs est occupé. Attendez un moment et réessayez.',
  'err.eleven/network': "Impossible de joindre ElevenLabs. Vérifiez votre connexion.",
  'err.eleven/bad-response':
    'ElevenLabs a renvoyé une réponse inattendue. Réessayez — cela se résout généralement au retry.',
  'err.eleven/missing-key': "Ajoutez votre clé ElevenLabs dans les paramètres pour générer l'audio.",
  'err.anthropic/auth-failed':
    "Votre clé Anthropic n'est pas acceptée. Ouvrez les paramètres et vérifiez.",
  'err.anthropic/rate-limit': 'Anthropic est occupé. Attendez un moment et réessayez.',
  'err.anthropic/insufficient-quota':
    "Votre compte Anthropic n'a plus de crédits. Allez sur console.anthropic.com et rechargez, ou utilisez une clé d'un compte approvisionné.",
  'err.anthropic/network': "Impossible de joindre Anthropic. Vérifiez votre connexion.",
  'err.anthropic/bad-response':
    'Anthropic a renvoyé une réponse inattendue. Réessayez — cela se résout généralement au retry.',
  'err.anthropic/missing-key':
    "Ajoutez votre clé Anthropic dans les paramètres pour activer la critique d'image.",
  'err.translator/wrong-shape':
    "Impossible de traduire la direction. Essayez une formulation légèrement différente.",
  'err.translator/empty-direction':
    "Tapez d'abord une direction, puis cliquez sur Affiner.",
  'err.image/all-failed':
    "Toutes les tentatives d'image ont échoué. Réessayez une fois — fal.ai est parfois instable lors des rafales.",
  'err.unknown':
    "Quelque chose a mal tourné. Réessayez — et si cela persiste, ouvrez les paramètres et revérifiez vos clés.",
};

const DE: Dict = {
  // App header
  'app.title': 'Director’s Cockpit',
  'app.version': 'v2',
  'app.newBrief': 'Neues Briefing',
  'app.settings': 'Einstellungen',
  'app.language': 'Sprache',

  // Stepper
  'stepper.step': 'Schritt',
  'step.copy': 'Text',
  'step.image': 'Bild',
  'step.script': 'Skript',
  'step.audio': 'Audio',
  'step.design': 'Design',

  // Onboarding
  'onboarding.eyebrow': 'Willkommen',
  'onboarding.heading': 'Ein vierstufiger Werbe-Workflow,\nvon Ihnen inszeniert.',
  'onboarding.body':
    'Dies ist das Director’s Cockpit für Marketing-Assets. Sie geben ein Briefing und durchlaufen Text, Bild, Skript und Audio — und steuern jeden Schritt in einfachem Deutsch, statt Prompts zu schreiben. Zum Betrieb benötigen Sie vier API-Schlüssel, einen pro Generierungsdienst, den wir orchestrieren.',
  'onboarding.providers.openai': 'Textgenerierung und Direktions-Übersetzung',
  'onboarding.providers.fal': 'Bildgenerierung (Flux Schnell)',
  'onboarding.providers.eleven': 'Sprachsynthese',
  'onboarding.providers.anthropic':
    'Bildkritik und (optional) höherwertige Texte via Claude Sonnet',
  'onboarding.keysNote':
    'Die Schlüssel werden nur in der Browser-Sitzung gespeichert — sie werden niemals an einen Server gesendet und beim Schließen des Tabs gelöscht.',
  'onboarding.openSettings': 'Einstellungen öffnen →',
  'onboarding.sampleBrief': 'Stattdessen Beispiel-Briefing probieren',

  // Brief form
  'brief.eyebrow': 'Das Briefing',
  'brief.heading': 'Drei Zeilen, vier Assets.',
  'brief.intro':
    'Das Director’s Cockpit führt Sie durch Text, Bild, Skript und Audio — Schritt für Schritt.',
  'brief.sample.title': 'Zum ersten Mal hier? Probieren Sie das Beispiel-Briefing.',
  'brief.sample.body':
    'Vorgecachte Ausführung für {product}. Die gesamte Pipeline wird sofort wiederhergestellt — sehen Sie die Form des Tools und schreiben Sie dann Ihr eigenes Briefing.',
  'brief.sample.cta': 'Beispiel-Briefing testen →',
  'brief.field.productName': 'Produktname',
  'brief.field.targetAudience': 'Zielgruppe',
  'brief.field.adAngle': 'Werbe-Ansatz',
  'brief.placeholder.productName': 'z. B. Lumen Sleep Mist',
  'brief.placeholder.targetAudience': 'z. B. Überarbeitete Eltern, 30–45',
  'brief.placeholder.adAngle': 'z. B. In sieben Minuten einschlafen',
  'brief.required': '{label} ist erforderlich.',
  'brief.start': 'Starten',

  // Settings drawer
  'settings.title': 'Einstellungen',
  'settings.subtitle': 'Schlüssel werden nur im sessionStorage dieses Tabs gehalten.',
  'settings.close': 'Schließen',
  'settings.clear': 'Leeren',
  'settings.validating': 'Validierung…',
  'settings.validate': 'Schlüssel validieren',
  'settings.placeholder': '{provider} API-Schlüssel',

  // Common step UI
  'common.pickThis': 'Diese wählen',
  'common.selected': 'Ausgewählt',
  'common.optionOf': 'Option {n} von {total}',
  'common.showMore': '2 weitere anzeigen',
  'common.generating': 'Generiere…',
  'common.refining': 'Verfeinere…',
  'common.refine': 'Verfeinern',
  'common.refineDirection':
    'Beschreiben Sie eine Richtung. Neue Varianten folgen ihr, statt die alten zu bearbeiten.',
  'common.variantsSoFar': '{n} Variante{s} bisher',
  'common.directionHistory': 'Verlauf der Direktionen ({n})',
  'common.history.initial': 'Erstgenerierung',
  'common.history.more': 'Weitere Varianten angefordert',
  'common.history.refined': 'Verfeinert:',
  'common.history.cacheRestore': 'Aus früherer Sitzung wiederhergestellt',
  'common.history.critiqueApplied': 'Kritik angewendet:',
  'common.history.voicePick': 'Stimme gewählt:',
  'common.history.initialRender': 'Erstes Rendering',
  'common.history.regenerated': 'Neu generiert',
  'common.history.discarded': 'ca. {n}s Aufnahme verworfen',
  'common.cacheRestore': 'Aus Ihren früheren Auswahlen wiederhergestellt · keine Neugenerierung',
  'common.openSettings': 'Einstellungen öffnen',
  'common.tryAgain': 'Erneut versuchen',
  'common.errorTitle': 'Etwas hat diesen Schritt unterbrochen',
  'common.errorDetail': 'Technisches Detail anzeigen',
  'common.back': 'Zurück',

  // Copy step
  'copy.heading': 'Text',
  'copy.subtitle': 'Wählen Sie eine Variante, fordern Sie mehr an oder beschreiben Sie die Verfeinerung.',
  'copy.keyMissingTitle': 'OpenAI-Schlüssel erforderlich',
  'copy.keyMissingBody': 'Fügen Sie Ihren Schlüssel in den Einstellungen hinzu, um Textvarianten zu generieren.',
  'copy.anthropicHint':
    'Fügen Sie einen Anthropic-Schlüssel in den Einstellungen hinzu für höherwertige Textgenerierung. Die Demo funktioniert auch ohne.',
  'copy.refinePlaceholder': 'z. B. aggressiver, weniger nach Konzern',

  // Image step
  'image.heading': 'Bild',
  'image.subtitle':
    'Wählen Sie ein Bild, fordern Sie mehr an, verfeinern Sie in natürlicher Sprache oder holen Sie sich eine Regie-Kritik.',
  'image.keysMissingTitle': 'Schlüssel erforderlich',
  'image.keysMissingBody':
    'Bildgenerierung benötigt sowohl einen OpenAI-Schlüssel (Prompt-Builder) als auch einen fal.ai-Schlüssel (Flux Schnell). Fügen Sie sie in den Einstellungen hinzu.',
  'image.anthropicMissing': 'Anthropic-Schlüssel fehlt — Kritik deaktiviert',
  'image.critique': 'Kritik',
  'image.hideCritique': 'Kritik ausblenden',
  'image.showCritique': 'Kritik anzeigen',
  'image.critiqueLabel': 'Kritik des Creative Directors',
  'image.critiqueHide': 'Ausblenden',
  'image.critiqueFailed': 'Kritik fehlgeschlagen',
  'image.critiqueRetry': 'Erneut versuchen',
  'image.applyCritique': 'Diese Kritik anwenden',
  'image.critiqueDisabled':
    'Fügen Sie den Anthropic-Schlüssel in den Einstellungen hinzu, um Kritik zu aktivieren.',
  'image.critiqueAppliedTo': 'Übergibt die Kritik an den Verfeinerungs-Flow für Variante',
  'image.refinePlaceholder':
    'z. B. helleren Hintergrund, der Typ sollte mehr lächeln, mehr Energie',
  'image.backToCopy': 'Zurück zum Text',
  'image.copyMissingTitle': 'Freigegebener Text fehlt.',
  'image.copyMissingBody':
    'Der Bild-Schritt wurde ohne ausgewählte Textvariante geöffnet. Öffnen Sie Schritt 1 erneut und wählen Sie eine aus.',

  // Script step
  'script.heading': 'Skript',
  'script.subtitle':
    'Wählen Sie ein Skript, fordern Sie mehr an, verfeinern Sie in natürlicher Sprache und wählen Sie dann einen Stimm-Ton.',
  'script.keyMissingTitle': 'OpenAI-Schlüssel erforderlich',
  'script.keyMissingBody': 'Fügen Sie Ihren Schlüssel in den Einstellungen hinzu, um Skripte zu generieren.',
  'script.refinePlaceholder': 'z. B. dringlicher, ruhiger, prägnanter',
  'script.backToImage': 'Zurück zum Bild',
  'script.backToPicker': 'Zurück zur Skriptauswahl',
  'script.pickedRest': 'Wählen Sie nun einen Stimm-Ton.',
  'script.pickedStrong': 'Skript ausgewählt.',
  'script.voiceLocked': 'Ausgewählte Stimme:',
  'script.missingTitle': 'Vorgelagerte Auswahl fehlt.',
  'script.missingBody':
    'Der Skript-Schritt benötigt eine freigegebene Textvariante UND ein freigegebenes Bild. Öffnen Sie die vorhergehenden Schritte erneut und wählen Sie jeweils eines aus.',
  'script.duration': '~{n}s',

  // Audio step
  'audio.heading': 'Audio',
  'audio.subtitle':
    'Ein finales Rendering. Freigeben, um das Paket zusammenzustellen, oder für eine andere Aufnahme neu generieren.',
  'audio.keyMissingTitle': 'ElevenLabs-Schlüssel erforderlich',
  'audio.keyMissingBody': 'Fügen Sie Ihren Schlüssel in den Einstellungen hinzu, um das Voiceover zu rendern.',
  'audio.backToVoice': 'Zurück zur Stimmauswahl',
  'audio.demoNotice':
    'Demo-Audio gezeigt · ElevenLabs-Schlüssel hinzufügen für Live-Generierung.',
  'audio.regenerate': 'Neu generieren',
  'audio.rendering': 'Rendere…',
  'audio.approve': 'Freigeben',
  'audio.voiceNotFoundTitle': 'Diese Stimme ist nicht in Ihrem ElevenLabs-Konto.',
  'audio.voiceNotFoundBody':
    'Die von Ihnen gewählte Stimme ist nicht in Ihrem ElevenLabs-Konto. Gehen Sie zurück zu Schritt 3 und wählen Sie eine Ihrer Konto-Stimmen.',
  'audio.voiceNotFoundCta': '← Andere Stimme wählen',
  'audio.scriptLabel': 'Skript',
  'audio.voiceLabel': 'Stimme',
  'audio.toneLabel': 'Tonbeschreibung',
  'audio.estimatedDuration': 'Geschätzte Dauer',
  'audio.historyTitle': 'Audio-Verlauf ({n})',
  'audio.missingTitle': 'Vorgelagerte Auswahl fehlt.',
  'audio.missingBody':
    'Der Audio-Schritt benötigt ein freigegebenes Skript UND eine gewählte Stimme. Öffnen Sie Schritt 3 erneut und vervollständigen Sie beides.',

  // Voice picker
  'voice.heading': 'Stimme wählen',
  'voice.userAccountHint':
    'Aus Ihrem ElevenLabs-Konto geladen — das sind die Stimmen, die das finale Rendering tatsächlich verwenden kann.',
  'voice.sampleHint': 'Jede Probe sagt:',
  'voice.count': '{n} Stimme{s}',
  'voice.fetchFailedTitle': 'Stimmen aus Ihrem ElevenLabs-Konto konnten nicht geladen werden.',
  'voice.fetchFailedBody':
    '{detail} — die in der Demo eingebaute Stimm-Bibliothek wird verwendet. Falls das finale Rendering mit voice_not_found fehlschlägt, fügen Sie die gewählte Stimme über die ElevenLabs Voice Library zu Ihrem Konto hinzu.',
  'voice.libraryProbeFail':
    'Stimm-Vorschauen laden. Falls sie nicht erscheinen, laden Sie die Seite neu oder öffnen Sie die Einstellungen, um Ihren ElevenLabs-Schlüssel hinzuzufügen — die Auswahl verwendet dann direkt die Stimmen Ihres Kontos.',
  'voice.loading': 'Lade Stimmen aus Ihrem ElevenLabs-Konto…',
  'voice.previewError':
    'Vorschau konnte nicht geladen werden. Sie können diese Stimme trotzdem auswählen — das finale Rendering verwendet sie.',
  'voice.select': 'Diese Stimme wählen',
  'voice.play': '{name} abspielen',
  'voice.pause': '{name} pausieren',

  // Design step
  'design.heading': 'Design',
  'design.subtitle':
    'Claude generiert eine einseitige Landingpage aus Ihrem freigegebenen Text und Bild. Vorschau ansehen, in natürlicher Sprache verfeinern oder freigeben, um sie dem Paket hinzuzufügen.',
  'design.keyMissingTitle': 'Anthropic-Schlüssel erforderlich',
  'design.keyMissingBody':
    'Die Design-Generierung läuft auf Claude. Fügen Sie Ihren Anthropic-Schlüssel in den Einstellungen hinzu, um fortzufahren.',
  'design.backToAudio': 'Zurück zum Audio',
  'design.approve': 'Design freigeben',
  'design.showCode': 'Code anzeigen',
  'design.hideCode': 'Code ausblenden',
  'design.refineHint':
    'Beschreiben Sie eine Richtung. Das nächste Rendering startet frisch mit dieser Richtung.',
  'design.refinePlaceholder': 'z. B. editorial, mehr Weißraum, dunklere Palette',
  'design.rationale': 'Begründung',
  'design.missingTitle': 'Vorgelagerte Auswahl fehlt.',
  'design.missingBody':
    'Der Design-Schritt benötigt eine freigegebene Textvariante UND ein freigegebenes Bild. Öffnen Sie die vorherigen Schritte erneut und wählen Sie jeweils eines aus.',

  // Viewport toggle
  'viewport.mobile': 'Mobil',
  'viewport.tablet': 'Tablet',
  'viewport.desktop': 'Desktop',

  // Final package
  'final.eyebrow': 'Freigegeben',
  'final.heading': 'Finales Paket',
  'final.body':
    'Alle fünf Assets sind festgelegt. Laden Sie das Bundle herunter oder kehren Sie zu einem beliebigen Schritt zurück, um zu überarbeiten.',
  'final.editAny': 'Beliebigen Schritt bearbeiten',
  'final.download': 'Paket herunterladen',
  'final.packaging': 'Paketierung…',
  'final.downloadFailed': 'Download fehlgeschlagen',
  'final.backToAudio': 'Zurück zum Audio',
  'final.incompleteTitle': 'Finales Paket unvollständig.',
  'final.incompleteBody':
    'Ein oder mehrere freigegebene Assets fehlen. Geben Sie die betroffenen Schritte im Stepper erneut frei.',
  'final.copy': 'Text',
  'final.headline': 'Headline',
  'final.caption': 'Bildunterschrift',
  'final.cta': 'CTA',
  'final.image': 'Bild',
  'final.voiceover': 'Voiceover',
  'final.script': 'Skript',
  'final.voice': 'Stimme',
  'final.tone': 'Ton',
  'final.design': 'Landingpage',
  'final.directorsNotes': 'Regie-Notizen',

  // Directors notes
  'notes.brief': 'Briefing',
  'notes.product': 'Produkt',
  'notes.audience': 'Zielgruppe',
  'notes.angle': 'Ansatz',
  'notes.approvedVariant': 'Freigegebene Variante',
  'notes.refinements': 'Verfeinerungen',
  'notes.noRefinements': 'Keine Verfeinerungen — erste Lesart gewählt.',
  'notes.pushedFor': 'gerichtet auf',
  'notes.critiquesApplied': 'Angewendete Kritiken',
  'notes.scriptVoice': 'Skript + Stimme',
  'notes.audioAttempt': 'Freigegeben beim Versuch',
  'notes.afterRegen': '(nach {n} Neugenerierung{s})',

  // Errors
  'err.openai/auth-failed':
    'Ihr OpenAI-Schlüssel wird nicht akzeptiert. Öffnen Sie die Einstellungen und fügen Sie ihn erneut ein — manchmal schleicht sich ein Leerzeichen mit hinein.',
  'err.openai/rate-limit': 'OpenAI ist ausgelastet. Versuchen Sie es in wenigen Sekunden erneut.',
  'err.openai/insufficient-quota':
    'Ihr OpenAI-Konto hat keine Credits mehr. Öffnen Sie platform.openai.com/account/billing und laden Sie auf, oder verwenden Sie einen Schlüssel eines aufgeladenen Kontos.',
  'err.openai/network': 'OpenAI konnte nicht erreicht werden. Prüfen Sie Ihre Verbindung.',
  'err.openai/bad-response':
    'OpenAI hat eine unerwartete Antwort geliefert. Versuchen Sie es erneut — meist behebt ein Retry das Problem.',
  'err.openai/missing-key': 'Fügen Sie Ihren OpenAI-Schlüssel in den Einstellungen hinzu, um fortzufahren.',
  'err.fal/auth-failed':
    'Ihr fal.ai-Schlüssel wird nicht akzeptiert. Öffnen Sie die Einstellungen und prüfen Sie ihn.',
  'err.fal/no-credits':
    'Ihr fal.ai-Konto hat keine Credits mehr. Laden Sie auf fal.ai/dashboard auf und versuchen Sie es erneut.',
  'err.fal/forbidden':
    'Ihr fal.ai-Schlüssel hat keinen Zugriff auf Flux Schnell. Prüfen Sie die Berechtigungen des Schlüssels in Ihrem fal.ai-Dashboard.',
  'err.fal/rate-limit': 'fal.ai ist ausgelastet. Warten Sie kurz und versuchen Sie es erneut.',
  'err.fal/network': 'fal.ai konnte nicht erreicht werden. Prüfen Sie Ihre Verbindung.',
  'err.fal/bad-response':
    'fal.ai hat eine unerwartete Antwort geliefert. Versuchen Sie es erneut — meist behebt ein Retry das Problem.',
  'err.fal/missing-key': 'Fügen Sie Ihren fal.ai-Schlüssel in den Einstellungen hinzu, um Bilder zu generieren.',
  'err.eleven/auth-failed':
    'Ihr ElevenLabs-Schlüssel wird nicht akzeptiert. Öffnen Sie die Einstellungen und prüfen Sie ihn.',
  'err.eleven/voice-not-found':
    'Diese Stimme ist in Ihrem ElevenLabs-Konto nicht verfügbar. Wählen Sie eine andere Stimme.',
  'err.eleven/rate-limit': 'ElevenLabs ist ausgelastet. Warten Sie kurz und versuchen Sie es erneut.',
  'err.eleven/network': 'ElevenLabs konnte nicht erreicht werden. Prüfen Sie Ihre Verbindung.',
  'err.eleven/bad-response':
    'ElevenLabs hat eine unerwartete Antwort geliefert. Versuchen Sie es erneut — meist behebt ein Retry das Problem.',
  'err.eleven/missing-key': 'Fügen Sie Ihren ElevenLabs-Schlüssel in den Einstellungen hinzu, um Audio zu rendern.',
  'err.anthropic/auth-failed':
    'Ihr Anthropic-Schlüssel wird nicht akzeptiert. Öffnen Sie die Einstellungen und prüfen Sie ihn.',
  'err.anthropic/rate-limit': 'Anthropic ist ausgelastet. Warten Sie kurz und versuchen Sie es erneut.',
  'err.anthropic/insufficient-quota':
    'Ihr Anthropic-Konto hat keine Credits mehr. Öffnen Sie console.anthropic.com und laden Sie auf, oder verwenden Sie einen Schlüssel eines aufgeladenen Kontos.',
  'err.anthropic/network': 'Anthropic konnte nicht erreicht werden. Prüfen Sie Ihre Verbindung.',
  'err.anthropic/bad-response':
    'Anthropic hat eine unerwartete Antwort geliefert. Versuchen Sie es erneut — meist behebt ein Retry das Problem.',
  'err.anthropic/missing-key':
    'Fügen Sie Ihren Anthropic-Schlüssel in den Einstellungen hinzu, um die Bildkritik zu aktivieren.',
  'err.translator/wrong-shape':
    'Die Direktion konnte nicht übersetzt werden. Versuchen Sie eine leicht andere Formulierung.',
  'err.translator/empty-direction':
    'Geben Sie zuerst eine Direktion ein, dann klicken Sie auf Verfeinern.',
  'err.image/all-failed':
    'Alle Bildversuche sind fehlgeschlagen. Versuchen Sie es noch einmal — fal.ai ist bei Bursts manchmal instabil.',
  'err.unknown':
    'Etwas ist schiefgelaufen. Versuchen Sie es erneut — und falls es weiterhin auftritt, öffnen Sie die Einstellungen und prüfen Sie Ihre Schlüssel.',
};

const DICTS: Record<Locale, Dict> = { en: EN, ja: JA, pt: PT, es: ES, fr: FR, de: DE };

export function translate(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  const dict = DICTS[locale] ?? EN;
  let s = dict[key] ?? EN[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.split(`{${k}}`).join(String(v));
    }
  }
  return s;
}

// React hooks live in ./hooks to avoid a store → settings.slice → llmService
// → i18n → store circular import. Components import from './hooks' (or this
// barrel — see re-export below).

// LLM language directives. Appended to a system prompt to coerce the model
// to write its visible output in the user's chosen locale.
export function languageDirective(locale: Locale): string {
  if (locale === 'ja') {
    return '出力は必ずすべて自然な日本語で書いてください。英語の単語や表現を混ぜないでください(製品名や固有名詞は除く)。日本のSNS広告として違和感のないトーンで。';
  }
  if (locale === 'pt') {
    return 'Escreva toda a saída em português brasileiro natural. Não misture palavras ou expressões em inglês (exceto nomes de produtos e nomes próprios). Use um tom adequado a anúncios em redes sociais brasileiras.';
  }
  if (locale === 'es') {
    return 'Escribe toda la salida en español natural. No mezcles palabras o expresiones en inglés (excepto nombres de productos y nombres propios). Usa un tono adecuado a anuncios en redes sociales en español.';
  }
  if (locale === 'fr') {
    return "Rédigez toute la sortie dans un français naturel. Ne mélangez pas de mots ou d'expressions anglaises (sauf noms de produits et noms propres). Utilisez un ton adapté aux publicités sur les réseaux sociaux francophones.";
  }
  if (locale === 'de') {
    return 'Schreiben Sie die gesamte Ausgabe in natürlichem Deutsch. Mischen Sie keine englischen Wörter oder Ausdrücke ein (außer Produktnamen und Eigennamen). Verwenden Sie einen Ton, der für Social-Media-Werbung im deutschsprachigen Raum passt.';
  }
  return 'Write all output in natural English.';
}

// Used by the image-prompt builder: image models work much better with
// English prompts, so we always keep that prompt in English regardless of
// the user's UI locale. The brief / copy fed into the user message may be
// in another language — we tell the builder to translate as it composes.
export const IMAGE_PROMPT_LANGUAGE_NOTE = `The brief, copy, or direction in the user message may be written in a non-English language (e.g. Japanese). Translate any non-English nouns or descriptions into vivid English as you compose the Flux prompt. The final prompt MUST be in English — image models perform significantly worse with non-English prompts.`;
