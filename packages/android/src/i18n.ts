// Android-side i18n. Slimmer than the web dictionary because RN screens
// have fewer touchpoints than the web (no Audience Console / Platform
// Assets yet). The two dictionaries will converge into @advert/shared
// once the missing screens land — for now, keeping them separate avoids
// a 200-key churn diff.
//
// Falls back to English when a key is missing in the active locale.

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

type Dict = Record<string, string>;

const EN: Dict = {
  // Auth
  'auth.eyebrow': "Director's Cockpit",
  'auth.heading': 'Sign in',
  'auth.subtitle':
    'This app is access-controlled. Enter the credentials your contact shared with you.',
  'auth.username': 'Username',
  'auth.password': 'Password',
  'auth.signIn': 'Sign in',
  'auth.invalid': "Username and password didn't match. Check for stray spaces.",
  'auth.network': 'Could not reach the backend. Confirm the backend is running and the URL in app.json is correct.',
  'auth.footnote':
    'Credentials are checked server-side. This is a soft gate for the internal team, not a public security barrier.',

  // Common
  'common.signOut': 'Sign out',
  'common.back': '← Back',
  'common.retry': 'Retry',
  'common.close': 'Close',
  'common.generating': 'Generating…',
  'common.refining': 'Refining…',
  'common.refine': 'Refine',
  'common.showMore': 'Show more variants',
  'common.pickThis': 'Pick this',
  'common.selected': 'Selected ✓',
  'common.option': 'Option {n} of {total}',
  'common.language': 'Language',

  // Brief
  'brief.eyebrow': 'The brief',
  'brief.heading': 'Three lines, four assets.',
  'brief.intro':
    "The director's cockpit walks you through copy, image, script and audio — one at a time.",
  'brief.productName': 'Product name',
  'brief.placeholderProduct': 'e.g. Lumen Sleep Mist',
  'brief.requiredProduct': 'Product name is required.',
  'brief.targetAudience': 'Target audience',
  'brief.placeholderAudience': 'e.g. Burned-out parents, 30–45',
  'brief.requiredAudience': 'Target audience is required.',
  'brief.adAngle': 'Ad angle',
  'brief.placeholderAngle': 'e.g. Fall asleep in seven minutes flat',
  'brief.requiredAngle': 'Ad angle is required.',
  'brief.start': 'Start',

  // Copy step
  'copy.eyebrow': 'Step 1 of 6',
  'copy.heading': 'Pick your copy direction',
  'copy.subtitle': 'Each variant is a different hook on the same brief. Tap one to approve and move to the image step.',
  'copy.loading': 'Generating copy…',
  'copy.backToBrief': '← Back to brief',

  // Image step
  'image.eyebrow': 'Step 2 of 6',
  'image.heading': 'Pick your hero image',
  'image.subtitle': 'Photoreal cues baked into every prompt. Tap a card to approve and continue.',
  'image.backToCopy': '← Back to copy',
  'image.refineLabel': 'Refine',
  'image.refineHint': 'Plain English. e.g. "more cinematic", "lighter background, more energy".',
  'image.refinePlaceholder': 'Tell the director what to change',
  'image.tierBadge.fast': 'Fast',
  'image.tierBadge.balanced': 'Balanced',
  'image.tierBadge.realistic': 'Realistic',
  'image.tierModalHeading': 'Image quality tier',
  'image.tierModalSub':
    'Higher tiers use better Flux models — visibly more photorealistic at higher cost. Saved per-device.',
  'image.tier.fastBlurb': 'Flux Schnell. Cheapest and quickest. The AI look is more visible.',
  'image.tier.balancedBlurb': 'Flux Dev. Much cleaner faces, hands, textures. ~8× the cost of Fast.',
  'image.tier.realisticBlurb': 'Flux Pro 1.1. Most photorealistic. Best skin, light, materials.',
  'image.loading': 'Generating images at {tier} tier (~{seconds}s)…',

  // Script step
  'script.eyebrow': 'Step 3 of 6',
  'script.heading': 'Pick your script',
  'script.subtitle': 'Two takes, same emotional beat, different tonal registers. Tap one to approve and continue.',
  'script.loading': 'Writing scripts…',
  'script.backToImage': '← Back to image',
  'script.duration': '~{seconds}s',

  // Audio step
  'audio.eyebrow': 'Step 4 of 6',
  'audio.heading': 'Pick a voice. Hear it.',
  'audio.subtitle': 'Tap a voice, generate the read, then play it back. Re-pick a voice to generate again.',
  'audio.backToScript': '← Back to script',
  'audio.voiceLabel': 'Voice',
  'audio.voicePick': 'Pick a voice',
  'audio.voicePickLoading': 'Loading…',
  'audio.generate': 'Generate voice-over',
  'audio.regenerate': 'Re-generate with current voice',
  'audio.play': '▶  Play',
  'audio.pause': '⏸  Pause',
  'audio.continueDesign': 'Continue to design step →',
  'audio.modalHeading': 'Pick a voice',
  'audio.modalSub':
    'Voices come from your ElevenLabs account. Default voice is saved per-device.',
  'audio.modalEmpty': 'No voices found. Add voices in your ElevenLabs dashboard.',

  // Design step
  'design.eyebrow': 'Step 6 of 6 — final',
  'design.heading': 'Landing-page component',
  'design.subtitle': 'A single-file React + Tailwind v4 component, self-contained, ready to paste into your app. Tap "Copy code" to copy the TSX to your clipboard.',
  'design.backToAudio': '← Back to audio',
  'design.loading': 'Generating landing page (Claude Opus, ~30–60s)…',
  'design.rationaleLabel': 'Rationale',
  'design.copyCode': 'Copy code',
  'design.copied': 'Copied ✓',
  'design.refineLabel': 'Refine the design',
  'design.refineHint': 'Plain English. e.g. "warmer palette", "bigger hero, less text".',
  'design.refinePlaceholder': 'Tell the designer what to change',
  'design.finish': 'Finish — back to a new brief',

  // Errors
  'error.sessionExpired': 'Session expired. Sign in again.',
  'error.costCap': 'Cost cap reached.',
  'error.missingKey': 'Backend missing API key ({key}).',
  'error.network': 'Could not reach the backend.',
  'error.upstreamAuth': 'Provider key was rejected.',
  'error.upstreamNoCredits': 'Provider account is out of credits.',
  'error.upstreamRateLimit': 'Provider rate-limited. Wait a moment.',
  'error.unknown': 'Something went wrong.',

  // Missing-step screens
  'missing.heading': 'Earlier steps missing',
  'missing.copyMissing': 'Pick a copy variant first.',
  'missing.copyImageMissing': 'Approve a copy variant and an image variant first.',
  'missing.scriptMissing': 'Pick a script first.',
  'missing.backToBrief': 'Back to brief',
};

