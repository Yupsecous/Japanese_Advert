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
  'app.title': 'Personify Ads',
  'app.version': 'v2',
  'app.newBrief': 'New brief',
  'app.settings': 'Settings',
  'app.language': 'Language',
  'app.brandActive': 'Brand on',
  'app.brandActiveTooltip': 'Brand dictionary is active. Click to edit.',

  // Stepper
  'stepper.step': 'Step',
  'step.audience': 'Audience',
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
    'Personify Ads will walk you through copy, image, script, and audio — one at a time.',
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
  'settings.keysSection': 'API keys',
  'settings.brandSection': 'Brand dictionary',
  'settings.generationSection': 'Generation quality',
  'settings.signOut': 'Sign out',

  // Generation quality
  'generation.imageQuality': 'Image quality tier',
  'generation.imageQualityNote':
    'Higher tiers route through better Flux models — visibly more photorealistic at higher cost. Default is fast.',
  'generation.tier.fast': 'Fast — Flux Schnell',
  'generation.tier.fast.desc':
    'Default. Cheapest and quickest. Good for iteration but the "AI look" is more visible.',
  'generation.tier.balanced': 'Balanced — Flux Dev',
  'generation.tier.balanced.desc':
    '28-step inference. Much cleaner faces, hands, and textures than Schnell. ~8× the cost.',
  'generation.tier.realistic': 'Realistic — Flux Pro 1.1',
  'generation.tier.realistic.desc':
    'Most photorealistic. Best skin, light falloff, and material detail. Use for hero shots that need to read as real.',
  'generation.videoProvider': 'Video provider',
  'generation.videoProviderNote':
    "Slideshow is free and uses your voiceover. AI motion is a silent 5s clip with real camera and subject motion — ships alongside the slideshow when enabled.",
  'generation.video.slideshow': 'Slideshow (Canvas + voiceover)',
  'generation.video.slideshow.desc':
    'Default. Ken Burns motion over hero images, synced to the approved voiceover. Free.',
  'generation.video.ai_kling': 'AI motion — Kling v1.6',
  'generation.video.ai_kling.desc':
    'Adds a silent 5-second real-motion clip per platform aspect, generated from the approved hero image. Ships alongside the slideshow.',

  // Auth — accounts (Google + email/password)
  'auth.heading': 'Sign in',
  'auth.subtitle': 'Sign in to your PersonifyAds account.',
  'auth.signupHeading': 'Create your account',
  'auth.signupSubtitle': 'Start directing AI-generated ad campaigns.',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.confirmPassword': 'Confirm password',
  'auth.displayName': 'Name (optional)',
  'auth.signIn': 'Sign in',
  'auth.signingIn': 'Signing in…',
  'auth.signUp': 'Create account',
  'auth.signingUp': 'Creating account…',
  'auth.googleSignIn': 'Continue with Google',
  'auth.or': 'or',
  'auth.noAccount': "Don't have an account?",
  'auth.haveAccount': 'Already have an account?',
  'auth.toSignup': 'Sign up',
  'auth.toLogin': 'Sign in',
  'auth.forgotLink': 'Forgot password?',
  'auth.forgotHeading': 'Reset your password',
  'auth.forgotSubtitle': "Enter your email and we'll send a reset link.",
  'auth.forgotCta': 'Send reset link',
  'auth.forgotSent': "If that email has an account, a reset link is on its way. Check your inbox.",
  'auth.backToLogin': '← Back to sign in',
  'auth.resetHeading': 'Choose a new password',
  'auth.resetCta': 'Set new password',
  'auth.resetDone': 'Your password has been reset. Sign in with your new password.',
  'auth.resetInvalid': 'This reset link is invalid or has expired. Request a new one.',
  'auth.verifyHeading': 'Check your email',
  'auth.verifyBody': 'We sent a verification link to {email}. Click it to activate your account, then sign in.',
  'auth.verifyResend': 'Resend verification email',
  'auth.verifyResent': 'Verification email sent.',
  'auth.verifiedBanner': 'Email verified — you can sign in now.',
  'auth.verifyFailedBanner': 'That verification link is invalid or has expired.',
  'auth.unverifiedError': 'Please verify your email first — check your inbox, or resend the link below.',
  'auth.invalidCredentials': "That email and password don't match.",
  'auth.rateLimited': 'Too many attempts. Wait a minute and try again.',
  'auth.googleError': "Google sign-in didn't complete. Please try again.",
  'auth.googleLinkError':
    'An account with this email already exists. Sign in with your password, then link Google from Settings.',
  'auth.passwordTooShort': 'Password must be at least 8 characters.',
  'auth.passwordMismatch': "Passwords don't match.",
  'auth.emailRequired': 'Enter a valid email address.',
  'auth.genericError': 'Something went wrong. Please try again.',
  'auth.loading': 'Loading…',
  'auth.account': 'Account',
  'auth.signedInAs': 'Signed in as',
  'auth.footnote': 'Your account secures access to generation. Provider keys are managed server-side.',

  // Subscription tiers
  'tier.redeemTitle': 'Have a Pro or Ultra key?',
  'tier.redeemPlaceholder': 'Paste tier key',
  'tier.redeemCta': 'Redeem',
  'tier.redeemSuccess': "You're on {tier} now.",
  'tier.redeemInvalid': "That key wasn't recognized.",
  'tier.platformLocked': 'Meta & X ads — Ultra only',
  'tier.platformLockedBody':
    'Platform-ready Meta and X ad exports are an Ultra feature. Redeem an Ultra key in Settings to unlock them.',

  // Audience Console (Phase 1)
  'audience.heading': 'Audience',
  'audience.subtitle':
    "Upload your customer list, or load the sample 100. Each record is converted into a personalized brief so downstream generation can be tuned to that specific recipient. Skip this step to run the campaign-level pipeline only.",
  'audience.uploadCta': 'Upload customer list (CSV or JSON)',
  'audience.loadSample': 'Load sample 100',
  'audience.clear': 'Clear list',
  'audience.skip': 'Skip — campaign brief only',
  'audience.approve': 'Approve & continue',
  'audience.convert': 'Convert to individual briefs',
  'audience.convertingProgress': '{completed} / {total} converted',
  'audience.convertingInFlight': '{inFlight} in flight',
  'audience.uploadHint':
    'CSV must have these columns: id, name, age, gender, location, segment, recentInterest, recentPurchase, socialSignalSummary. JSON is an array of objects with the same fields.',
  'audience.uploadError': "Couldn't read that file. Check column names and try again.",
  'audience.empty': 'No audience loaded.',
  'audience.summary': '{count} customer{s} loaded',
  'audience.convertedCount': '{converted} of {total} briefs ready',
  'audience.failed': '{n} brief{s} failed — check console for details',
  'audience.briefPreview': 'Brief preview',
  'audience.cardTone': 'Tone',
  'audience.cardFormat': 'Format',
  'audience.cardRationale': 'Why',
  'audience.keyMissingTitle': 'Anthropic key required',
  'audience.keyMissingBody':
    'Per-customer brief specialization uses Claude. Add your Anthropic key in Settings to continue, or click Skip to proceed with the campaign-level brief only.',

  // Phase 2 — Batch Generator
  'batch.heading': 'Batch generation',
  'batch.subtitle':
    'Generate a fully personalized copy + image + script for each customer in your audience slice. Each customer gets a different ad based on their individual brief.',
  'batch.size': 'Batch size',
  'batch.run': 'Generate {n} personalized ads',
  'batch.cancel': 'Cancel',
  'batch.clear': 'Clear assets',
  'batch.progress': '{completed} / {total} generated',
  'batch.inFlight': '{inFlight} in flight',
  'batch.eligible': '{n} eligible',
  'batch.previewLabel': '{n} personalized ads ready — click any card to expand',

  // Phase 3 — Distribution Simulator
  'dist.heading': 'Distribution',
  'dist.subtitle':
    "Channel is recommended per customer by Claude using their profile + signal. Delivery is simulated — no real network calls, just animated status overlays.",
  'dist.start': 'Start delivery ({n} customers)',
  'dist.redeliver': 'Re-deliver ({n})',
  'dist.running': 'Delivering…',
  'dist.delivered': '{delivered} of {total} delivered',
  'dist.clear': 'Clear delivery log',

  // Phase 4 — Effectiveness Dashboard
  'dash.heading': 'Effectiveness',
  'dash.subtitle':
    'Simulated KPIs with a built-in segment bias. The point is to surface "this segment + this format combination worked" — a finding the feedback loop can fold back into the brand voice.',
  'dash.regenerate': 'Regenerate data',
  'dash.view.kpi': 'KPI',
  'dash.view.heatmap': 'Heatmap',
  'dash.view.drilldown': 'Drill-down',
  'dash.kpi.delivered': 'Delivered',
  'dash.kpi.openRate': 'Open rate',
  'dash.kpi.clickRate': 'Click rate',
  'dash.kpi.convertRate': 'Conversion',
  'dash.upliftEyebrow': 'Personalization uplift',
  'dash.uplift': '{pct}% CVR lift vs. single-creative baseline',
  'dash.upliftBody':
    'Personalized: {personalized} conversion rate · single-creative baseline: {baseline} (simulated)',
  'dash.segment': 'Segment',
  'dash.heatmapNote':
    'Each cell shows CVR for that segment × format combination. Deeper teal = higher conversion.',
  'dash.drill.customer': 'Customer',
  'dash.drill.segment': 'Segment',
  'dash.drill.format': 'Format',
  'dash.drill.opened': 'Opened',
  'dash.drill.clicked': 'Clicked',
  'dash.drill.converted': 'Converted',
  'dash.drill.dropoff': 'Watch / drop-off',

  // Phase 5 — Feedback Loop
  'feedback.heading': 'Feedback loop',
  'feedback.subtitle':
    'Extract one actionable insight from this campaign\'s effectiveness data and fold it into the brand dictionary. The next generation run carries the lesson — all 8 generation paths read brand insights.',
  'feedback.run': 'Apply learnings to brand',
  'feedback.running': 'Extracting…',
  'feedback.runNote': 'Approx. 5 seconds. The result is appended to your brand dictionary.',
  'feedback.appliedLabel': 'Applied insights',
  'feedback.keyMissing': 'Anthropic key required — feedback uses Claude.',

  // Campaign report
  'report.heading': 'Download campaign report',
  'report.subtitle':
    'Single ZIP with executive summary, customer list, briefs, generated ads, delivery log, effectiveness data, segment heatmap, KPI summary, and applied insights — ready to share with stakeholders.',
  'report.download': 'Download report ZIP',
  'report.packaging': 'Packaging…',
  'report.fileCount': '{n} files',

  // Brand dictionary
  'brandSettings.heading': 'Brand voice & rules',
  'brandSettings.active': '{n} rule(s) active',
  'brandSettings.intro':
    'Optional. When set, these rules thread into every generation — copy, image, script, design, platform exports — to keep outputs consistent with your brand voice. Stored in this browser only.',
  'brandSettings.name': 'Brand name',
  'brandSettings.namePlaceholder': 'e.g. Lumen',
  'brandSettings.voice': 'Brand voice',
  'brandSettings.voicePlaceholder':
    'e.g. Plainspoken, confident, never preachy. Short clauses. No emoji. Specifics over abstractions.',
  'brandSettings.banned': 'Banned terms (one per line)',
  'brandSettings.bannedPlaceholder': 'unlock\nelevate\nleverage\nsynergy',
  'brandSettings.bannedHint': 'Terms the LLM must never use. Case-insensitive. Includes stems.',
  'brandSettings.preferred': 'Preferred terms (one per line)',
  'brandSettings.preferredPlaceholder': 'clarity\nfoundation\nanchor',
  'brandSettings.preferredHint': 'Terms to lean into when natural. The LLM will not force them.',
  'brandSettings.visualRules': 'Visual rules',
  'brandSettings.visualRulesPlaceholder':
    'e.g. No human faces. Earth-tone palette only. Natural daylight, no studio strobes.',
  'brandSettings.audience': 'Audience refinement',
  'brandSettings.audiencePlaceholder': 'e.g. Always assume B2B enterprise IT decision-makers.',
  'brandSettings.save': 'Save brand',
  'brandSettings.saved': 'Saved',
  'brandSettings.reset': 'Clear brand',
  'brandSettings.persistenceNote':
    'Saved to this browser only — never sent to a server, never shared across devices.',

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

  // Per-variant refine — inline action on each variant card
  'refineOne.openCopy': 'Refine this copy',
  'refineOne.openImage': 'Refine this image',
  'refineOne.openScript': 'Refine this script',
  'refineOne.placeholderCopy': 'e.g. softer headline, drop the buzzword',
  'refineOne.placeholderImage': 'e.g. tighter crop, warmer light',
  'refineOne.placeholderScript': 'e.g. punchier opener, slower pace',
  'refineOne.apply': 'Apply',
  'refineOne.cancel': 'Cancel',
  'refineOne.refining': 'Refining…',

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
  'image.tierBadge.fast': 'Fast',
  'image.tierBadge.balanced': 'Balanced',
  'image.tierBadge.realistic': 'Realistic',
  'image.tierBadgeTooltip': 'Image quality tier. Click to change in Settings.',
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
  'err.cost/cap-exceeded':
    "You've reached the usage limit for this session. It resets later — reach out if you need a higher cap.",
  'err.auth/session-expired': 'Your session has expired. Please sign in again.',
  'err.unknown':
    'Something went wrong. Try again — and if it keeps happening, open Settings.',

  // Platform exports (Meta + X)
  'platform.eyebrow': 'Ad platforms',
  'platform.heading': 'Platform-ready assets',
  'platform.subtitle':
    "Two-variant A/B copy plus paired images at every Meta and X aspect ratio. Optional Meta carousel cards and a slideshow video (Reels 9:16, X 1:1) for video placements. Each platform downloads as a single ZIP, character-budgeted and CTA-enum mapped.",
  'platform.generate': 'Generate Meta + X assets',
  'platform.regenerate': 'Regenerate everything',
  'platform.regenerateNote': 'Reruns image, copy, carousel, and video — counts as fresh API spend.',
  'platform.costNote':
    'Image pairs via fal.ai (~8s) · copy adaptation via Claude (~3s) · video encoded in-browser from the voiceover.',
  'platform.costEstimate':
    'Estimated spend at the current settings ({tier} · {videoMode}). Change in Settings to adjust quality vs cost.',
  'platform.progressCopy': 'Adapting A/B copy for Meta and X…',
  'platform.progressImages': 'Generating A/B image pairs at 1:1, 4:5, 9:16, 1.91:1…',
  'platform.progressCarousel': 'Generating Meta carousel cards…',
  'platform.progressVideo': 'Encoding slideshow video from your hero image + voiceover…',
  'platform.option.carousel': 'Include Meta carousel set (+3 image cards)',
  'platform.option.carouselNote':
    "Three 1:1 framings of the hero scene for Meta's multi-card ad format. Adds ~5s and 3 fal.ai calls.",
  'platform.option.video': 'Include slideshow videos (Reels 9:16, X 1:1)',
  'platform.option.videoNote':
    'Ken Burns animation over your hero image with the approved voiceover, encoded in your browser. No extra API cost.',
  'platform.option.videoNoAudio':
    'Video generation needs an approved voiceover from the audio step.',
  'platform.metaPlacements': 'Feed · Stories · Reels · Carousel',
  'platform.xPlacements': 'Timeline · Website card · Promoted video',
  'platform.videoForReels': 'Video — Meta Reels & Stories',
  'platform.videoForX': 'Video — X promoted tweet',
  'platform.videoNote':
    'Ken Burns slideshow over the approved hero image, synced to the approved voiceover. Drop directly into the Reels / Promoted-tweet uploader.',
  'platform.aiVideoForReels': 'AI motion clip — Meta Reels & Stories',
  'platform.aiVideoForX': 'AI motion clip — X promoted tweet',
  'platform.aiVideoNote':
    'Silent 5-second clip with real camera + subject motion (Kling v1.6). Ships alongside the slideshow as an alternate take — pick whichever performs better in your account.',
  'platform.carousel': 'Carousel cards',
  'platform.downloadMeta': 'Download Meta ZIP',
  'platform.downloadX': 'Download X ZIP',
  'platform.downloading': 'Packaging…',
  'platform.generatedAt': 'Generated',
  'platform.embeddedCount': '{n} image(s) embedded · {failed} missing',
  'platform.videoEmbedded': 'video included',
  'platform.carouselEmbedded': 'carousel: {n} cards',
  'platform.copyOverages': 'Character overages',
  'platform.restrictedTitle': 'Restricted-category notice',
  'platform.keysMissingTitle': 'Additional keys required',
  'platform.keyMissing.fal': 'fal.ai key (needed for additional aspect ratios and carousel cards)',
  'platform.keyMissing.ai': 'OpenAI or Anthropic key (needed for copy adaptation)',
};

