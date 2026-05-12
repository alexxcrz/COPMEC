const NEWS_CACHE_TTL_MS = 10 * 60 * 1000;
const GOOGLE_NEWS_RSS_BASE = "https://news.google.com/rss/search";

const TOPIC_QUERIES = {
  general: "(carretera OR autopista OR vialidad)",
  accidentes: "(accidente OR choque OR volcadura OR carambola)",
  bloqueos: "(bloqueo OR cierre vial OR cierre de carretera OR manifestacion)",
  clima: "(lluvia OR inundacion OR deslave OR clima en carretera)",
  seguridad: "(asalto en carretera OR inseguridad en carretera OR robo en carretera)",
  obras: "(obras viales OR mantenimiento carretera OR reparacion autopista)",
};

const cache = new Map();

function normalizeTopic(value) {
  const topic = String(value || "").trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(TOPIC_QUERIES, topic) ? topic : "general";
}

function normalizeRegion(value) {
  const region = String(value || "Mexico").trim();
  return region || "Mexico";
}

function normalizeLimit(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 20;
  return Math.max(5, Math.min(50, Math.round(numeric)));
}

function normalizeHours(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 24;
  return Math.max(1, Math.min(24 * 14, Math.round(numeric)));
}

function sanitizeKeyword(value) {
  return String(value || "")
    .replace(/[^\p{L}\p{N}\s.,:_-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeXmlEntities(value) {
  return String(value || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .trim();
}

function stripHtml(value) {
  return decodeXmlEntities(String(value || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function extractTagValue(xml, tagName) {
  const match = String(xml || "").match(new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match ? decodeXmlEntities(match[1]) : "";
}

function buildNewsQuery({ topic, region, keyword }) {
  const topicQuery = TOPIC_QUERIES[topic] || TOPIC_QUERIES.general;
  const regionQuery = region ? `(${region})` : "(Mexico)";
  const keywordQuery = keyword ? `(${keyword})` : "";
  return [topicQuery, regionQuery, keywordQuery, "(Mexico OR mexicano OR mexicana)"]
    .filter(Boolean)
    .join(" ");
}

function buildGoogleNewsRssUrl(query) {
  const url = new URL(GOOGLE_NEWS_RSS_BASE);
  url.searchParams.set("q", query);
  url.searchParams.set("hl", "es-419");
  url.searchParams.set("gl", "MX");
  url.searchParams.set("ceid", "MX:es-419");
  return url.toString();
}

function parseRssItems(xmlText) {
  const itemBlocks = String(xmlText || "").match(/<item>[\s\S]*?<\/item>/gi) || [];
  return itemBlocks.map((block, index) => {
    const title = stripHtml(extractTagValue(block, "title"));
    const link = decodeXmlEntities(extractTagValue(block, "link"));
    const source = stripHtml(extractTagValue(block, "source"));
    const description = stripHtml(extractTagValue(block, "description"));
    const pubDate = extractTagValue(block, "pubDate");
    const publishedAtMs = Date.parse(pubDate);

    return {
      id: `news-${index}-${title.slice(0, 24)}`,
      title: title || "Sin título",
      link,
      source: source || "Fuente no identificada",
      summary: description || "",
      publishedAt: Number.isFinite(publishedAtMs) ? new Date(publishedAtMs).toISOString() : null,
      publishedAtLabel: pubDate || "",
    };
  }).filter((item) => item.link);
}

function createCacheKey(filters) {
  return JSON.stringify(filters);
}

export async function getRoadNewsForMexico(rawFilters = {}) {
  const topic = normalizeTopic(rawFilters.topic);
  const region = normalizeRegion(rawFilters.region);
  const keyword = sanitizeKeyword(rawFilters.q);
  const hours = normalizeHours(rawFilters.hours);
  const limit = normalizeLimit(rawFilters.limit);

  const filters = { topic, region, keyword, hours, limit };
  const cacheKey = createCacheKey(filters);
  const cached = cache.get(cacheKey);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return { ...cached.value, fromCache: true };
  }

  const query = buildNewsQuery({ topic, region, keyword });
  const rssUrl = buildGoogleNewsRssUrl(query);

  const response = await fetch(rssUrl, {
    method: "GET",
    headers: {
      "User-Agent": "COPMEC/1.0 (Transport News Aggregator)",
      "Accept": "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.5",
    },
  });

  if (!response.ok) {
    throw new Error(`news_fetch_failed_${response.status}`);
  }

  const xmlText = await response.text();
  const parsedItems = parseRssItems(xmlText);
  const minTimestamp = now - (hours * 60 * 60 * 1000);

  const filteredItems = parsedItems
    .filter((item) => {
      if (!item.publishedAt) return true;
      const itemMs = Date.parse(item.publishedAt);
      return Number.isFinite(itemMs) ? itemMs >= minTimestamp : true;
    })
    .slice(0, limit);

  const result = {
    source: "google-news-rss",
    rssUrl,
    query,
    filters,
    items: filteredItems,
    total: filteredItems.length,
    generatedAt: new Date(now).toISOString(),
    fromCache: false,
  };

  cache.set(cacheKey, {
    expiresAt: now + NEWS_CACHE_TTL_MS,
    value: result,
  });

  return result;
}