const JA: Dict = {
  'auth.eyebrow': "Director's Cockpit",
  'auth.heading': 'サインイン',
  'auth.subtitle':
    'このアプリはアクセス制限付きです。連絡担当者から共有された認証情報を入力してください。',
  'auth.username': 'ユーザー名',
  'auth.password': 'パスワード',
  'auth.signIn': 'サインイン',
  'auth.invalid': 'ユーザー名とパスワードが一致しません。余分なスペースがないか確認してください。',
  'auth.network': 'バックエンドに接続できませんでした。バックエンドが起動しているか、app.jsonのURLが正しいか確認してください。',
  'auth.footnote':
    '認証情報はサーバー側で検証されます。これは内部チーム向けのソフトゲートで、公開セキュリティバリアではありません。',

  'common.signOut': 'サインアウト',
  'common.back': '← 戻る',
  'common.retry': '再試行',
  'common.close': '閉じる',
  'common.generating': '生成中…',
  'common.refining': '調整中…',
  'common.refine': '調整',
  'common.showMore': 'バリアントを追加',
  'common.pickThis': 'これを選択',
  'common.selected': '選択済み ✓',
  'common.option': '{n} / {total}',
  'common.language': '言語',

  'brief.eyebrow': 'ブリーフ',
  'brief.heading': '3行入力、4種類のアセット。',
  'brief.intro': "Director's Cockpitがコピー・画像・スクリプト・音声を一つずつ作成します。",
  'brief.productName': '商品名',
  'brief.placeholderProduct': '例: Lumen Sleep Mist',
  'brief.requiredProduct': '商品名は必須です。',
  'brief.targetAudience': 'ターゲット層',
  'brief.placeholderAudience': '例: 多忙な親世代、30〜45歳',
  'brief.requiredAudience': 'ターゲット層は必須です。',
  'brief.adAngle': '広告アングル',
  'brief.placeholderAngle': '例: 7分でぐっすり眠れる',
  'brief.requiredAngle': '広告アングルは必須です。',
  'brief.start': '開始',

  'copy.eyebrow': 'ステップ 1/6',
  'copy.heading': 'コピーの方向性を選択',
  'copy.subtitle': '各バリアントは同じブリーフへの異なるアプローチ。一つ選択して画像ステップへ進みます。',
  'copy.loading': 'コピーを生成中…',
  'copy.backToBrief': '← ブリーフへ戻る',

  'image.eyebrow': 'ステップ 2/6',
  'image.heading': 'ヒーロー画像を選択',
  'image.subtitle': '全プロンプトにフォトリアル要素を組み込み済み。カードをタップして承認・続行します。',
  'image.backToCopy': '← コピーへ戻る',
  'image.refineLabel': '調整',
  'image.refineHint': '日本語で自由に。例: 「もっとシネマティックに」「背景を明るく、エネルギッシュに」',
  'image.refinePlaceholder': 'ディレクターに変更点を伝えてください',
  'image.tierBadge.fast': 'Fast',
  'image.tierBadge.balanced': 'Balanced',
  'image.tierBadge.realistic': 'Realistic',
  'image.tierModalHeading': '画像品質ティア',
  'image.tierModalSub':
    '上位ティアほど高品質なFluxモデルを使用 — よりフォトリアルになりますがコストも増加。端末ごとに保存されます。',
  'image.tier.fastBlurb': 'Flux Schnell。最安・最速。AIっぽさは残ります。',
  'image.tier.balancedBlurb': 'Flux Dev。Schnellより顔・手・質感がかなりクリーン。コスト約8倍。',
  'image.tier.realisticBlurb': 'Flux Pro 1.1。最もフォトリアル。肌・光・素材感が最良。',
  'image.loading': '{tier}ティアで画像生成中(約{seconds}秒)…',

  'script.eyebrow': 'ステップ 3/6',
  'script.heading': 'スクリプトを選択',
  'script.subtitle': '2つのテイク、同じ感情ビート、異なるトーン。一つ選択して続行します。',
  'script.loading': 'スクリプトを執筆中…',
  'script.backToImage': '← 画像へ戻る',
  'script.duration': '約{seconds}秒',

  'audio.eyebrow': 'ステップ 4/6',
  'audio.heading': '声を選んで聞く。',
  'audio.subtitle': '声を選び、ナレーションを生成して再生。声を選び直して再生成も可能。',
  'audio.backToScript': '← スクリプトへ戻る',
  'audio.voiceLabel': '声',
  'audio.voicePick': '声を選択',
  'audio.voicePickLoading': '読み込み中…',
  'audio.generate': 'ナレーションを生成',
  'audio.regenerate': '現在の声で再生成',
  'audio.play': '▶  再生',
  'audio.pause': '⏸  一時停止',
  'audio.continueDesign': 'デザインステップへ進む →',
  'audio.modalHeading': '声を選択',
  'audio.modalSub':
    'ElevenLabsアカウントの声から選択します。デフォルトの声は端末ごとに保存されます。',
  'audio.modalEmpty': '声が見つかりません。ElevenLabsダッシュボードで追加してください。',

  'design.eyebrow': 'ステップ 6/6 — 最終',
  'design.heading': 'ランディングページコンポーネント',
  'design.subtitle': 'シングルファイルのReact + Tailwind v4コンポーネント、自己完結型、貼り付けるだけで使えます。「コードをコピー」でTSXをクリップボードへ。',
  'design.backToAudio': '← 音声へ戻る',
  'design.loading': 'ランディングページを生成中(Claude Opus、約30〜60秒)…',
  'design.rationaleLabel': '設計意図',
  'design.copyCode': 'コードをコピー',
  'design.copied': 'コピー済み ✓',
  'design.refineLabel': 'デザインを調整',
  'design.refineHint': '日本語で自由に。例: 「より温かみのあるパレット」「ヒーローを大きく、テキストを減らす」',
  'design.refinePlaceholder': 'デザイナーに変更点を伝えてください',
  'design.finish': '終了 — 新しいブリーフへ',

  'error.sessionExpired': 'セッションが切れました。再度サインインしてください。',
  'error.costCap': 'コストキャップに到達しました。',
  'error.missingKey': 'バックエンドにAPIキーがありません ({key})。',
  'error.network': 'バックエンドに接続できませんでした。',
  'error.upstreamAuth': 'プロバイダのAPIキーが拒否されました。',
  'error.upstreamNoCredits': 'プロバイダアカウントのクレジットが不足しています。',
  'error.upstreamRateLimit': 'プロバイダのレート制限。少々お待ちください。',
  'error.unknown': '問題が発生しました。',

  'missing.heading': '前のステップが未完了',
  'missing.copyMissing': '先にコピーバリアントを選択してください。',
  'missing.copyImageMissing': '先にコピーと画像のバリアントを承認してください。',
  'missing.scriptMissing': '先にスクリプトを選択してください。',
  'missing.backToBrief': 'ブリーフへ戻る',
};