const JA: Dict = {
  // App header
  'app.title': 'Personify Ads',
  'app.version': 'v2',
  'app.newBrief': '新しいブリーフ',
  'app.settings': '設定',
  'app.language': '言語',
  'app.brandActive': 'ブランド設定中',
  'app.brandActiveTooltip': 'ブランド辞書が適用中です。クリックして編集できます。',

  // Stepper
  'stepper.step': 'ステップ',
  'step.audience': '顧客',
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
    'Personify Ads がコピー・画像・スクリプト・音声を、一つずつ順番にご案内します。',
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
  'settings.keysSection': 'APIキー',
  'settings.brandSection': 'ブランド辞書',
  'settings.generationSection': '生成品質',
  'settings.signOut': 'サインアウト',

  'generation.imageQuality': '画像クオリティ',
  'generation.imageQualityNote':
    '上位ティアほど高品質なFluxモデルを使用します。よりフォトリアルになりますが、コストも増えます。既定はFastです。',
  'generation.tier.fast': 'Fast — Flux Schnell',
  'generation.tier.fast.desc':
    '既定。最安・最速。反復には十分ですが、AIっぽさは残ります。',
  'generation.tier.balanced': 'Balanced — Flux Dev',
  'generation.tier.balanced.desc':
    '28ステップ推論。顔、手、質感がSchnellよりかなりクリーン。コストは約8倍。',
  'generation.tier.realistic': 'Realistic — Flux Pro 1.1',
  'generation.tier.realistic.desc':
    '最もフォトリアル。肌、光の落ち方、素材感が最良。リアルに見せたいヒーローカットに。',
  'generation.videoProvider': '動画プロバイダ',
  'generation.videoProviderNote':
    'スライドショーは無料でナレーション付き。AIモーションは無音5秒の実モーションクリップで、有効時はスライドショーと並行して生成されます。',
  'generation.video.slideshow': 'スライドショー (Canvas + ナレーション)',
  'generation.video.slideshow.desc':
    '既定。ヒーロー画像のKen Burnsモーションを承認済みナレーションと同期。無料。',
  'generation.video.ai_kling': 'AIモーション — Kling v1.6',
  'generation.video.ai_kling.desc':
    '承認済みヒーロー画像からプラットフォーム別アスペクト比ごとに無音5秒の実モーションクリップを生成。スライドショーと併送されます。',

  // Auth — accounts (Google + email/password)
  'auth.heading': 'サインイン',
  'auth.subtitle': 'PersonifyAds アカウントにサインインしてください。',
  'auth.signupHeading': 'アカウントを作成',
  'auth.signupSubtitle': 'AI 生成の広告キャンペーンを始めましょう。',
  'auth.email': 'メールアドレス',
  'auth.password': 'パスワード',
  'auth.confirmPassword': 'パスワード（確認）',
  'auth.displayName': '名前（任意）',
  'auth.signIn': 'サインイン',
  'auth.signingIn': 'サインイン中…',
  'auth.signUp': 'アカウント作成',
  'auth.signingUp': '作成中…',
  'auth.googleSignIn': 'Google で続行',
  'auth.or': 'または',
  'auth.noAccount': 'アカウントをお持ちでないですか？',
  'auth.haveAccount': 'すでにアカウントをお持ちですか？',
  'auth.toSignup': '新規登録',
  'auth.toLogin': 'サインイン',
  'auth.forgotLink': 'パスワードをお忘れですか？',
  'auth.forgotHeading': 'パスワードをリセット',
  'auth.forgotSubtitle': 'メールアドレスを入力すると、リセットリンクをお送りします。',
  'auth.forgotCta': 'リセットリンクを送信',
  'auth.forgotSent': 'そのメールアドレスのアカウントが存在する場合、リセットリンクを送信しました。受信トレイをご確認ください。',
  'auth.backToLogin': '← サインインに戻る',
  'auth.resetHeading': '新しいパスワードを設定',
  'auth.resetCta': '新しいパスワードを設定',
  'auth.resetDone': 'パスワードをリセットしました。新しいパスワードでサインインしてください。',
  'auth.resetInvalid': 'このリセットリンクは無効か期限切れです。もう一度リクエストしてください。',
  'auth.verifyHeading': 'メールをご確認ください',
  'auth.verifyBody': '{email} に確認リンクを送信しました。リンクをクリックしてアカウントを有効化し、サインインしてください。',
  'auth.verifyResend': '確認メールを再送信',
  'auth.verifyResent': '確認メールを送信しました。',
  'auth.verifiedBanner': 'メールを確認しました。サインインできます。',
  'auth.verifyFailedBanner': 'この確認リンクは無効か期限切れです。',
  'auth.unverifiedError': '先にメールアドレスを確認してください。受信トレイをご確認いただくか、下のボタンから再送信してください。',
  'auth.invalidCredentials': 'メールアドレスまたはパスワードが一致しません。',
  'auth.rateLimited': '試行回数が多すぎます。少し待ってから再度お試しください。',
  'auth.googleError': 'Google サインインを完了できませんでした。もう一度お試しください。',
  'auth.googleLinkError': 'このメールアドレスのアカウントは既に存在します。パスワードでサインインし、設定から Google を連携してください。',
  'auth.passwordTooShort': 'パスワードは 8 文字以上である必要があります。',
  'auth.passwordMismatch': 'パスワードが一致しません。',
  'auth.emailRequired': '有効なメールアドレスを入力してください。',
  'auth.genericError': '問題が発生しました。もう一度お試しください。',
  'auth.loading': '読み込み中…',
  'auth.account': 'アカウント',
  'auth.signedInAs': 'サインイン中：',

  // Audience Console (Phase 1)
  'audience.heading': '顧客',
  'audience.subtitle':
    '顧客リストをアップロードするか、サンプル100名分をロードしてください。各レコードは個別ブリーフに変換され、後続の生成をその受信者に最適化できます。スキップするとキャンペーンブリーフのみで進めます。',
  'audience.uploadCta': '顧客リストをアップロード(CSV または JSON)',
  'audience.loadSample': 'サンプル100名分をロード',
  'audience.clear': 'リストをクリア',
  'audience.skip': 'スキップ — キャンペーンブリーフのみで進める',
  'audience.approve': '承認して次へ',
  'audience.convert': '個別ブリーフに変換',
  'audience.convertingProgress': '{completed} / {total} 件 変換完了',
  'audience.convertingInFlight': '{inFlight} 件 処理中',
  'audience.uploadHint':
    'CSV には以下の列が必要です: id, name, age, gender, location, segment, recentInterest, recentPurchase, socialSignalSummary。JSON は同じフィールドを持つオブジェクトの配列です。',
  'audience.uploadError': 'ファイルを読み込めませんでした。列名をご確認の上、もう一度お試しください。',
  'audience.empty': '顧客リストが読み込まれていません。',
  'audience.summary': '{count} 名の顧客を読み込みました',
  'audience.convertedCount': '{converted} / {total} 件のブリーフが準備済み',
  'audience.failed': '{n} 件のブリーフ変換に失敗しました — コンソールで詳細を確認してください',
  'audience.briefPreview': 'ブリーフ プレビュー',
  'audience.cardTone': 'トーン',
  'audience.cardFormat': 'フォーマット',
  'audience.cardRationale': '理由',
  'audience.keyMissingTitle': 'Anthropic キーが必要です',
  'audience.keyMissingBody':
    '顧客ごとのブリーフ特化には Claude を使用します。設定から Anthropic キーを追加していただくか、「スキップ」でキャンペーンブリーフのみで進めることもできます。',

  // Phase 2 — Batch Generator
  'batch.heading': '個別広告生成',
  'batch.subtitle':
    '対象顧客ごとに、個別ブリーフを元にしたコピー・画像・スクリプトを生成します。一人ひとり異なる広告ができあがります。',
  'batch.size': '生成数',
  'batch.run': '{n} 名分の個別広告を生成',
  'batch.cancel': 'キャンセル',
  'batch.clear': 'アセットをクリア',
  'batch.progress': '{completed} / {total} 件 生成完了',
  'batch.inFlight': '{inFlight} 件 処理中',
  'batch.eligible': '対象 {n} 名',
  'batch.previewLabel': '{n} 件の個別広告が準備済み — カードをクリックで詳細表示',

  // Phase 3 — Distribution Simulator
  'dist.heading': '配信シミュレーション',
  'dist.subtitle':
    '顧客プロフィールとシグナルから Claude が配信チャネルを推奨します。配信は実際のネットワーク呼び出しではなく、アニメーションで状態を可視化します。',
  'dist.start': '配信を開始({n} 名)',
  'dist.redeliver': '再配信({n} 名)',
  'dist.running': '配信中…',
  'dist.delivered': '{delivered} / {total} 名 配信完了',
  'dist.clear': '配信ログをクリア',

  // Phase 4 — Effectiveness Dashboard
  'dash.heading': '効果測定ダッシュボード',
  'dash.subtitle':
    'シミュレートされた KPI を、セグメントバイアスを織り込んで生成します。狙いは「このセグメント × このフォーマットが刺さった」を可視化すること。後段のフィードバックループでブランド辞書に反映できます。',
  'dash.regenerate': 'データを再生成',
  'dash.view.kpi': 'KPI',
  'dash.view.heatmap': 'ヒートマップ',
  'dash.view.drilldown': '個別ドリルダウン',
  'dash.kpi.delivered': '配信数',
  'dash.kpi.openRate': '開封率',
  'dash.kpi.clickRate': 'クリック率',
  'dash.kpi.convertRate': 'CVR',
  'dash.upliftEyebrow': '個別最適化リフト',
  'dash.uplift': '単一広告ベースライン比 CVR {pct}%',
  'dash.upliftBody':
    '個別配信: {personalized} のコンバージョン率 · 単一広告ベースライン: {baseline}(シミュレート値)',
  'dash.segment': 'セグメント',
  'dash.heatmapNote':
    '各セルは セグメント × フォーマット ごとの CVR を示します。色が濃いほど高コンバージョン。',
  'dash.drill.customer': '顧客',
  'dash.drill.segment': 'セグメント',
  'dash.drill.format': 'フォーマット',
  'dash.drill.opened': '開封',
  'dash.drill.clicked': 'クリック',
  'dash.drill.converted': 'CV',
  'dash.drill.dropoff': '視聴 / 離脱',

  // Phase 5 — Feedback Loop
  'feedback.heading': 'フィードバックループ',
  'feedback.subtitle':
    '今回のキャンペーンの効果データから、実行可能なインサイトを 1 つ抽出し、ブランド辞書に反映します。次回以降の生成では全 8 つのパスがこの学習を反映します。',
  'feedback.run': '学習をブランドに反映',
  'feedback.running': '抽出中…',
  'feedback.runNote': '約 5 秒で完了。結果はブランド辞書に追記されます。',
  'feedback.appliedLabel': '反映済みインサイト',
  'feedback.keyMissing': 'Anthropic キーが必要です — フィードバックは Claude を使用します。',

  // Campaign report
  'report.heading': 'キャンペーンレポートをダウンロード',
  'report.subtitle':
    'エグゼクティブサマリー・顧客リスト・個別ブリーフ・生成アセット・配信ログ・効果データ・セグメントヒートマップ・KPI サマリー・反映済みインサイトを 1 つの ZIP にまとめ、関係者と共有できます。',
  'report.download': 'レポート ZIP をダウンロード',
  'report.packaging': 'パッケージング中…',
  'report.fileCount': '{n} ファイル',

  'auth.footnote': 'アカウントにより生成機能へのアクセスが保護されます。プロバイダーキーはサーバー側で管理されます。',

  // Brand dictionary
  'brandSettings.heading': 'ブランドボイスとルール',
  'brandSettings.active': '{n} 件のルールが有効',
  'brandSettings.intro':
    'オプション。設定すると、コピー・画像・スクリプト・デザイン・プラットフォーム書き出しのすべての生成に反映され、ブランドボイスを統一できます。このブラウザ内のみに保存されます。',
  'brandSettings.name': 'ブランド名',
  'brandSettings.namePlaceholder': '例: Lumen',
  'brandSettings.voice': 'ブランドボイス',
  'brandSettings.voicePlaceholder':
    '例: 率直・自信・説教調にならない。短い節。絵文字なし。抽象より具体。',
  'brandSettings.banned': '使用禁止ワード(1行に1つ)',
  'brandSettings.bannedPlaceholder': '革新的\n圧倒的\n究極の\nシナジー',
  'brandSettings.bannedHint':
    'LLMが絶対に使ってはいけない語。大文字小文字を区別せず、語幹も対象。',
  'brandSettings.preferred': '推奨ワード(1行に1つ)',
  'brandSettings.preferredPlaceholder': '明快\n基盤\n軸',
  'brandSettings.preferredHint': '自然に使える場面で活かす語。無理に押し込めません。',
  'brandSettings.visualRules': 'ビジュアルルール',
  'brandSettings.visualRulesPlaceholder':
    '例: 人物の顔は出さない。アースカラーのみ。自然光のみで、スタジオストロボなし。',
  'brandSettings.audience': 'ターゲットの追加条件',
  'brandSettings.audiencePlaceholder': '例: 常にBtoB企業のIT意思決定者を想定する。',
  'brandSettings.save': 'ブランドを保存',
  'brandSettings.saved': '保存済み',
  'brandSettings.reset': 'ブランドをクリア',
  'brandSettings.persistenceNote':
    'このブラウザ内のみに保存されます。サーバーへ送信されず、端末間では共有されません。',

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

  // Per-variant refine — inline action on each variant card
  'refineOne.openCopy': 'このコピーを調整',
  'refineOne.openImage': 'この画像を調整',
  'refineOne.openScript': 'このスクリプトを調整',
  'refineOne.placeholderCopy': '例: 見出しをもう少し柔らかく、バズワードを抜く',
  'refineOne.placeholderImage': '例: クロップを寄せる、光をもっと温かく',
  'refineOne.placeholderScript': '例: 出だしを切れ味よく、ペースをゆっくり',
  'refineOne.apply': '反映',
  'refineOne.cancel': 'キャンセル',
  'refineOne.refining': '調整中…',

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
  'image.tierBadge.fast': 'Fast',
  'image.tierBadge.balanced': 'Balanced',
  'image.tierBadge.realistic': 'Realistic',
  'image.tierBadgeTooltip': '画像品質ティア。設定から変更できます。',
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

  // Platform exports (Meta + X)
  'platform.eyebrow': '広告プラットフォーム',
  'platform.heading': '広告プラットフォーム向け素材',
  'platform.subtitle':
    'A/B用の2バリアントコピーと、Meta・Xの各アスペクト比のペア画像を生成します。任意でMetaカルーセル用カードとスライドショー動画(Reels 9:16・X 1:1)も生成。各プラットフォームを1つのZIPとしてダウンロードでき、文字数制限とCTA列挙値に対応済みです。',
  'platform.generate': 'Meta + X 素材を生成',
  'platform.regenerate': 'すべて再生成',
  'platform.regenerateNote': '画像・コピー・カルーセル・動画をすべて再生成します。API料金が再度発生します。',
  'platform.costNote':
    'fal.aiでペア画像を生成(約8秒) · Claudeでコピー調整(約3秒) · 動画はブラウザ内でボイスオーバーから生成。',
  'platform.costEstimate':
    '現在の設定での想定コスト({tier} · {videoMode})。品質とコストのバランスは設定から変更できます。',
  'platform.progressCopy': 'Meta と X 向けに A/B コピーを調整中…',
  'platform.progressImages': '1:1, 4:5, 9:16, 1.91:1 の A/B 画像ペアを生成中…',
  'platform.progressCarousel': 'Metaカルーセル用カードを生成中…',
  'platform.progressVideo': 'ヒーロー画像とボイスオーバーからスライドショー動画をエンコード中…',
  'platform.option.carousel': 'Metaカルーセルセットを含める(+3枚)',
  'platform.option.carouselNote':
    'Metaのカルーセル形式向けに、ヒーローシーンを異なる3つのフレーミングで生成します。約5秒と fal.ai 3回の呼び出しが追加されます。',
  'platform.option.video': 'スライドショー動画を含める(Reels 9:16・X 1:1)',
  'platform.option.videoNote':
    '承認済み画像にKen Burns風のアニメーションを適用し、承認済みボイスオーバーと合わせてブラウザ内でエンコードします。追加のAPIコストはかかりません。',
  'platform.option.videoNoAudio':
    '動画生成には音声ステップで承認済みのボイスオーバーが必要です。',
  'platform.metaPlacements': 'フィード · ストーリーズ · リール · カルーセル',
  'platform.xPlacements': 'タイムライン · ウェブサイトカード · プロモ動画',
  'platform.videoForReels': '動画 — Meta Reels と Stories',
  'platform.videoForX': '動画 — X プロモーションツイート',
  'platform.videoNote':
    '承認済みヒーロー画像のKen Burnsスライドショーに、承認済みボイスオーバーを同期しています。Reels・プロモツイートのアップローダーにそのまま投入できます。',
  'platform.aiVideoForReels': 'AIモーションクリップ — Meta Reels と Stories',
  'platform.aiVideoForX': 'AIモーションクリップ — X プロモーションツイート',
  'platform.aiVideoNote':
    '実際のカメラ・被写体モーションを伴う無音5秒クリップ (Kling v1.6)。スライドショーと並行して同梱されます — アカウントで成績の良い方を選択してください。',
  'platform.carousel': 'カルーセルカード',
  'platform.downloadMeta': 'Meta ZIP をダウンロード',
  'platform.downloadX': 'X ZIP をダウンロード',
  'platform.downloading': 'パッケージング中…',
  'platform.generatedAt': '生成時刻',
  'platform.embeddedCount': '{n} 枚を埋め込み · {failed} 枚不足',
  'platform.videoEmbedded': '動画を同梱',
  'platform.carouselEmbedded': 'カルーセル: {n} 枚',
  'platform.copyOverages': '文字数超過',
  'platform.restrictedTitle': '規制対象カテゴリの注意',
  'platform.keysMissingTitle': '追加のキーが必要です',
  'platform.keyMissing.fal': 'fal.ai キー(追加のアスペクト比とカルーセル生成に必要)',
  'platform.keyMissing.ai': 'OpenAI または Anthropic キー(コピー調整に必要)',
};

