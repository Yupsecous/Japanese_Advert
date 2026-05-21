export type Locale = 'en' | 'ja';

export const LOCALES: readonly Locale[] = ['en', 'ja'] as const;

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  ja: '日本語',
};

export const LOCALE_SHORT_LABELS: Record<Locale, string> = {
  en: 'EN',
  ja: 'JA',
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

  // Final package
  'final.eyebrow': 'Approved',
  'final.heading': 'Final package',
  'final.body': 'All four assets locked. Download the bundle or backtrack to any step to revise.',
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

  // Final package
  'final.eyebrow': '承認済み',
  'final.heading': '最終パッケージ',
  'final.body':
    '4つの素材すべてが確定しました。バンドルをダウンロードするか、任意のステップに戻って修正できます。',
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

const DICTS: Record<Locale, Dict> = { en: EN, ja: JA };

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
  return 'Write all output in natural English.';
}

// Used by the image-prompt builder: image models work much better with
// English prompts, so we always keep that prompt in English regardless of
// the user's UI locale. The brief / copy fed into the user message may be
// in another language — we tell the builder to translate as it composes.
export const IMAGE_PROMPT_LANGUAGE_NOTE = `The brief, copy, or direction in the user message may be written in a non-English language (e.g. Japanese). Translate any non-English nouns or descriptions into vivid English as you compose the Flux prompt. The final prompt MUST be in English — image models perform significantly worse with non-English prompts.`;