// PT / ES / FR / DE — minimal coverage for the highest-frequency keys.
// English fallback covers any miss until a full pass is done.
const PT: Dict = {
  'auth.heading': 'Entrar',
  'auth.username': 'Usuário',
  'auth.password': 'Senha',
  'auth.signIn': 'Entrar',
  'auth.invalid': 'Usuário e senha não correspondem.',
  'common.signOut': 'Sair',
  'common.retry': 'Tentar novamente',
  'common.close': 'Fechar',
  'common.refine': 'Refinar',
  'common.showMore': 'Mostrar mais variantes',
  'common.pickThis': 'Escolher esta',
  'common.selected': 'Selecionada ✓',
  'common.language': 'Idioma',
  'brief.heading': 'Três linhas, quatro ativos.',
  'brief.start': 'Iniciar',
  'image.heading': 'Escolha a imagem hero',
  'script.heading': 'Escolha o roteiro',
  'audio.heading': 'Escolha uma voz. Ouça.',
  'design.heading': 'Componente da landing page',
  'design.copyCode': 'Copiar código',
  'design.finish': 'Concluir — novo brief',
};

const ES: Dict = {
  'auth.heading': 'Iniciar sesión',
  'auth.username': 'Usuario',
  'auth.password': 'Contraseña',
  'auth.signIn': 'Iniciar sesión',
  'auth.invalid': 'Usuario y contraseña no coinciden.',
  'common.signOut': 'Cerrar sesión',
  'common.retry': 'Reintentar',
  'common.close': 'Cerrar',
  'common.refine': 'Refinar',
  'common.showMore': 'Mostrar más variantes',
  'common.pickThis': 'Elegir esta',
  'common.selected': 'Seleccionada ✓',
  'common.language': 'Idioma',
  'brief.heading': 'Tres líneas, cuatro activos.',
  'brief.start': 'Iniciar',
  'image.heading': 'Elige la imagen hero',
  'script.heading': 'Elige el guion',
  'audio.heading': 'Elige una voz. Escúchala.',
  'design.heading': 'Componente de landing page',
  'design.copyCode': 'Copiar código',
  'design.finish': 'Terminar — nuevo brief',
};