const PT: Dict = {
  // App header
  'app.title': 'Personify Ads',
  'app.version': 'v2',
  'app.newBrief': 'Novo briefing',
  'app.settings': 'Configurações',
  'app.language': 'Idioma',
  'app.brandActive': 'Marca ativa',
  'app.brandActiveTooltip': 'Dicionário de marca ativo. Clique para editar.',

  // Stepper
  'stepper.step': 'Etapa',
  'step.audience': 'Público',
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
    'O Personify Ads vai conduzir você por texto, imagem, roteiro e áudio — uma etapa por vez.',
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
  'settings.keysSection': 'Chaves de API',
  'settings.brandSection': 'Dicionário de marca',
  'settings.generationSection': 'Qualidade de geração',
  'settings.signOut': 'Sair',

  'generation.imageQuality': 'Tier de qualidade de imagem',
  'generation.imageQualityNote':
    'Tiers mais altos roteiam por modelos Flux melhores — visivelmente mais fotorrealistas com custo maior. Padrão é fast.',
  'generation.tier.fast': 'Fast — Flux Schnell',
  'generation.tier.fast.desc':
    'Padrão. Mais barato e rápido. Bom para iteração, mas o "ar de IA" é mais visível.',
  'generation.tier.balanced': 'Balanced — Flux Dev',
  'generation.tier.balanced.desc':
    'Inferência de 28 passos. Rostos, mãos e texturas muito mais limpos que Schnell. ~8× o custo.',
  'generation.tier.realistic': 'Realistic — Flux Pro 1.1',
  'generation.tier.realistic.desc':
    'Mais fotorrealista. Melhor pele, queda de luz e detalhe de material. Use para hero shots que precisam parecer reais.',
  'generation.videoProvider': 'Provedor de vídeo',
  'generation.videoProviderNote':
    'Slideshow é gratuito e usa sua locução. Movimento AI é um clipe silencioso de 5s com câmera e sujeito reais — sai junto com o slideshow quando habilitado.',
  'generation.video.slideshow': 'Slideshow (Canvas + locução)',
  'generation.video.slideshow.desc':
    'Padrão. Movimento Ken Burns sobre imagens hero, sincronizado com a locução aprovada. Gratuito.',
  'generation.video.ai_kling': 'Movimento AI — Kling v1.6',
  'generation.video.ai_kling.desc':
    'Adiciona um clipe silencioso de 5 segundos com movimento real por aspecto de plataforma, gerado a partir da imagem hero aprovada. Sai junto com o slideshow.',

  // Auth — accounts (Google + email/password)
  'auth.heading': 'Entrar',
  'auth.subtitle': 'Entre na sua conta PersonifyAds.',
  'auth.signupHeading': 'Crie sua conta',
  'auth.signupSubtitle': 'Comece a dirigir campanhas de anúncios geradas por IA.',
  'auth.email': 'E-mail',
  'auth.password': 'Senha',
  'auth.confirmPassword': 'Confirmar senha',
  'auth.displayName': 'Nome (opcional)',
  'auth.signIn': 'Entrar',
  'auth.signingIn': 'Entrando…',
  'auth.signUp': 'Criar conta',
  'auth.signingUp': 'Criando conta…',
  'auth.googleSignIn': 'Continuar com Google',
  'auth.or': 'ou',
  'auth.noAccount': 'Não tem uma conta?',
  'auth.haveAccount': 'Já tem uma conta?',
  'auth.toSignup': 'Cadastre-se',
  'auth.toLogin': 'Entrar',
  'auth.forgotLink': 'Esqueceu a senha?',
  'auth.forgotHeading': 'Redefinir sua senha',
  'auth.forgotSubtitle': 'Digite seu e-mail e enviaremos um link de redefinição.',
  'auth.forgotCta': 'Enviar link de redefinição',
  'auth.forgotSent': 'Se houver uma conta com esse e-mail, o link de redefinição está a caminho. Verifique sua caixa de entrada.',
  'auth.backToLogin': '← Voltar para entrar',
  'auth.resetHeading': 'Escolha uma nova senha',
  'auth.resetCta': 'Definir nova senha',
  'auth.resetDone': 'Sua senha foi redefinida. Entre com a nova senha.',
  'auth.resetInvalid': 'Este link de redefinição é inválido ou expirou. Solicite um novo.',
  'auth.verifyHeading': 'Verifique seu e-mail',
  'auth.verifyBody': 'Enviamos um link de verificação para {email}. Clique nele para ativar sua conta e depois entre.',
  'auth.verifyResend': 'Reenviar e-mail de verificação',
  'auth.verifyResent': 'E-mail de verificação enviado.',
  'auth.verifiedBanner': 'E-mail verificado — você já pode entrar.',
  'auth.verifyFailedBanner': 'Esse link de verificação é inválido ou expirou.',
  'auth.unverifiedError': 'Verifique seu e-mail primeiro — confira a caixa de entrada ou reenvie o link abaixo.',
  'auth.invalidCredentials': 'E-mail e senha não conferem.',
  'auth.rateLimited': 'Muitas tentativas. Aguarde um minuto e tente novamente.',
  'auth.googleError': 'O login com Google não foi concluído. Tente novamente.',
  'auth.googleLinkError': 'Já existe uma conta com este e-mail. Entre com sua senha e depois vincule o Google nas Configurações.',
  'auth.passwordTooShort': 'A senha deve ter pelo menos 8 caracteres.',
  'auth.passwordMismatch': 'As senhas não coincidem.',
  'auth.emailRequired': 'Digite um e-mail válido.',
  'auth.genericError': 'Algo deu errado. Tente novamente.',
  'auth.loading': 'Carregando…',
  'auth.account': 'Conta',
  'auth.signedInAs': 'Conectado como',

  // Audience Console (Phase 1)
  'audience.heading': 'Público',
  'audience.subtitle':
    'Envie sua lista de clientes ou carregue os 100 de amostra. Cada registro é convertido em um briefing personalizado para que a geração subsequente seja ajustada a esse destinatário. Pule esta etapa para usar apenas o briefing de campanha.',
  'audience.uploadCta': 'Enviar lista de clientes (CSV ou JSON)',
  'audience.loadSample': 'Carregar 100 de amostra',
  'audience.clear': 'Limpar lista',
  'audience.skip': 'Pular — apenas briefing de campanha',
  'audience.approve': 'Aprovar e continuar',
  'audience.convert': 'Converter em briefings individuais',
  'audience.convertingProgress': '{completed} / {total} convertidos',
  'audience.convertingInFlight': '{inFlight} em andamento',
  'audience.uploadHint':
    'O CSV precisa destas colunas: id, name, age, gender, location, segment, recentInterest, recentPurchase, socialSignalSummary. O JSON é um array de objetos com os mesmos campos.',
  'audience.uploadError': 'Não consegui ler esse arquivo. Verifique os nomes das colunas e tente novamente.',
  'audience.empty': 'Nenhuma lista de público carregada.',
  'audience.summary': '{count} cliente(s) carregado(s)',
  'audience.convertedCount': '{converted} de {total} briefings prontos',
  'audience.failed': '{n} briefing(s) falharam — verifique o console',
  'audience.briefPreview': 'Pré-visualização do briefing',
  'audience.cardTone': 'Tom',
  'audience.cardFormat': 'Formato',
  'audience.cardRationale': 'Por quê',
  'audience.keyMissingTitle': 'Chave Anthropic necessária',
  'audience.keyMissingBody':
    'A especialização de briefing por cliente usa Claude. Adicione sua chave Anthropic em Configurações ou clique em Pular para continuar apenas com o briefing de campanha.',

  // Phase 2 — Batch Generator
  'batch.heading': 'Geração em lote',
  'batch.subtitle':
    'Gera texto + imagem + roteiro totalmente personalizados para cada cliente. Cada cliente recebe um anúncio diferente, baseado em seu briefing individual.',
  'batch.size': 'Tamanho do lote',
  'batch.run': 'Gerar {n} anúncios personalizados',
  'batch.cancel': 'Cancelar',
  'batch.clear': 'Limpar ativos',
  'batch.progress': '{completed} / {total} gerados',
  'batch.inFlight': '{inFlight} em andamento',
  'batch.eligible': '{n} elegíveis',
  'batch.previewLabel': '{n} anúncios personalizados prontos — clique para expandir',

  // Phase 3 — Distribution
  'dist.heading': 'Distribuição',
  'dist.subtitle':
    'O canal é recomendado por cliente pelo Claude usando o perfil + sinal. A entrega é simulada — sem chamadas de rede reais, só animação de status.',
  'dist.start': 'Iniciar entrega ({n} clientes)',
  'dist.redeliver': 'Reentregar ({n})',
  'dist.running': 'Entregando…',
  'dist.delivered': '{delivered} de {total} entregues',
  'dist.clear': 'Limpar log',

  // Phase 4 — Effectiveness
  'dash.heading': 'Efetividade',
  'dash.subtitle':
    'KPIs simulados com viés de segmento embutido. O objetivo é mostrar "este segmento + este formato funcionou" — uma descoberta que o feedback loop reincorpora à voz da marca.',
  'dash.regenerate': 'Regenerar dados',
  'dash.view.kpi': 'KPI',
  'dash.view.heatmap': 'Heatmap',
  'dash.view.drilldown': 'Detalhamento',
  'dash.kpi.delivered': 'Entregues',
  'dash.kpi.openRate': 'Taxa de abertura',
  'dash.kpi.clickRate': 'Taxa de cliques',
  'dash.kpi.convertRate': 'Conversão',
  'dash.upliftEyebrow': 'Ganho da personalização',
  'dash.uplift': '+{pct}% de CVR vs. criativo único',
  'dash.upliftBody':
    'Personalizado: {personalized} de conversão · base criativo único: {baseline} (simulado)',
  'dash.segment': 'Segmento',
  'dash.heatmapNote':
    'Cada célula mostra CVR para o cruzamento segmento × formato. Verde-azulado mais profundo = maior conversão.',
  'dash.drill.customer': 'Cliente',
  'dash.drill.segment': 'Segmento',
  'dash.drill.format': 'Formato',
  'dash.drill.opened': 'Abriu',
  'dash.drill.clicked': 'Clicou',
  'dash.drill.converted': 'Converteu',
  'dash.drill.dropoff': 'Visualização / saída',

  // Phase 5 — Feedback
  'feedback.heading': 'Loop de feedback',
  'feedback.subtitle':
    'Extrai um insight acionável dos dados de efetividade e o anexa ao dicionário de marca. A próxima geração carrega o aprendizado em todas as 8 rotas.',
  'feedback.run': 'Aplicar aprendizados à marca',
  'feedback.running': 'Extraindo…',
  'feedback.runNote': '~5 segundos. O resultado é anexado ao dicionário de marca.',
  'feedback.appliedLabel': 'Insights aplicados',
  'feedback.keyMissing': 'Chave Anthropic necessária — o feedback usa Claude.',

  // Campaign report
  'report.heading': 'Baixar relatório de campanha',
  'report.subtitle':
    'ZIP único com sumário executivo, lista de clientes, briefings, anúncios gerados, log de entrega, dados de efetividade, heatmap, KPIs e insights aplicados — pronto para compartilhar com stakeholders.',
  'report.download': 'Baixar ZIP do relatório',
  'report.packaging': 'Empacotando…',
  'report.fileCount': '{n} arquivos',

  'auth.footnote':
    'O acesso é compartilhado pelo seu contato. As credenciais são verificadas no navegador — esta é uma barreira leve, não uma proteção de segurança.',

  // Brand dictionary
  'brandSettings.heading': 'Voz e regras da marca',
  'brandSettings.active': '{n} regra(s) ativa(s)',
  'brandSettings.intro':
    'Opcional. Quando definido, essas regras são aplicadas em todas as gerações — texto, imagem, roteiro, design, exports de plataforma — para manter as saídas alinhadas à voz da marca. Armazenado apenas neste navegador.',
  'brandSettings.name': 'Nome da marca',
  'brandSettings.namePlaceholder': 'ex.: Lumen',
  'brandSettings.voice': 'Voz da marca',
  'brandSettings.voicePlaceholder':
    'ex.: Direta, confiante, nunca moralista. Frases curtas. Sem emoji. Específico antes do abstrato.',
  'brandSettings.banned': 'Termos banidos (um por linha)',
  'brandSettings.bannedPlaceholder': 'desbloqueie\nelevar\nsinergia\nrevolucionário',
  'brandSettings.bannedHint':
    'Termos que o LLM nunca deve usar. Sem distinção de maiúsculas/minúsculas. Inclui radicais.',
  'brandSettings.preferred': 'Termos preferidos (um por linha)',
  'brandSettings.preferredPlaceholder': 'clareza\nbase\nâncora',
  'brandSettings.preferredHint': 'Termos para usar quando natural. O LLM não os forçará.',
  'brandSettings.visualRules': 'Regras visuais',
  'brandSettings.visualRulesPlaceholder':
    'ex.: Sem rostos humanos. Apenas tons terrosos. Luz natural, sem estúdio.',
  'brandSettings.audience': 'Refinamento de público',
  'brandSettings.audiencePlaceholder':
    'ex.: Sempre assumir contexto B2B enterprise.',
  'brandSettings.save': 'Salvar marca',
  'brandSettings.saved': 'Salvo',
  'brandSettings.reset': 'Limpar marca',
  'brandSettings.persistenceNote':
    'Salvo apenas neste navegador — nunca enviado a um servidor, nunca compartilhado entre dispositivos.',

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

  // Per-variant refine
  'refineOne.openCopy': 'Refinar este texto',
  'refineOne.openImage': 'Refinar esta imagem',
  'refineOne.openScript': 'Refinar este roteiro',
  'refineOne.placeholderCopy': 'ex.: título mais suave, sem buzzwords',
  'refineOne.placeholderImage': 'ex.: enquadramento mais fechado, luz mais quente',
  'refineOne.placeholderScript': 'ex.: abertura mais incisiva, ritmo mais lento',
  'refineOne.apply': 'Aplicar',
  'refineOne.cancel': 'Cancelar',
  'refineOne.refining': 'Refinando…',

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
  'image.tierBadge.fast': 'Fast',
  'image.tierBadge.balanced': 'Balanced',
  'image.tierBadge.realistic': 'Realistic',
  'image.tierBadgeTooltip': 'Nível de qualidade de imagem. Clique para alterar nas Configurações.',
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

  // Platform exports (Meta + X)
  'platform.eyebrow': 'Plataformas de anúncios',
  'platform.heading': 'Ativos prontos para plataforma',
  'platform.subtitle':
    'Texto A/B em duas variantes mais pares de imagens em todos os aspectos do Meta e X. Cartões de carrossel Meta opcionais e vídeo slideshow (Reels 9:16, X 1:1) para colocações em vídeo. Cada plataforma é baixada como um ZIP único, com limites de caracteres verificados e CTA mapeado para enum.',
  'platform.generate': 'Gerar ativos Meta + X',
  'platform.regenerate': 'Regerar tudo',
  'platform.regenerateNote': 'Regenera imagens, texto, carrossel e vídeo — conta como novo uso de API.',
  'platform.costNote':
    'Pares de imagem via fal.ai (~8s) · adaptação de texto via Claude (~3s) · vídeo codificado no navegador a partir da locução.',
  'platform.costEstimate':
    'Gasto estimado nas configurações atuais ({tier} · {videoMode}). Altere nas Configurações para ajustar qualidade vs custo.',
  'platform.progressCopy': 'Adaptando texto A/B para Meta e X…',
  'platform.progressImages': 'Gerando pares A/B em 1:1, 4:5, 9:16, 1.91:1…',
  'platform.progressCarousel': 'Gerando cartões de carrossel Meta…',
  'platform.progressVideo': 'Codificando vídeo slideshow a partir da imagem hero + locução…',
  'platform.option.carousel': 'Incluir conjunto de carrossel Meta (+3 cartões)',
  'platform.option.carouselNote':
    'Três enquadramentos 1:1 da cena hero para o formato carrossel do Meta. Adiciona ~5s e 3 chamadas fal.ai.',
  'platform.option.video': 'Incluir vídeos slideshow (Reels 9:16, X 1:1)',
  'platform.option.videoNote':
    'Animação Ken Burns sobre a imagem hero com a locução aprovada, codificada no navegador. Sem custo extra de API.',
  'platform.option.videoNoAudio':
    'A geração de vídeo precisa de uma locução aprovada na etapa de áudio.',
  'platform.metaPlacements': 'Feed · Stories · Reels · Carrossel',
  'platform.xPlacements': 'Timeline · Website card · Vídeo promovido',
  'platform.videoForReels': 'Vídeo — Meta Reels e Stories',
  'platform.videoForX': 'Vídeo — Tweet promovido X',
  'platform.videoNote':
    'Slideshow Ken Burns sobre a imagem hero, sincronizado com a locução aprovada. Carregue direto no uploader de Reels ou tweet promovido.',
  'platform.aiVideoForReels': 'Clipe de movimento AI — Meta Reels e Stories',
  'platform.aiVideoForX': 'Clipe de movimento AI — Tweet promovido X',
  'platform.aiVideoNote':
    'Clipe silencioso de 5 segundos com movimento real de câmera e sujeito (Kling v1.6). Sai junto com o slideshow como tomada alternativa — escolha o que tiver melhor desempenho na sua conta.',
  'platform.carousel': 'Cartões do carrossel',
  'platform.downloadMeta': 'Baixar ZIP do Meta',
  'platform.downloadX': 'Baixar ZIP do X',
  'platform.downloading': 'Empacotando…',
  'platform.generatedAt': 'Gerado',
  'platform.embeddedCount': '{n} imagem(ns) embutida(s) · {failed} ausente(s)',
  'platform.videoEmbedded': 'vídeo incluído',
  'platform.carouselEmbedded': 'carrossel: {n} cartões',
  'platform.copyOverages': 'Excessos de caracteres',
  'platform.restrictedTitle': 'Aviso de categoria restrita',
  'platform.keysMissingTitle': 'Chaves adicionais necessárias',
  'platform.keyMissing.fal': 'Chave fal.ai (necessária para aspectos adicionais e cartões de carrossel)',
  'platform.keyMissing.ai': 'Chave OpenAI ou Anthropic (necessária para adaptação de texto)',
};

