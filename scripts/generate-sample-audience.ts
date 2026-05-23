// One-shot generator: produces /public/sample-audience.json with 100
// hand-curated JP-flavored personas across 4 age buckets × 8 segments × 8
// interests. Each customer gets a realistic social_signal_summary describing
// a recent post / behavior — these signals are what the Audience Console's
// LLM step actually keys on when specializing briefs.
//
// Run with: `npx tsx scripts/generate-sample-audience.ts`

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

type Customer = {
  id: string;
  name: string;
  age: number;
  gender: 'female' | 'male' | 'nonbinary' | 'unspecified';
  location: string;
  segment: string;
  recentInterest: string;
  recentPurchase: string;
  socialSignalSummary: string;
};

// Diverse archetypes — hand-written so each one feels like a real person,
// not a Markov-chain stitch. The generator below seeds from these.
const archetypes: Array<{
  segment: string;
  ageRange: [number, number];
  gender: Customer['gender'][];
  interests: string[];
  purchases: string[];
  signals: string[];
  locations: string[];
  names: { male: string[]; female: string[] };
}> = [
  // 経営者
  {
    segment: '経営者',
    ageRange: [42, 58],
    gender: ['male', 'male', 'male', 'female'],
    interests: ['投資', '現代美術', 'クラシック音楽', 'ゴルフ', '日本酒', '時計収集'],
    purchases: ['革製ブリーフケース', 'シングルモルト', '万年筆', '高級ヘッドホン', '伊勢丹のスーツ'],
    signals: [
      '先週、銀座のギャラリーで現代美術展を鑑賞した投稿',
      '日経の有料記事を週3本シェアしている',
      '六本木の和食店レビューを2本投稿',
      '社外取締役就任のニュースを共有',
      '京都の旅館で家族との写真を投稿',
    ],
    locations: ['東京・港区', '東京・千代田区', '東京・渋谷区', '東京・目黒区', '大阪市北区'],
    names: {
      male: ['井上 健太', '山田 隆司', '佐藤 雅夫', '中村 浩二', '田中 修一', '小林 誠'],
      female: ['鈴木 由美子', '高橋 麻里', '渡辺 詠子'],
    },
  },
  // 若手専門職
  {
    segment: '若手専門職',
    ageRange: [27, 35],
    gender: ['female', 'female', 'male', 'female'],
    interests: ['キャリア', 'ヨガ', 'コーヒー', '海外ドラマ', '読書', 'スキンケア'],
    purchases: ['Nespressoマシン', 'リカバリーサンダル', 'Kindle Paperwhite', 'マットレス'],
    signals: [
      '転職エージェントとの面談を投稿',
      'スターバックスの新作ドリンクを試した投稿',
      '読了本の感想を週1で投稿',
      '皇居ランニングの写真',
      '英語学習アプリの継続記録',
    ],
    locations: ['東京・世田谷区', '東京・新宿区', '東京・品川区', '東京・中央区', '横浜市'],
    names: {
      male: ['大野 翔太', '加藤 翼', '小山 直人', '森田 拓也'],
      female: ['伊藤 結衣', '吉田 美咲', '川口 さくら', '清水 麻衣', '林 杏子', '橋本 れな'],
    },
  },
  // クリエイティブ
  {
    segment: 'クリエイティブ',
    ageRange: [28, 42],
    gender: ['nonbinary', 'female', 'male', 'female'],
    interests: ['写真', 'インディーズ音楽', 'ヴィンテージ家具', 'タトゥー', 'ファッション', '映画'],
    purchases: ['Leicaのカメラ', '古着のデニム', 'Aesopのハンドクリーム', 'A24の映画グッズ'],
    signals: [
      '下北沢の古着屋投稿',
      '中目黒のフラワーショップでの一枚',
      'フィルム写真をInstagramに毎週投稿',
      'PFFのチケットをシェア',
      'ヴィンテージレコードのコレクション写真',
    ],
    locations: ['東京・世田谷区', '東京・杉並区', '東京・目黒区', '東京・台東区', '京都市'],
    names: {
      male: ['福田 涼', '岡田 蒼', '吉川 海斗'],
      female: ['横山 葵', '池田 千夏', '長谷川 結菜', '安藤 みのり'],
    },
  },
  // 投資家・FIRE志向
  {
    segment: '投資家・FIRE志向',
    ageRange: [32, 48],
    gender: ['male', 'male', 'female'],
    interests: ['インデックス投資', '不動産', '節税', 'ミニマリズム', 'ガジェット'],
    purchases: ['ふるさと納税の高級牛肉', 'iPhone Pro', 'スタンディングデスク', '高機能ランニングシューズ'],
    signals: [
      'NISA口座開設の投稿',
      '配当金実績を月次で投稿',
      '築古マンション投資の体験記',
      'ミニマリストの部屋紹介',
    ],
    locations: ['東京・港区', '東京・江東区', '神奈川県川崎市', '東京・墨田区'],
    names: {
      male: ['村田 健', '青木 大輔', '原田 純'],
      female: ['西田 沙織', '宮本 香織'],
    },
  },
  // 主婦・育児世代
  {
    segment: '主婦・育児世代',
    ageRange: [32, 44],
    gender: ['female', 'female', 'female', 'female'],
    interests: ['子育て', '時短料理', 'インテリア', '習い事', '節約', '健康'],
    purchases: ['電気圧力鍋', '無印良品の収納', '通信教育の幼児コース', 'オーガニック食材'],
    signals: [
      '保育園送迎時の朝食レシピを投稿',
      'コストコの買い物投稿が月3回',
      '習い事の発表会レポート',
      'ドラム式洗濯機購入の比較記事をシェア',
      'インテリア雑誌の切り抜き投稿',
    ],
    locations: ['さいたま市', '東京・練馬区', '東京・杉並区', '千葉市', '横浜市青葉区'],
    names: {
      female: ['岡崎 千恵', '坂本 真希', '内田 美穂', '木村 知美', '藤井 沙耶', '増田 麻由'],
      male: [],
    },
  },
  // 趣味嗜好型(写真・登山等)
  {
    segment: '趣味嗜好型',
    ageRange: [38, 65],
    gender: ['male', 'male', 'female'],
    interests: ['登山', '釣り', '鉄道写真', 'バイク', '蕎麦打ち', '園芸'],
    purchases: ['登山靴', '一眼レフレンズ', '釣り具', 'ロードバイク', '盆栽'],
    signals: [
      '上高地の写真を投稿',
      '釣果報告を週末ごとに投稿',
      '青春18切符で全国巡回',
      '土曜の朝、皇居ランニング後の蕎麦',
      'ベランダ菜園の収穫報告',
    ],
    locations: ['長野県松本市', '神奈川県鎌倉市', '東京・町田市', '千葉県柏市', '山梨県甲府市'],
    names: {
      male: ['松本 健一', '高木 雅之', '前田 信一', '河野 学', '岩崎 浩'],
      female: ['菊池 涼子', '柴田 京子'],
    },
  },
  // 学生・若手
  {
    segment: '学生・若手',
    ageRange: [20, 27],
    gender: ['female', 'female', 'male', 'nonbinary'],
    interests: ['K-POP', 'カフェ巡り', 'ファッション', 'TikTok', '推し活', 'ゲーム'],
    purchases: ['AirPods Pro', '化粧品サンプル', '推しのグッズ', 'BTSアルバム', 'ゲーミングPC'],
    signals: [
      'タピオカ屋さんの写真を投稿',
      '推しのコンサート抽選報告',
      'TikTokダンス動画を毎週投稿',
      '原宿のスイーツ巡りレポート',
      '友達との表参道カフェ巡り写真',
    ],
    locations: ['東京・渋谷区', '東京・新宿区', '埼玉県さいたま市', '東京・豊島区', '神奈川県横浜市'],
    names: {
      male: ['竹内 蓮', '本田 颯太', '杉山 楓真'],
      female: ['遠藤 ひかり', '上田 美月', '森 まなみ', '相沢 七海', '伊東 莉子', '永田 凛'],
    },
  },
  // リタイア層
  {
    segment: 'リタイア層',
    ageRange: [62, 78],
    gender: ['male', 'female', 'male'],
    interests: ['俳句', '園芸', '旅行', '読書', 'クラシック音楽', '歴史'],
    purchases: ['補聴器', '高級万年筆', 'クルーズ旅行', '電動アシスト自転車', '読書用ライト'],
    signals: [
      '俳句結社の月例会レポート',
      '孫との写真を投稿',
      '夫婦で温泉旅行のブログ更新',
      '近所の文化センター講座の修了報告',
      '読書感想文を月3本投稿',
    ],
    locations: ['東京・世田谷区', '千葉県市川市', '神奈川県藤沢市', '愛知県名古屋市', '東京・調布市'],
    names: {
      male: ['佐々木 義雄', '長田 信夫', '中島 茂', '須藤 良治'],
      female: ['野口 和子', '田村 恵子', '関 美智子'],
    },
  },
];