const FR: Dict = {
  'auth.heading': 'Connexion',
  'auth.username': "Nom d'utilisateur",
  'auth.password': 'Mot de passe',
  'auth.signIn': 'Se connecter',
  'auth.invalid': "Nom d'utilisateur et mot de passe incorrects.",
  'common.signOut': 'Se déconnecter',
  'common.retry': 'Réessayer',
  'common.close': 'Fermer',
  'common.refine': 'Affiner',
  'common.showMore': 'Plus de variantes',
  'common.pickThis': 'Choisir',
  'common.selected': 'Sélectionnée ✓',
  'common.language': 'Langue',
  'brief.heading': 'Trois lignes, quatre actifs.',
  'brief.start': 'Démarrer',
  'image.heading': "Choisis l'image hero",
  'script.heading': 'Choisis le script',
  'audio.heading': 'Choisis une voix. Écoute-la.',
  'design.heading': 'Composant landing page',
  'design.copyCode': 'Copier le code',
  'design.finish': 'Terminer — nouveau brief',
};

const DE: Dict = {
  'auth.heading': 'Anmelden',
  'auth.username': 'Benutzername',
  'auth.password': 'Passwort',
  'auth.signIn': 'Anmelden',
  'auth.invalid': 'Benutzername und Passwort stimmen nicht überein.',
  'common.signOut': 'Abmelden',
  'common.retry': 'Erneut versuchen',
  'common.close': 'Schließen',
  'common.refine': 'Verfeinern',
  'common.showMore': 'Weitere Varianten',
  'common.pickThis': 'Diese wählen',
  'common.selected': 'Ausgewählt ✓',
  'common.language': 'Sprache',
  'brief.heading': 'Drei Zeilen, vier Assets.',
  'brief.start': 'Starten',
  'image.heading': 'Wähle das Hero-Bild',
  'script.heading': 'Wähle das Skript',
  'audio.heading': 'Wähle eine Stimme. Höre sie an.',
  'design.heading': 'Landing-Page-Komponente',
  'design.copyCode': 'Code kopieren',
  'design.finish': 'Fertig — neuer Brief',
};