const ES: Dict = {
  // App header
  'app.title': 'Personify Ads',
  'app.version': 'v2',
  'app.newBrief': 'Nuevo brief',
  'app.settings': 'Ajustes',
  'app.language': 'Idioma',
  'app.brandActive': 'Marca activa',
  'app.brandActiveTooltip': 'Diccionario de marca activo. Haz clic para editar.',

  // Stepper
  'stepper.step': 'Paso',
  'step.audience': 'Audiencia',
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
    'Personify Ads te guiará por texto, imagen, guion y audio — un paso a la vez.',
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
  'settings.keysSection': 'Claves de API',
  'settings.brandSection': 'Diccionario de marca',
  'settings.generationSection': 'Calidad de generación',
  'settings.signOut': 'Cerrar sesión',

  'generation.imageQuality': 'Nivel de calidad de imagen',
  'generation.imageQualityNote':
    'Niveles superiores usan modelos Flux mejores — visiblemente más fotorrealistas con mayor coste. Por defecto: fast.',
  'generation.tier.fast': 'Fast — Flux Schnell',
  'generation.tier.fast.desc':
    'Por defecto. Lo más barato y rápido. Bueno para iterar, pero el "aire de IA" es más visible.',
  'generation.tier.balanced': 'Balanced — Flux Dev',
  'generation.tier.balanced.desc':
    'Inferencia de 28 pasos. Rostros, manos y texturas mucho más limpios que Schnell. ~8× el coste.',
  'generation.tier.realistic': 'Realistic — Flux Pro 1.1',
  'generation.tier.realistic.desc':
    'Lo más fotorrealista. Mejor piel, caída de luz y detalle de material. Usa para hero shots que necesitan parecer reales.',
  'generation.videoProvider': 'Proveedor de video',
  'generation.videoProviderNote':
    'Slideshow es gratis y usa tu locución. Movimiento IA es un clip silencioso de 5s con cámara y sujeto reales — se entrega junto con el slideshow cuando se activa.',
  'generation.video.slideshow': 'Slideshow (Canvas + locución)',
  'generation.video.slideshow.desc':
    'Por defecto. Movimiento Ken Burns sobre imágenes hero, sincronizado con la locución aprobada. Gratis.',
  'generation.video.ai_kling': 'Movimiento IA — Kling v1.6',
  'generation.video.ai_kling.desc':
    'Añade un clip silencioso de 5 segundos con movimiento real por cada aspecto de plataforma, generado a partir de la imagen hero aprobada. Se entrega junto con el slideshow.',

  // Auth — accounts (Google + email/password)
  'auth.heading': 'Iniciar sesión',
  'auth.subtitle': 'Inicia sesión en tu cuenta de PersonifyAds.',
  'auth.signupHeading': 'Crea tu cuenta',
  'auth.signupSubtitle': 'Empieza a dirigir campañas de anuncios generadas por IA.',
  'auth.email': 'Correo electrónico',
  'auth.password': 'Contraseña',
  'auth.confirmPassword': 'Confirmar contraseña',
  'auth.displayName': 'Nombre (opcional)',
  'auth.signIn': 'Iniciar sesión',
  'auth.signingIn': 'Iniciando sesión…',
  'auth.signUp': 'Crear cuenta',
  'auth.signingUp': 'Creando cuenta…',
  'auth.googleSignIn': 'Continuar con Google',
  'auth.or': 'o',
  'auth.noAccount': '¿No tienes una cuenta?',
  'auth.haveAccount': '¿Ya tienes una cuenta?',
  'auth.toSignup': 'Regístrate',
  'auth.toLogin': 'Iniciar sesión',
  'auth.forgotLink': '¿Olvidaste tu contraseña?',
  'auth.forgotHeading': 'Restablece tu contraseña',
  'auth.forgotSubtitle': 'Ingresa tu correo y te enviaremos un enlace para restablecerla.',
  'auth.forgotCta': 'Enviar enlace de restablecimiento',
  'auth.forgotSent': 'Si existe una cuenta con ese correo, el enlace de restablecimiento está en camino. Revisa tu bandeja de entrada.',
  'auth.backToLogin': '← Volver a iniciar sesión',
  'auth.resetHeading': 'Elige una nueva contraseña',
  'auth.resetCta': 'Establecer nueva contraseña',
  'auth.resetDone': 'Tu contraseña se ha restablecido. Inicia sesión con la nueva contraseña.',
  'auth.resetInvalid': 'Este enlace de restablecimiento no es válido o ha caducado. Solicita uno nuevo.',
  'auth.verifyHeading': 'Revisa tu correo',
  'auth.verifyBody': 'Enviamos un enlace de verificación a {email}. Haz clic en él para activar tu cuenta y luego inicia sesión.',
  'auth.verifyResend': 'Reenviar correo de verificación',
  'auth.verifyResent': 'Correo de verificación enviado.',
  'auth.verifiedBanner': 'Correo verificado: ya puedes iniciar sesión.',
  'auth.verifyFailedBanner': 'Ese enlace de verificación no es válido o ha caducado.',
  'auth.unverifiedError': 'Primero verifica tu correo: revisa tu bandeja de entrada o reenvía el enlace abajo.',
  'auth.invalidCredentials': 'El correo y la contraseña no coinciden.',
  'auth.rateLimited': 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.',
  'auth.googleError': 'No se completó el inicio de sesión con Google. Inténtalo de nuevo.',
  'auth.googleLinkError': 'Ya existe una cuenta con este correo. Inicia sesión con tu contraseña y luego vincula Google en Configuración.',
  'auth.passwordTooShort': 'La contraseña debe tener al menos 8 caracteres.',
  'auth.passwordMismatch': 'Las contraseñas no coinciden.',
  'auth.emailRequired': 'Ingresa un correo electrónico válido.',
  'auth.genericError': 'Algo salió mal. Inténtalo de nuevo.',
  'auth.loading': 'Cargando…',
  'auth.account': 'Cuenta',
  'auth.signedInAs': 'Sesión iniciada como',

  // Audience Console (Phase 1)
  'audience.heading': 'Audiencia',
  'audience.subtitle':
    'Sube tu lista de clientes o carga los 100 de muestra. Cada registro se convierte en un brief personalizado para que la generación posterior se ajuste a ese destinatario. Omite este paso para usar solo el brief de campaña.',
  'audience.uploadCta': 'Subir lista de clientes (CSV o JSON)',
  'audience.loadSample': 'Cargar 100 de muestra',
  'audience.clear': 'Limpiar lista',
  'audience.skip': 'Omitir — solo brief de campaña',
  'audience.approve': 'Aprobar y continuar',
  'audience.convert': 'Convertir en briefs individuales',
  'audience.convertingProgress': '{completed} / {total} convertidos',
  'audience.convertingInFlight': '{inFlight} en curso',
  'audience.uploadHint':
    'El CSV debe tener estas columnas: id, name, age, gender, location, segment, recentInterest, recentPurchase, socialSignalSummary. JSON es un array de objetos con los mismos campos.',
  'audience.uploadError': 'No pude leer ese archivo. Verifica los nombres de columnas e inténtalo de nuevo.',
  'audience.empty': 'No hay audiencia cargada.',
  'audience.summary': '{count} cliente(s) cargado(s)',
  'audience.convertedCount': '{converted} de {total} briefs listos',
  'audience.failed': '{n} brief(s) fallaron — revisa la consola',
  'audience.briefPreview': 'Vista previa del brief',
  'audience.cardTone': 'Tono',
  'audience.cardFormat': 'Formato',
  'audience.cardRationale': 'Por qué',
  'audience.keyMissingTitle': 'Se requiere clave Anthropic',
  'audience.keyMissingBody':
    'La especialización por cliente usa Claude. Añade tu clave Anthropic en Ajustes, o pulsa Omitir para continuar solo con el brief de campaña.',

  // Phase 2 — Batch Generator
  'batch.heading': 'Generación por lotes',
  'batch.subtitle':
    'Genera texto + imagen + guion totalmente personalizados para cada cliente. Cada uno recibe un anuncio distinto basado en su brief individual.',
  'batch.size': 'Tamaño del lote',
  'batch.run': 'Generar {n} anuncios personalizados',
  'batch.cancel': 'Cancelar',
  'batch.clear': 'Limpiar activos',
  'batch.progress': '{completed} / {total} generados',
  'batch.inFlight': '{inFlight} en curso',
  'batch.eligible': '{n} elegibles',
  'batch.previewLabel': '{n} anuncios personalizados listos — clic para expandir',

  // Phase 3 — Distribution
  'dist.heading': 'Distribución',
  'dist.subtitle':
    'Claude recomienda el canal por cliente usando perfil + señal. La entrega se simula — sin llamadas reales, solo animación de estado.',
  'dist.start': 'Iniciar entrega ({n} clientes)',
  'dist.redeliver': 'Reenviar ({n})',
  'dist.running': 'Entregando…',
  'dist.delivered': '{delivered} de {total} entregados',
  'dist.clear': 'Limpiar registro',

  // Phase 4 — Effectiveness
  'dash.heading': 'Efectividad',
  'dash.subtitle':
    'KPIs simulados con un sesgo por segmento incorporado. El objetivo es mostrar "este segmento + este formato funcionó" — un hallazgo que el feedback loop reincorpora a la voz de marca.',
  'dash.regenerate': 'Regenerar datos',
  'dash.view.kpi': 'KPI',
  'dash.view.heatmap': 'Heatmap',
  'dash.view.drilldown': 'Detalle',
  'dash.kpi.delivered': 'Entregados',
  'dash.kpi.openRate': 'Tasa de apertura',
  'dash.kpi.clickRate': 'Tasa de clics',
  'dash.kpi.convertRate': 'Conversión',
  'dash.upliftEyebrow': 'Ganancia de personalización',
  'dash.uplift': '+{pct}% de CVR vs. creativo único',
  'dash.upliftBody':
    'Personalizado: {personalized} de conversión · base creativo único: {baseline} (simulado)',
  'dash.segment': 'Segmento',
  'dash.heatmapNote':
    'Cada celda muestra la CVR del cruce segmento × formato. Verde azulado más oscuro = mayor conversión.',
  'dash.drill.customer': 'Cliente',
  'dash.drill.segment': 'Segmento',
  'dash.drill.format': 'Formato',
  'dash.drill.opened': 'Abierto',
  'dash.drill.clicked': 'Clicado',
  'dash.drill.converted': 'Convertido',
  'dash.drill.dropoff': 'Visualización / salida',

  // Phase 5 — Feedback
  'feedback.heading': 'Loop de feedback',
  'feedback.subtitle':
    'Extrae un insight accionable de los datos de efectividad y lo anexa al diccionario de marca. La próxima generación lleva el aprendizaje en las 8 rutas.',
  'feedback.run': 'Aplicar aprendizajes a la marca',
  'feedback.running': 'Extrayendo…',
  'feedback.runNote': '~5 segundos. El resultado se anexa al diccionario de marca.',
  'feedback.appliedLabel': 'Insights aplicados',
  'feedback.keyMissing': 'Se requiere clave Anthropic — el feedback usa Claude.',

  // Campaign report
  'report.heading': 'Descargar informe de campaña',
  'report.subtitle':
    'ZIP único con resumen ejecutivo, lista de clientes, briefs, anuncios generados, registro de entrega, datos de efectividad, heatmap, KPIs e insights aplicados — listo para compartir con stakeholders.',
  'report.download': 'Descargar ZIP del informe',
  'report.packaging': 'Empaquetando…',
  'report.fileCount': '{n} archivos',

  'auth.footnote':
    'El acceso lo comparte tu contacto. Las credenciales se verifican en el navegador — esta es una barrera blanda, no una protección de seguridad.',

  // Brand dictionary
  'brandSettings.heading': 'Voz y reglas de marca',
  'brandSettings.active': '{n} regla(s) activa(s)',
  'brandSettings.intro':
    'Opcional. Cuando se configura, estas reglas se aplican en cada generación — texto, imagen, guion, diseño, exports de plataforma — para mantener las salidas alineadas a la voz de marca. Guardado solo en este navegador.',
  'brandSettings.name': 'Nombre de marca',
  'brandSettings.namePlaceholder': 'p. ej. Lumen',
  'brandSettings.voice': 'Voz de marca',
  'brandSettings.voicePlaceholder':
    'p. ej. Directa, segura, nunca moralista. Frases cortas. Sin emojis. Específico antes que abstracto.',
  'brandSettings.banned': 'Términos prohibidos (uno por línea)',
  'brandSettings.bannedPlaceholder': 'desbloquea\nelevar\nsinergia\nrevolucionario',
  'brandSettings.bannedHint':
    'Términos que el LLM nunca debe usar. Sin distinción de mayúsculas. Incluye raíces.',
  'brandSettings.preferred': 'Términos preferidos (uno por línea)',
  'brandSettings.preferredPlaceholder': 'claridad\nbase\nancla',
  'brandSettings.preferredHint': 'Términos a usar cuando sea natural. El LLM no los forzará.',
  'brandSettings.visualRules': 'Reglas visuales',
  'brandSettings.visualRulesPlaceholder':
    'p. ej. Sin rostros. Paleta de tonos tierra. Luz natural, sin estudio.',
  'brandSettings.audience': 'Refinamiento de audiencia',
  'brandSettings.audiencePlaceholder':
    'p. ej. Asumir siempre contexto B2B enterprise.',
  'brandSettings.save': 'Guardar marca',
  'brandSettings.saved': 'Guardado',
  'brandSettings.reset': 'Limpiar marca',
  'brandSettings.persistenceNote':
    'Guardado solo en este navegador — nunca enviado a un servidor, nunca compartido entre dispositivos.',

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

  // Per-variant refine
  'refineOne.openCopy': 'Refinar este texto',
  'refineOne.openImage': 'Refinar esta imagen',
  'refineOne.openScript': 'Refinar este guion',
  'refineOne.placeholderCopy': 'p. ej. titular más suave, sin palabras vacías',
  'refineOne.placeholderImage': 'p. ej. encuadre más cerrado, luz más cálida',
  'refineOne.placeholderScript': 'p. ej. apertura más contundente, ritmo más lento',
  'refineOne.apply': 'Aplicar',
  'refineOne.cancel': 'Cancelar',
  'refineOne.refining': 'Refinando…',

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
  'image.tierBadge.fast': 'Fast',
  'image.tierBadge.balanced': 'Balanced',
  'image.tierBadge.realistic': 'Realistic',
  'image.tierBadgeTooltip': 'Nivel de calidad de imagen. Haz clic para cambiar en Ajustes.',
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

  // Platform exports (Meta + X)
  'platform.eyebrow': 'Plataformas publicitarias',
  'platform.heading': 'Activos listos para plataforma',
  'platform.subtitle':
    'Texto A/B en dos variantes más pares de imágenes en cada aspecto de Meta y X. Tarjetas de carrusel Meta opcionales y video slideshow (Reels 9:16, X 1:1) para colocaciones de video. Cada plataforma se descarga como un único ZIP, con límites de caracteres verificados y CTA mapeado a un enum.',
  'platform.generate': 'Generar activos Meta + X',
  'platform.regenerate': 'Regenerar todo',
  'platform.regenerateNote': 'Vuelve a generar imágenes, texto, carrusel y video — cuenta como nuevo uso de API.',
  'platform.costNote':
    'Pares de imagen vía fal.ai (~8s) · adaptación de texto vía Claude (~3s) · video codificado en el navegador desde la locución.',
  'platform.costEstimate':
    'Gasto estimado en los ajustes actuales ({tier} · {videoMode}). Cámbialo en Ajustes para equilibrar calidad y coste.',
  'platform.progressCopy': 'Adaptando texto A/B para Meta y X…',
  'platform.progressImages': 'Generando pares A/B en 1:1, 4:5, 9:16, 1.91:1…',
  'platform.progressCarousel': 'Generando tarjetas de carrusel Meta…',
  'platform.progressVideo': 'Codificando video slideshow desde imagen hero + locución…',
  'platform.option.carousel': 'Incluir conjunto de carrusel Meta (+3 tarjetas)',
  'platform.option.carouselNote':
    'Tres encuadres 1:1 de la escena hero para el formato carrusel de Meta. Añade ~5s y 3 llamadas fal.ai.',
  'platform.option.video': 'Incluir videos slideshow (Reels 9:16, X 1:1)',
  'platform.option.videoNote':
    'Animación Ken Burns sobre la imagen hero con la locución aprobada, codificada en el navegador. Sin coste adicional de API.',
  'platform.option.videoNoAudio':
    'La generación de video necesita una locución aprobada en el paso de audio.',
  'platform.metaPlacements': 'Feed · Stories · Reels · Carrusel',
  'platform.xPlacements': 'Timeline · Website card · Video promocionado',
  'platform.videoForReels': 'Video — Meta Reels y Stories',
  'platform.videoForX': 'Video — Tweet promocionado X',
  'platform.videoNote':
    'Slideshow Ken Burns sobre la imagen hero, sincronizado con la locución aprobada. Súbelo directamente al uploader de Reels o tweet promocionado.',
  'platform.aiVideoForReels': 'Clip de movimiento IA — Meta Reels y Stories',
  'platform.aiVideoForX': 'Clip de movimiento IA — Tweet promocionado X',
  'platform.aiVideoNote':
    'Clip silencioso de 5 segundos con movimiento real de cámara y sujeto (Kling v1.6). Se entrega junto con el slideshow como toma alternativa — elige la que rinda mejor en tu cuenta.',
  'platform.carousel': 'Tarjetas del carrusel',
  'platform.downloadMeta': 'Descargar ZIP de Meta',
  'platform.downloadX': 'Descargar ZIP de X',
  'platform.downloading': 'Empaquetando…',
  'platform.generatedAt': 'Generado',
  'platform.embeddedCount': '{n} imagen(es) incluida(s) · {failed} faltante(s)',
  'platform.videoEmbedded': 'video incluido',
  'platform.carouselEmbedded': 'carrusel: {n} tarjetas',
  'platform.copyOverages': 'Excesos de caracteres',
  'platform.restrictedTitle': 'Aviso de categoría restringida',
  'platform.keysMissingTitle': 'Se requieren claves adicionales',
  'platform.keyMissing.fal': 'Clave fal.ai (necesaria para aspectos adicionales y tarjetas de carrusel)',
  'platform.keyMissing.ai': 'Clave OpenAI o Anthropic (necesaria para adaptación de texto)',
};