// Simple seedable RNG so the generator is deterministic.
function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(0xc0ffee);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)]!;
const pickInt = (lo: number, hi: number): number =>
  Math.floor(lo + rng() * (hi - lo + 1));

const customers: Customer[] = [];
let counter = 1;

// Target: ~100 customers, evenly distributed across the 8 archetypes (12-13
// per archetype) with the age distribution baked into each archetype's range.
const perArchetype = Math.ceil(100 / archetypes.length);
for (const arc of archetypes) {
  for (let i = 0; i < perArchetype; i++) {
    if (customers.length >= 100) break;
    const gender = pick(arc.gender);
    const pool = gender === 'female' ? arc.names.female : arc.names.male;
    const namePool = pool.length > 0 ? pool : [...arc.names.male, ...arc.names.female];
    const name = pick(namePool);
    customers.push({
      id: `cust-${String(counter).padStart(3, '0')}`,
      name,
      age: pickInt(arc.ageRange[0], arc.ageRange[1]),
      gender,
      location: pick(arc.locations),
      segment: arc.segment,
      recentInterest: pick(arc.interests),
      recentPurchase: pick(arc.purchases),
      socialSignalSummary: pick(arc.signals),
    });
    counter += 1;
  }
}

// Trim or pad to exactly 100.
while (customers.length > 100) customers.pop();

const outPath = join('public', 'sample-audience.json');
mkdirSync('public', { recursive: true });
writeFileSync(outPath, JSON.stringify(customers, null, 2) + '\n', 'utf8');

const segmentCounts = customers.reduce<Record<string, number>>((acc, c) => {
  acc[c.segment] = (acc[c.segment] ?? 0) + 1;
  return acc;
}, {});
const ageBuckets = customers.reduce(
  (acc, c) => {
    if (c.age < 30) acc['20s'] += 1;
    else if (c.age < 40) acc['30s'] += 1;
    else if (c.age < 50) acc['40s'] += 1;
    else if (c.age < 60) acc['50s'] += 1;
    else acc['60+'] += 1;
    return acc;
  },
  { '20s': 0, '30s': 0, '40s': 0, '50s': 0, '60+': 0 },
);

// eslint-disable-next-line no-console
console.log(
  `Wrote ${customers.length} customers to ${outPath}\n` +
    `Segments: ${JSON.stringify(segmentCounts)}\n` +
    `Age buckets: ${JSON.stringify(ageBuckets)}`,
);
