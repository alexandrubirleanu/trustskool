/**
 * Generates a sample dataset (data/communities.json shape) matching the
 * pipeline contract, for local development preview ONLY.
 * The real GitHub Actions pipeline will replace this data via ingestion.
 *
 * Usage: node scripts/sample-dataset.mjs > /tmp/communities.json
 *
 * NOTE: metrics are synthetic development fixtures for well-known public
 * Skool communities; the daily cron overwrites them with real pipeline data.
 */

const DAYS = 90;
const today = new Date("2026-07-18T00:00:00Z");

function dateStr(daysAgo) {
  const d = new Date(today.getTime() - daysAgo * 86_400_000);
  return d.toISOString().slice(0, 10);
}

/** deterministic pseudo-random from a string seed */
function mulberry32(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function buildHistories(seedName, startMembers, dailyGrowthPct, startRank, priceCents, priceChanges) {
  const rand = mulberry32(seedName);
  const memberHistory = [];
  const rankHistory = [];
  const priceHistory = [];
  let m = startMembers;
  let rank = startRank;
  for (let i = DAYS; i >= 0; i -= 3) {
    m = Math.round(m * (1 + (dailyGrowthPct / 100) * 3 * (0.6 + rand() * 0.8)));
    rank = Math.max(1, Math.round(rank * (0.97 + rand() * 0.06)));
    memberHistory.push({ date: dateStr(i), total_members: m });
    rankHistory.push({ date: dateStr(i), discovery_rank: rank });
  }
  const changePoints = new Set(priceChanges.map(c => c.atIndex));
  let price = priceCents;
  let ci = 0;
  for (let idx = 0; idx < memberHistory.length; idx++) {
    if (changePoints.has(idx)) {
      price = priceChanges[ci++].to;
    }
    priceHistory.push({ date: memberHistory[idx].date, price_amount_cents: price });
  }
  return { memberHistory, rankHistory, priceHistory };
}

const defs = [
  ["skool-games", "The Skool Games", "Compete with other Skool creators, win prizes, and learn how to grow your community from the leaderboard itself.", 190000, 0.35, 3, null, [], "english", "business"],
  ["max-business-school", "Max Business School", "Marketing lessons and business fundamentals taught through short daily challenges.", 165000, 0.28, 5, null, [], "english", "business"],
  ["calisthenics", "Calisthenics Movement", "Bodyweight training programs, form checks and progress accountability.", 32000, 0.22, 18, 0, [], "english", "fitness"],
  ["ai-automation-society", "AI Automation Society", "No-code AI automations, agent workflows and weekly build-alongs.", 58000, 0.55, 8, 0, [], "english", "tech"],
  ["copy-legends", "Copy Legends", "Daily copywriting breakdowns and critique threads for direct-response writers.", 12500, 0.18, 42, 4900, [{ atIndex: 18, to: 5900 }], "english", "marketing"],
  ["trading-fanatics", "Trading Fanatics", "Live chart reviews, risk management drills and a strict no-signals policy.", 21000, 0.12, 35, 9900, [], "english", "finance"],
  ["creadores-digitales", "Creadores Digitales", "Comunidad hispana de creadores de contenido y monetización digital.", 8600, 0.4, 55, 0, [], "spanish", "creators"],
  ["fitness-empire-de", "Fitness Empire DE", "Deutsche Community für Coaches: Training, Ernährung und Kundengewinnung.", 5400, 0.25, 70, 2900, [], "german", "fitness"],
  ["ecom-elite", "Ecom Elite", "Store teardowns, supplier vetting and weekly profit-margin audits for e-commerce founders.", 14800, 0.3, 28, 7900, [{ atIndex: 10, to: 9900 }, { atIndex: 22, to: 12900 }], "english", "ecommerce"],
  ["mindful-founders", "Mindful Founders", "A quieter corner of the internet for founders who care about focus, health and sustainable growth.", 4300, 0.15, 95, 0, [], "english", "personal-development"],
  ["youtube-accelerator", "YouTube Accelerator", "Thumbnail reviews, retention analytics and scripting frameworks for growing channels.", 27500, 0.45, 12, 4900, [], "english", "creators"],
  ["real-estate-wolves", "Real Estate Wolves", "Deal analysis spreadsheets, off-market sourcing and financing structures.", 9800, 0.08, 60, 14900, [{ atIndex: 15, to: 11900 }], "english", "finance"],
  ["design-sprint-club", "Design Sprint Club", "Weekly UI challenges with peer critique from senior product designers.", 6700, 0.2, 80, 0, [], "english", "design"],
  ["musica-libre", "Música Libre", "Producción musical, mezcla y feedback semanal de tus tracks.", 3900, 0.33, 110, 1900, [], "spanish", "music"],
  ["coders-dojo", "Coders Dojo", "Katas, code review circles and interview prep for self-taught developers.", 18900, 0.26, 22, 0, [], "english", "tech"],
  ["agency-owners-hq", "Agency Owners HQ", "Systems, SOPs and hiring pipelines shared by agency operators at every stage.", 11200, 0.17, 45, 9700, [], "english", "business"],
];

const communities = defs.map(([slug, name, description, startMembers, growth, startRank, priceCents, priceChanges, language, category], i) => {
  const { memberHistory, rankHistory, priceHistory } = buildHistories(slug, startMembers, growth, startRank * 3, priceCents ?? null, priceChanges);
  const last = memberHistory[memberHistory.length - 1];
  const lastPrice = priceHistory[priceHistory.length - 1].price_amount_cents;
  return {
    id: `sk_${String(i + 1).padStart(4, "0")}`,
    slug,
    url: `https://www.skool.com/${slug}`,
    display_name: name,
    description,
    total_members: last.total_members,
    price_amount_cents: lastPrice,
    price_currency: lastPrice ? "usd" : null,
    price_interval: lastPrice ? "month" : null,
    logo_url: null,
    language,
    category,
    member_history: memberHistory,
    price_history: priceHistory,
    rank_history: rankHistory,
  };
});

process.stdout.write(JSON.stringify(communities, null, 2));