const FR: Dict = {
  // App header
  'app.title': 'Personify Ads',
  'app.version': 'v2',
  'app.newBrief': 'Nouveau brief',
  'app.settings': 'Paramètres',
  'app.language': 'Langue',
  'app.brandActive': 'Marque active',
  'app.brandActiveTooltip': "Dictionnaire de marque actif. Cliquez pour modifier.",

  // Stepper
  'stepper.step': 'Étape',
  'step.audience': 'Audience',
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
    'Personify Ads vous guidera à travers texte, image, script et audio — une étape à la fois.',
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
  'settings.keysSection': "Clés d'API",
  'settings.brandSection': 'Dictionnaire de marque',
  'settings.generationSection': 'Qualité de génération',
  'settings.signOut': 'Se déconnecter',

  'generation.imageQuality': "Niveau de qualité d'image",
  'generation.imageQualityNote':
    'Les niveaux supérieurs utilisent de meilleurs modèles Flux — visiblement plus photoréalistes, à un coût plus élevé. Par défaut : fast.',
  'generation.tier.fast': 'Fast — Flux Schnell',
  'generation.tier.fast.desc':
    'Par défaut. Le moins cher et le plus rapide. Bon pour itérer, mais l\'« air d\'IA » est plus visible.',
  'generation.tier.balanced': 'Balanced — Flux Dev',
  'generation.tier.balanced.desc':
    'Inférence en 28 étapes. Visages, mains et textures bien plus propres que Schnell. ~8× le coût.',
  'generation.tier.realistic': 'Realistic — Flux Pro 1.1',
  'generation.tier.realistic.desc':
    'Le plus photoréaliste. Meilleure peau, chute de lumière et détail des matières. À utiliser pour les hero shots qui doivent paraître réels.',
  'generation.videoProvider': 'Fournisseur vidéo',
  'generation.videoProviderNote':
    'Slideshow est gratuit et utilise votre voix off. Mouvement IA est un clip silencieux de 5s avec caméra et sujet réels — livré aux côtés du slideshow quand activé.',
  'generation.video.slideshow': 'Slideshow (Canvas + voix off)',
  'generation.video.slideshow.desc':
    'Par défaut. Mouvement Ken Burns sur les images hero, synchronisé avec la voix off approuvée. Gratuit.',
  'generation.video.ai_kling': 'Mouvement IA — Kling v1.6',
  'generation.video.ai_kling.desc':
    "Ajoute un clip silencieux de 5 secondes en mouvement réel par aspect de plateforme, généré à partir de l'image hero approuvée. Livré aux côtés du slideshow.",

  // Auth — accounts (Google + email/password)
  'auth.heading': 'Connexion',
  'auth.subtitle': 'Connectez-vous à votre compte PersonifyAds.',
  'auth.signupHeading': 'Créez votre compte',
  'auth.signupSubtitle': 'Commencez à diriger des campagnes publicitaires générées par IA.',
  'auth.email': 'E-mail',
  'auth.password': 'Mot de passe',
  'auth.confirmPassword': 'Confirmer le mot de passe',
  'auth.displayName': 'Nom (facultatif)',
  'auth.signIn': 'Se connecter',
  'auth.signingIn': 'Connexion…',
  'auth.signUp': 'Créer un compte',
  'auth.signingUp': 'Création du compte…',
  'auth.googleSignIn': 'Continuer avec Google',
  'auth.or': 'ou',
  'auth.noAccount': "Vous n'avez pas de compte ?",
  'auth.haveAccount': 'Vous avez déjà un compte ?',
  'auth.toSignup': "S'inscrire",
  'auth.toLogin': 'Se connecter',
  'auth.forgotLink': 'Mot de passe oublié ?',
  'auth.forgotHeading': 'Réinitialisez votre mot de passe',
  'auth.forgotSubtitle': 'Saisissez votre e-mail et nous vous enverrons un lien de réinitialisation.',
  'auth.forgotCta': 'Envoyer le lien de réinitialisation',
  'auth.forgotSent': 'Si un compte existe pour cet e-mail, le lien de réinitialisation est en route. Vérifiez votre boîte de réception.',
  'auth.backToLogin': '← Retour à la connexion',
  'auth.resetHeading': 'Choisissez un nouveau mot de passe',
  'auth.resetCta': 'Définir le nouveau mot de passe',
  'auth.resetDone': 'Votre mot de passe a été réinitialisé. Connectez-vous avec le nouveau mot de passe.',
  'auth.resetInvalid': 'Ce lien de réinitialisation est invalide ou a expiré. Demandez-en un nouveau.',
  'auth.verifyHeading': 'Vérifiez votre e-mail',
  'auth.verifyBody': "Nous avons envoyé un lien de vérification à {email}. Cliquez dessus pour activer votre compte, puis connectez-vous.",
  'auth.verifyResend': "Renvoyer l'e-mail de vérification",
  'auth.verifyResent': 'E-mail de vérification envoyé.',
  'auth.verifiedBanner': 'E-mail vérifié — vous pouvez maintenant vous connecter.',
  'auth.verifyFailedBanner': 'Ce lien de vérification est invalide ou a expiré.',
  'auth.unverifiedError': "Vérifiez d'abord votre e-mail — consultez votre boîte de réception ou renvoyez le lien ci-dessous.",
  'auth.invalidCredentials': 'E-mail et mot de passe ne correspondent pas.',
  'auth.rateLimited': "Trop de tentatives. Attendez une minute et réessayez.",
  'auth.googleError': "La connexion avec Google n'a pas abouti. Réessayez.",
  'auth.googleLinkError': 'Un compte existe déjà avec cet e-mail. Connectez-vous avec votre mot de passe, puis liez Google dans les Paramètres.',
  'auth.passwordTooShort': 'Le mot de passe doit comporter au moins 8 caractères.',
  'auth.passwordMismatch': 'Les mots de passe ne correspondent pas.',
  'auth.emailRequired': 'Saisissez une adresse e-mail valide.',
  'auth.genericError': "Une erreur s'est produite. Réessayez.",
  'auth.loading': 'Chargement…',
  'auth.account': 'Compte',
  'auth.signedInAs': 'Connecté en tant que',

  // Audience Console (Phase 1)
  'audience.heading': 'Audience',
  'audience.subtitle':
    "Importez votre liste de clients ou chargez les 100 exemples. Chaque enregistrement est converti en brief personnalisé pour que la génération suivante puisse être ajustée à ce destinataire. Sautez cette étape pour n'utiliser que le brief de campagne.",
  'audience.uploadCta': 'Importer la liste de clients (CSV ou JSON)',
  'audience.loadSample': 'Charger 100 exemples',
  'audience.clear': 'Effacer la liste',
  'audience.skip': 'Sauter — brief de campagne uniquement',
  'audience.approve': 'Approuver et continuer',
  'audience.convert': 'Convertir en briefs individuels',
  'audience.convertingProgress': '{completed} / {total} convertis',
  'audience.convertingInFlight': '{inFlight} en cours',
  'audience.uploadHint':
    "Le CSV doit contenir ces colonnes : id, name, age, gender, location, segment, recentInterest, recentPurchase, socialSignalSummary. Le JSON est un tableau d'objets avec les mêmes champs.",
  'audience.uploadError': "Impossible de lire ce fichier. Vérifiez les noms de colonnes et réessayez.",
  'audience.empty': 'Aucune audience chargée.',
  'audience.summary': '{count} client(s) chargé(s)',
  'audience.convertedCount': '{converted} sur {total} briefs prêts',
  'audience.failed': '{n} brief(s) ont échoué — vérifiez la console',
  'audience.briefPreview': 'Aperçu du brief',
  'audience.cardTone': 'Ton',
  'audience.cardFormat': 'Format',
  'audience.cardRationale': 'Pourquoi',
  'audience.keyMissingTitle': 'Clé Anthropic requise',
  'audience.keyMissingBody':
    "La spécialisation par client utilise Claude. Ajoutez votre clé Anthropic dans les paramètres ou cliquez sur Sauter pour continuer avec le brief de campagne uniquement.",

  // Phase 2 — Batch Generator
  'batch.heading': 'Génération par lot',
  'batch.subtitle':
    "Génère un texte + image + script entièrement personnalisé pour chaque client. Chacun reçoit une publicité différente basée sur son brief individuel.",
  'batch.size': 'Taille du lot',
  'batch.run': 'Générer {n} publicités personnalisées',
  'batch.cancel': 'Annuler',
  'batch.clear': 'Effacer les actifs',
  'batch.progress': '{completed} / {total} générés',
  'batch.inFlight': '{inFlight} en cours',
  'batch.eligible': '{n} éligibles',
  'batch.previewLabel': '{n} publicités personnalisées prêtes — cliquez pour développer',

  // Phase 3 — Distribution
  'dist.heading': 'Distribution',
  'dist.subtitle':
    "Le canal est recommandé par Claude pour chaque client à partir du profil + signal. La livraison est simulée — pas d'appels réseau réels, juste une animation d'état.",
  'dist.start': 'Démarrer la livraison ({n} clients)',
  'dist.redeliver': 'Renvoyer ({n})',
  'dist.running': 'Livraison…',
  'dist.delivered': '{delivered} sur {total} livrés',
  'dist.clear': 'Effacer le journal',

  // Phase 4 — Effectiveness
  'dash.heading': 'Efficacité',
  'dash.subtitle':
    'KPI simulés avec un biais par segment intégré. Le but : montrer "ce segment + ce format a fonctionné" — une découverte que la boucle de feedback réinjecte dans la voix de marque.',
  'dash.regenerate': 'Régénérer les données',
  'dash.view.kpi': 'KPI',
  'dash.view.heatmap': 'Heatmap',
  'dash.view.drilldown': 'Détail',
  'dash.kpi.delivered': 'Livrés',
  'dash.kpi.openRate': "Taux d'ouverture",
  'dash.kpi.clickRate': 'Taux de clic',
  'dash.kpi.convertRate': 'Conversion',
  'dash.upliftEyebrow': 'Gain de personnalisation',
  'dash.uplift': '+{pct}% de CVR vs. créatif unique',
  'dash.upliftBody':
    'Personnalisé : {personalized} de conversion · base créatif unique : {baseline} (simulé)',
  'dash.segment': 'Segment',
  'dash.heatmapNote':
    'Chaque cellule montre le CVR pour le croisement segment × format. Plus le bleu-vert est foncé, plus la conversion est forte.',
  'dash.drill.customer': 'Client',
  'dash.drill.segment': 'Segment',
  'dash.drill.format': 'Format',
  'dash.drill.opened': 'Ouvert',
  'dash.drill.clicked': 'Cliqué',
  'dash.drill.converted': 'Converti',
  'dash.drill.dropoff': 'Visionnage / abandon',

  // Phase 5 — Feedback
  'feedback.heading': 'Boucle de feedback',
  'feedback.subtitle':
    "Extrait un insight exploitable des données d'efficacité et l'ajoute au dictionnaire de marque. La prochaine génération applique l'apprentissage sur les 8 chemins.",
  'feedback.run': 'Appliquer les apprentissages à la marque',
  'feedback.running': 'Extraction…',
  'feedback.runNote': '~5 secondes. Le résultat est ajouté au dictionnaire de marque.',
  'feedback.appliedLabel': 'Insights appliqués',
  'feedback.keyMissing': 'Clé Anthropic requise — le feedback utilise Claude.',

  // Campaign report
  'report.heading': 'Télécharger le rapport de campagne',
  'report.subtitle':
    "ZIP unique avec résumé exécutif, liste clients, briefs, publicités générées, journal de livraison, données d'efficacité, heatmap, KPI et insights appliqués — prêt à partager avec les parties prenantes.",
  'report.download': 'Télécharger le ZIP du rapport',
  'report.packaging': 'Empaquetage…',
  'report.fileCount': '{n} fichiers',

  'auth.footnote':
    "L'accès est partagé par votre contact. Les identifiants sont vérifiés côté navigateur — il s'agit d'une barrière souple, pas d'une protection de sécurité.",

  // Brand dictionary
  'brandSettings.heading': 'Voix et règles de marque',
  'brandSettings.active': '{n} règle(s) active(s)',
  'brandSettings.intro':
    "Optionnel. Quand défini, ces règles s'appliquent à chaque génération — texte, image, script, design, exports plateforme — pour garder les sorties cohérentes avec la voix de la marque. Stocké uniquement dans ce navigateur.",
  'brandSettings.name': 'Nom de marque',
  'brandSettings.namePlaceholder': 'ex. Lumen',
  'brandSettings.voice': 'Voix de marque',
  'brandSettings.voicePlaceholder':
    'ex. Directe, confiante, jamais moralisatrice. Phrases courtes. Pas d’emoji. Spécifique plutôt qu’abstrait.',
  'brandSettings.banned': 'Termes bannis (un par ligne)',
  'brandSettings.bannedPlaceholder': 'débloquer\népanouir\nsynergie\nrévolutionnaire',
  'brandSettings.bannedHint':
    'Termes que le LLM ne doit jamais utiliser. Insensible à la casse. Inclut les racines.',
  'brandSettings.preferred': 'Termes préférés (un par ligne)',
  'brandSettings.preferredPlaceholder': 'clarté\nfondation\nancrage',
  'brandSettings.preferredHint': "Termes à privilégier quand c'est naturel. Le LLM ne les forcera pas.",
  'brandSettings.visualRules': 'Règles visuelles',
  'brandSettings.visualRulesPlaceholder':
    "ex. Pas de visages humains. Palette terre uniquement. Lumière naturelle, pas de studio.",
  'brandSettings.audience': "Affinement d'audience",
  'brandSettings.audiencePlaceholder':
    "ex. Toujours supposer un contexte B2B entreprise.",
  'brandSettings.save': 'Enregistrer la marque',
  'brandSettings.saved': 'Enregistré',
  'brandSettings.reset': 'Effacer la marque',
  'brandSettings.persistenceNote':
    "Enregistré dans ce navigateur uniquement — jamais envoyé à un serveur, jamais partagé entre appareils.",

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

  // Per-variant refine
  'refineOne.openCopy': 'Affiner ce texte',
  'refineOne.openImage': 'Affiner cette image',
  'refineOne.openScript': 'Affiner ce script',
  'refineOne.placeholderCopy': 'ex. titre plus doux, sans mot creux',
  'refineOne.placeholderImage': 'ex. cadrage plus serré, lumière plus chaude',
  'refineOne.placeholderScript': "ex. ouverture plus percutante, rythme plus lent",
  'refineOne.apply': 'Appliquer',
  'refineOne.cancel': 'Annuler',
  'refineOne.refining': 'Affinage…',

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
  'image.tierBadge.fast': 'Fast',
  'image.tierBadge.balanced': 'Balanced',
  'image.tierBadge.realistic': 'Realistic',
  'image.tierBadgeTooltip': "Niveau de qualité d'image. Cliquez pour modifier dans Paramètres.",
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

  // Platform exports (Meta + X)
  'platform.eyebrow': 'Plateformes publicitaires',
  'platform.heading': 'Actifs prêts pour les plateformes',
  'platform.subtitle':
    "Texte A/B en deux variantes et paires d'images à tous les ratios Meta et X. Cartes de carrousel Meta optionnelles et vidéo slideshow (Reels 9:16, X 1:1) pour les emplacements vidéo. Chaque plateforme se télécharge en un seul ZIP, limites de caractères contrôlées et CTA mappé sur un enum.",
  'platform.generate': 'Générer les actifs Meta + X',
  'platform.regenerate': 'Tout régénérer',
  'platform.regenerateNote': 'Régénère images, texte, carrousel et vidéo — compte comme nouvelle utilisation API.',
  'platform.costNote':
    "Paires d'images via fal.ai (~8s) · adaptation du texte via Claude (~3s) · vidéo encodée dans le navigateur depuis la voix off.",
  'platform.costEstimate':
    'Dépense estimée avec les paramètres actuels ({tier} · {videoMode}). À modifier dans Paramètres pour équilibrer qualité et coût.',
  'platform.progressCopy': 'Adaptation du texte A/B pour Meta et X…',
  'platform.progressImages': "Génération des paires A/B en 1:1, 4:5, 9:16, 1.91:1…",
  'platform.progressCarousel': 'Génération des cartes carrousel Meta…',
  'platform.progressVideo': "Encodage du slideshow depuis l'image hero + voix off…",
  'platform.option.carousel': 'Inclure le carrousel Meta (+3 cartes)',
  'platform.option.carouselNote':
    "Trois cadrages 1:1 de la scène hero pour le format carrousel de Meta. Ajoute ~5s et 3 appels fal.ai.",
  'platform.option.video': 'Inclure les vidéos slideshow (Reels 9:16, X 1:1)',
  'platform.option.videoNote':
    "Animation Ken Burns sur l'image hero avec la voix off approuvée, encodée dans le navigateur. Aucun coût API supplémentaire.",
  'platform.option.videoNoAudio':
    "La génération vidéo requiert une voix off approuvée à l'étape audio.",
  'platform.metaPlacements': 'Feed · Stories · Reels · Carrousel',
  'platform.xPlacements': 'Timeline · Website card · Vidéo promue',
  'platform.videoForReels': 'Vidéo — Meta Reels et Stories',
  'platform.videoForX': 'Vidéo — Tweet promu X',
  'platform.videoNote':
    "Slideshow Ken Burns sur l'image hero approuvée, synchronisé avec la voix off approuvée. À glisser directement dans l'uploader Reels ou tweet promu.",
  'platform.aiVideoForReels': 'Clip de mouvement IA — Meta Reels et Stories',
  'platform.aiVideoForX': 'Clip de mouvement IA — Tweet promu X',
  'platform.aiVideoNote':
    "Clip silencieux de 5 secondes avec mouvement de caméra et de sujet réel (Kling v1.6). Livré aux côtés du slideshow comme prise alternative — choisissez celui qui performe le mieux sur votre compte.",
  'platform.carousel': 'Cartes du carrousel',
  'platform.downloadMeta': 'Télécharger ZIP Meta',
  'platform.downloadX': 'Télécharger ZIP X',
  'platform.downloading': 'Empaquetage…',
  'platform.generatedAt': 'Généré',
  'platform.embeddedCount': '{n} image(s) intégrée(s) · {failed} manquante(s)',
  'platform.videoEmbedded': 'vidéo incluse',
  'platform.carouselEmbedded': 'carrousel : {n} cartes',
  'platform.copyOverages': 'Dépassements de caractères',
  'platform.restrictedTitle': 'Avis de catégorie restreinte',
  'platform.keysMissingTitle': 'Clés supplémentaires requises',
  'platform.keyMissing.fal': 'Clé fal.ai (nécessaire pour les ratios additionnels et le carrousel)',
  'platform.keyMissing.ai': "Clé OpenAI ou Anthropic (nécessaire pour l'adaptation du texte)",
};