const DICTS: Record<Locale, Dict> = { en: EN, ja: JA, pt: PT, es: ES, fr: FR, de: DE };

const LOCALE_KEY = 'advert.locale';

function defaultLocale(): Locale {
  // No reliable navigator on RN; default to English. Set per-device on first
  // launch via the language picker.
  return 'en';
}

type LocaleStore = {
  locale: Locale;
  setLocale: (l: Locale) => Promise<void>;
  hydrate: () => Promise<void>;
};

export const useLocaleStore = create<LocaleStore>((set) => ({
  locale: defaultLocale(),
  setLocale: async (l) => {
    await AsyncStorage.setItem(LOCALE_KEY, l);
    set({ locale: l });
  },
  hydrate: async () => {
    const stored = await AsyncStorage.getItem(LOCALE_KEY);
    if (
      stored === 'en' ||
      stored === 'ja' ||
      stored === 'pt' ||
      stored === 'es' ||
      stored === 'fr' ||
      stored === 'de'
    ) {
      set({ locale: stored });
    }
  },
}));

function interpolate(s: string, vars?: Record<string, string | number>): string {
  if (!vars) return s;
  let out = s;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{${k}}`).join(String(v));
  }
  return out;
}

export function translate(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const dict = DICTS[locale] ?? EN;
  const value = dict[key] ?? EN[key] ?? key;
  return interpolate(value, vars);
}

export function useT(): (key: string, vars?: Record<string, string | number>) => string {
  const locale = useLocaleStore((s) => s.locale);
  return (key, vars) => translate(locale, key, vars);
}