const DE: Dict = {
  // App header
  'app.title': 'Personify Ads',
  'app.version': 'v2',
  'app.newBrief': 'Neues Briefing',
  'app.settings': 'Einstellungen',
  'app.language': 'Sprache',
  'app.brandActive': 'Marke aktiv',
  'app.brandActiveTooltip': 'Markenwörterbuch ist aktiv. Klicken zum Bearbeiten.',

  // Stepper
  'stepper.step': 'Schritt',
  'step.audience': 'Zielgruppe',
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
    'Personify Ads führt Sie durch Text, Bild, Skript und Audio — Schritt für Schritt.',
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
  'settings.keysSection': 'API-Schlüssel',
  'settings.brandSection': 'Markenwörterbuch',
  'settings.generationSection': 'Generierungsqualität',
  'settings.signOut': 'Abmelden',

  'generation.imageQuality': 'Bildqualitäts-Tier',
  'generation.imageQualityNote':
    'Höhere Tiers verwenden bessere Flux-Modelle — sichtbar fotorealistischer bei höheren Kosten. Standard ist fast.',
  'generation.tier.fast': 'Fast — Flux Schnell',
  'generation.tier.fast.desc':
    'Standard. Am günstigsten und schnellsten. Gut für Iteration, aber der „KI-Look" bleibt sichtbar.',
  'generation.tier.balanced': 'Balanced — Flux Dev',
  'generation.tier.balanced.desc':
    '28-Schritt-Inferenz. Gesichter, Hände und Texturen viel sauberer als Schnell. ~8× die Kosten.',
  'generation.tier.realistic': 'Realistic — Flux Pro 1.1',
  'generation.tier.realistic.desc':
    'Am fotorealistischsten. Beste Haut, Lichtabfall und Materialdetail. Für Hero-Shots, die echt wirken sollen.',
  'generation.videoProvider': 'Video-Provider',
  'generation.videoProviderNote':
    'Slideshow ist kostenlos und nutzt dein Voiceover. KI-Bewegung ist ein stummer 5-Sek-Clip mit echter Kamera- und Subjektbewegung — wird zusätzlich zur Slideshow erzeugt, wenn aktiviert.',
  'generation.video.slideshow': 'Slideshow (Canvas + Voiceover)',
  'generation.video.slideshow.desc':
    'Standard. Ken-Burns-Bewegung über Hero-Bildern, synchronisiert mit dem freigegebenen Voiceover. Kostenlos.',
  'generation.video.ai_kling': 'KI-Bewegung — Kling v1.6',
  'generation.video.ai_kling.desc':
    'Fügt einen stummen 5-Sekunden-Clip mit echter Bewegung pro Plattform-Aspekt hinzu, generiert aus dem freigegebenen Hero-Bild. Wird zusammen mit der Slideshow ausgeliefert.',

  // Auth — accounts (Google + email/password)
  'auth.heading': 'Anmelden',
  'auth.subtitle': 'Melden Sie sich bei Ihrem PersonifyAds-Konto an.',
  'auth.signupHeading': 'Konto erstellen',
  'auth.signupSubtitle': 'Starten Sie mit KI-generierten Werbekampagnen.',
  'auth.email': 'E-Mail',
  'auth.password': 'Passwort',
  'auth.confirmPassword': 'Passwort bestätigen',
  'auth.displayName': 'Name (optional)',
  'auth.signIn': 'Anmelden',
  'auth.signingIn': 'Anmeldung läuft…',
  'auth.signUp': 'Konto erstellen',
  'auth.signingUp': 'Konto wird erstellt…',
  'auth.googleSignIn': 'Mit Google fortfahren',
  'auth.or': 'oder',
  'auth.noAccount': 'Noch kein Konto?',
  'auth.haveAccount': 'Schon ein Konto?',
  'auth.toSignup': 'Registrieren',
  'auth.toLogin': 'Anmelden',
  'auth.forgotLink': 'Passwort vergessen?',
  'auth.forgotHeading': 'Passwort zurücksetzen',
  'auth.forgotSubtitle': 'Geben Sie Ihre E-Mail ein und wir senden Ihnen einen Link zum Zurücksetzen.',
  'auth.forgotCta': 'Link zum Zurücksetzen senden',
  'auth.forgotSent': 'Falls ein Konto mit dieser E-Mail existiert, ist der Link zum Zurücksetzen unterwegs. Prüfen Sie Ihren Posteingang.',
  'auth.backToLogin': '← Zurück zur Anmeldung',
  'auth.resetHeading': 'Neues Passwort wählen',
  'auth.resetCta': 'Neues Passwort festlegen',
  'auth.resetDone': 'Ihr Passwort wurde zurückgesetzt. Melden Sie sich mit dem neuen Passwort an.',
  'auth.resetInvalid': 'Dieser Link zum Zurücksetzen ist ungültig oder abgelaufen. Fordern Sie einen neuen an.',
  'auth.verifyHeading': 'Prüfen Sie Ihre E-Mail',
  'auth.verifyBody': 'Wir haben einen Bestätigungslink an {email} gesendet. Klicken Sie darauf, um Ihr Konto zu aktivieren, und melden Sie sich dann an.',
  'auth.verifyResend': 'Bestätigungs-E-Mail erneut senden',
  'auth.verifyResent': 'Bestätigungs-E-Mail gesendet.',
  'auth.verifiedBanner': 'E-Mail bestätigt — Sie können sich jetzt anmelden.',
  'auth.verifyFailedBanner': 'Dieser Bestätigungslink ist ungültig oder abgelaufen.',
  'auth.unverifiedError': 'Bestätigen Sie zuerst Ihre E-Mail — prüfen Sie Ihren Posteingang oder senden Sie den Link unten erneut.',
  'auth.invalidCredentials': 'E-Mail und Passwort stimmen nicht überein.',
  'auth.rateLimited': 'Zu viele Versuche. Warten Sie eine Minute und versuchen Sie es erneut.',
  'auth.googleError': 'Die Google-Anmeldung wurde nicht abgeschlossen. Bitte versuchen Sie es erneut.',
  'auth.googleLinkError': 'Es existiert bereits ein Konto mit dieser E-Mail. Melden Sie sich mit Ihrem Passwort an und verknüpfen Sie Google dann in den Einstellungen.',
  'auth.passwordTooShort': 'Das Passwort muss mindestens 8 Zeichen lang sein.',
  'auth.passwordMismatch': 'Die Passwörter stimmen nicht überein.',
  'auth.emailRequired': 'Geben Sie eine gültige E-Mail-Adresse ein.',
  'auth.genericError': 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.',
  'auth.loading': 'Wird geladen…',
  'auth.account': 'Konto',
  'auth.signedInAs': 'Angemeldet als',

  // Audience Console (Phase 1)
  'audience.heading': 'Zielgruppe',
  'audience.subtitle':
    'Laden Sie Ihre Kundenliste hoch oder verwenden Sie die 100 Beispieldaten. Jeder Datensatz wird in ein personalisiertes Briefing umgewandelt, damit die nachgelagerte Generierung auf diesen Empfänger zugeschnitten werden kann. Überspringen Sie diesen Schritt, um nur das Kampagnen-Briefing zu verwenden.',
  'audience.uploadCta': 'Kundenliste hochladen (CSV oder JSON)',
  'audience.loadSample': '100 Beispieldaten laden',
  'audience.clear': 'Liste leeren',
  'audience.skip': 'Überspringen — nur Kampagnen-Briefing',
  'audience.approve': 'Freigeben & fortfahren',
  'audience.convert': 'In individuelle Briefings umwandeln',
  'audience.convertingProgress': '{completed} / {total} umgewandelt',
  'audience.convertingInFlight': '{inFlight} laufend',
  'audience.uploadHint':
    'Die CSV muss diese Spalten haben: id, name, age, gender, location, segment, recentInterest, recentPurchase, socialSignalSummary. JSON ist ein Array von Objekten mit denselben Feldern.',
  'audience.uploadError': 'Diese Datei konnte nicht gelesen werden. Prüfen Sie die Spaltennamen und versuchen Sie es erneut.',
  'audience.empty': 'Keine Zielgruppe geladen.',
  'audience.summary': '{count} Kunde(n) geladen',
  'audience.convertedCount': '{converted} von {total} Briefings bereit',
  'audience.failed': '{n} Briefing(s) fehlgeschlagen — siehe Konsole',
  'audience.briefPreview': 'Briefing-Vorschau',
  'audience.cardTone': 'Ton',
  'audience.cardFormat': 'Format',
  'audience.cardRationale': 'Warum',
  'audience.keyMissingTitle': 'Anthropic-Schlüssel erforderlich',
  'audience.keyMissingBody':
    'Die kundenspezifische Briefing-Anpassung nutzt Claude. Fügen Sie Ihren Anthropic-Schlüssel in den Einstellungen hinzu, oder klicken Sie auf Überspringen, um nur mit dem Kampagnen-Briefing fortzufahren.',

  // Phase 2 — Batch Generator
  'batch.heading': 'Batch-Generierung',
  'batch.subtitle':
    'Erzeugt vollständig personalisierten Text + Bild + Skript für jeden Kunden. Jeder bekommt eine andere Anzeige basierend auf seinem individuellen Briefing.',
  'batch.size': 'Batchgröße',
  'batch.run': '{n} personalisierte Anzeigen generieren',
  'batch.cancel': 'Abbrechen',
  'batch.clear': 'Assets leeren',
  'batch.progress': '{completed} / {total} generiert',
  'batch.inFlight': '{inFlight} laufend',
  'batch.eligible': '{n} berechtigt',
  'batch.previewLabel': '{n} personalisierte Anzeigen bereit — Karte anklicken für Details',

  // Phase 3 — Distribution
  'dist.heading': 'Verteilung',
  'dist.subtitle':
    'Claude empfiehlt pro Kunde den Kanal aus Profil + Signal. Die Auslieferung ist simuliert — keine echten Netzwerkaufrufe, nur animierte Status-Overlays.',
  'dist.start': 'Auslieferung starten ({n} Kunden)',
  'dist.redeliver': 'Erneut senden ({n})',
  'dist.running': 'Wird ausgeliefert…',
  'dist.delivered': '{delivered} von {total} ausgeliefert',
  'dist.clear': 'Log leeren',

  // Phase 4 — Effectiveness
  'dash.heading': 'Wirksamkeit',
  'dash.subtitle':
    'Simulierte KPIs mit eingebautem Segment-Bias. Ziel: zeigen, dass "Segment X + Format Y funktioniert hat" — eine Erkenntnis, die der Feedback-Loop in die Markenstimme zurückfließen lässt.',
  'dash.regenerate': 'Daten neu generieren',
  'dash.view.kpi': 'KPI',
  'dash.view.heatmap': 'Heatmap',
  'dash.view.drilldown': 'Detailansicht',
  'dash.kpi.delivered': 'Ausgeliefert',
  'dash.kpi.openRate': 'Öffnungsrate',
  'dash.kpi.clickRate': 'Klickrate',
  'dash.kpi.convertRate': 'Conversion',
  'dash.upliftEyebrow': 'Personalisierungs-Uplift',
  'dash.uplift': '+{pct}% CVR-Steigerung vs. Single-Creative',
  'dash.upliftBody':
    'Personalisiert: {personalized} Conversion · Single-Creative-Baseline: {baseline} (simuliert)',
  'dash.segment': 'Segment',
  'dash.heatmapNote':
    'Jede Zelle zeigt die CVR für die Kombination Segment × Format. Dunkleres Türkis = höhere Conversion.',
  'dash.drill.customer': 'Kunde',
  'dash.drill.segment': 'Segment',
  'dash.drill.format': 'Format',
  'dash.drill.opened': 'Geöffnet',
  'dash.drill.clicked': 'Geklickt',
  'dash.drill.converted': 'Konvertiert',
  'dash.drill.dropoff': 'Wiedergabe / Abbruch',

  // Phase 5 — Feedback
  'feedback.heading': 'Feedback-Loop',
  'feedback.subtitle':
    'Extrahiert eine handlungsleitende Erkenntnis aus den Wirksamkeitsdaten und ergänzt sie im Markenwörterbuch. Der nächste Generierungslauf trägt die Lehre über alle 8 Pfade.',
  'feedback.run': 'Lernen auf Marke anwenden',
  'feedback.running': 'Extrahiert…',
  'feedback.runNote': '~5 Sekunden. Das Ergebnis wird dem Markenwörterbuch hinzugefügt.',
  'feedback.appliedLabel': 'Angewandte Insights',
  'feedback.keyMissing': 'Anthropic-Schlüssel erforderlich — Feedback nutzt Claude.',

  // Campaign report
  'report.heading': 'Kampagnenbericht herunterladen',
  'report.subtitle':
    'Einzelne ZIP mit Executive Summary, Kundenliste, Briefings, generierten Anzeigen, Lieferprotokoll, Wirksamkeitsdaten, Heatmap, KPI-Übersicht und angewandten Insights — bereit zum Teilen mit Stakeholdern.',
  'report.download': 'Bericht-ZIP herunterladen',
  'report.packaging': 'Paketierung…',
  'report.fileCount': '{n} Dateien',

  'auth.footnote':
    'Der Zugriff wird von Ihrem Ansprechpartner geteilt. Die Zugangsdaten werden im Browser geprüft — dies ist eine sanfte Sperre, kein Sicherheitsschutz.',

  // Brand dictionary
  'brandSettings.heading': 'Markenstimme und -regeln',
  'brandSettings.active': '{n} Regel(n) aktiv',
  'brandSettings.intro':
    'Optional. Sobald gesetzt, werden diese Regeln in jeder Generierung angewendet — Text, Bild, Skript, Design, Plattform-Exports — um Ausgaben mit der Markenstimme konsistent zu halten. Nur in diesem Browser gespeichert.',
  'brandSettings.name': 'Markenname',
  'brandSettings.namePlaceholder': 'z. B. Lumen',
  'brandSettings.voice': 'Markenstimme',
  'brandSettings.voicePlaceholder':
    'z. B. Direkt, selbstbewusst, nie belehrend. Kurze Sätze. Keine Emoji. Konkretes vor Abstraktem.',
  'brandSettings.banned': 'Verbotene Begriffe (einer pro Zeile)',
  'brandSettings.bannedPlaceholder': 'entfesseln\nrevolutionär\nsynergie\ngamechanger',
  'brandSettings.bannedHint':
    'Begriffe, die das LLM niemals verwenden darf. Case-insensitive. Inklusive Wortstämme.',
  'brandSettings.preferred': 'Bevorzugte Begriffe (einer pro Zeile)',
  'brandSettings.preferredPlaceholder': 'Klarheit\nGrundlage\nAnker',
  'brandSettings.preferredHint': 'Begriffe, die natürlich verwendet werden sollen. Das LLM erzwingt sie nicht.',
  'brandSettings.visualRules': 'Visuelle Regeln',
  'brandSettings.visualRulesPlaceholder':
    'z. B. Keine menschlichen Gesichter. Nur Erdtöne. Natürliches Licht, keine Studio-Blitze.',
  'brandSettings.audience': 'Zielgruppen-Verfeinerung',
  'brandSettings.audiencePlaceholder':
    'z. B. Immer einen B2B-Enterprise-Kontext annehmen.',
  'brandSettings.save': 'Marke speichern',
  'brandSettings.saved': 'Gespeichert',
  'brandSettings.reset': 'Marke löschen',
  'brandSettings.persistenceNote':
    'Nur in diesem Browser gespeichert — niemals an einen Server gesendet, nie zwischen Geräten geteilt.',

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

  // Per-variant refine
  'refineOne.openCopy': 'Diesen Text verfeinern',
  'refineOne.openImage': 'Dieses Bild verfeinern',
  'refineOne.openScript': 'Dieses Skript verfeinern',
  'refineOne.placeholderCopy': 'z. B. weichere Headline, ohne Buzzwords',
  'refineOne.placeholderImage': 'z. B. engerer Ausschnitt, wärmeres Licht',
  'refineOne.placeholderScript': 'z. B. prägnanterer Einstieg, langsameres Tempo',
  'refineOne.apply': 'Anwenden',
  'refineOne.cancel': 'Abbrechen',
  'refineOne.refining': 'Verfeinere…',

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
  'image.tierBadge.fast': 'Fast',
  'image.tierBadge.balanced': 'Balanced',
  'image.tierBadge.realistic': 'Realistic',
  'image.tierBadgeTooltip': 'Bildqualitäts-Tier. Klicke, um es in den Einstellungen zu ändern.',
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

  // Platform exports (Meta + X)
  'platform.eyebrow': 'Werbeplattformen',
  'platform.heading': 'Plattform-fertige Assets',
  'platform.subtitle':
    'A/B-Text in zwei Varianten plus Bildpaare für jedes Meta- und X-Seitenverhältnis. Optional Meta-Carousel-Karten und Slideshow-Video (Reels 9:16, X 1:1) für Video-Placements. Jede Plattform wird als einzelnes ZIP heruntergeladen, mit geprüften Zeichenlimits und CTA-Enum.',
  'platform.generate': 'Meta + X Assets generieren',
  'platform.regenerate': 'Alles neu generieren',
  'platform.regenerateNote': 'Generiert Bilder, Text, Carousel und Video komplett neu — verursacht neue API-Kosten.',
  'platform.costNote':
    'Bildpaare via fal.ai (~8s) · Textanpassung via Claude (~3s) · Video im Browser aus dem Voiceover kodiert.',
  'platform.costEstimate':
    'Geschätzte Kosten bei aktuellen Einstellungen ({tier} · {videoMode}). In den Einstellungen änderbar, um Qualität und Kosten auszubalancieren.',
  'platform.progressCopy': 'A/B-Text für Meta und X wird angepasst…',
  'platform.progressImages': 'A/B-Bildpaare in 1:1, 4:5, 9:16, 1.91:1 werden generiert…',
  'platform.progressCarousel': 'Meta-Carousel-Karten werden generiert…',
  'platform.progressVideo': 'Slideshow-Video wird aus Hero-Bild + Voiceover kodiert…',
  'platform.option.carousel': 'Meta-Carousel-Set einschließen (+3 Karten)',
  'platform.option.carouselNote':
    'Drei 1:1-Bildausschnitte der Hero-Szene für Metas Carousel-Format. Fügt ~5s und 3 fal.ai-Aufrufe hinzu.',
  'platform.option.video': 'Slideshow-Videos einschließen (Reels 9:16, X 1:1)',
  'platform.option.videoNote':
    'Ken-Burns-Animation über dem Hero-Bild mit dem freigegebenen Voiceover, im Browser kodiert. Keine zusätzlichen API-Kosten.',
  'platform.option.videoNoAudio':
    'Die Video-Generierung benötigt ein freigegebenes Voiceover aus dem Audio-Schritt.',
  'platform.metaPlacements': 'Feed · Stories · Reels · Carousel',
  'platform.xPlacements': 'Timeline · Website-Card · Promoted Video',
  'platform.videoForReels': 'Video — Meta Reels und Stories',
  'platform.videoForX': 'Video — Promoted Tweet X',
  'platform.videoNote':
    'Ken-Burns-Slideshow über dem freigegebenen Hero-Bild, synchronisiert mit dem freigegebenen Voiceover. Direkt in den Reels-/Promoted-Tweet-Uploader laden.',
  'platform.aiVideoForReels': 'KI-Bewegungs-Clip — Meta Reels und Stories',
  'platform.aiVideoForX': 'KI-Bewegungs-Clip — Promoted Tweet X',
  'platform.aiVideoNote':
    'Stummer 5-Sekunden-Clip mit echter Kamera- und Subjektbewegung (Kling v1.6). Wird zusammen mit der Slideshow als alternative Aufnahme ausgeliefert — wähle die, die in deinem Konto besser performt.',
  'platform.carousel': 'Carousel-Karten',
  'platform.downloadMeta': 'Meta-ZIP herunterladen',
  'platform.downloadX': 'X-ZIP herunterladen',
  'platform.downloading': 'Paketierung…',
  'platform.generatedAt': 'Generiert',
  'platform.embeddedCount': '{n} Bild(er) eingebettet · {failed} fehlen',
  'platform.videoEmbedded': 'Video enthalten',
  'platform.carouselEmbedded': 'Carousel: {n} Karten',
  'platform.copyOverages': 'Zeichenüberschreitungen',
  'platform.restrictedTitle': 'Hinweis zur eingeschränkten Kategorie',
  'platform.keysMissingTitle': 'Zusätzliche Schlüssel erforderlich',
  'platform.keyMissing.fal': 'fal.ai-Schlüssel (für zusätzliche Seitenverhältnisse und Carousel)',
  'platform.keyMissing.ai': 'OpenAI- oder Anthropic-Schlüssel (für Textanpassung)',
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
