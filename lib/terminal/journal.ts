/**
 * Terminal — the AltSpot Journal.
 *
 * Real content, not a fixture. These are the published posts of the
 * AltSpot newsletter, read from its public web feed on the server and
 * cached, then linked out to. Nothing is republished in full: the
 * portal shows the headline, the standfirst and the art, and the reader
 * goes to the publication to read it.
 *
 * CONFIG-DRIVEN ON PURPOSE. The publication is called AltSpot Terminal
 * today and will be renamed, which moves its public URL. Both the feed
 * and the site root are read from the environment so the rename is a
 * deploy variable, never a code change:
 *
 *   ASC_JOURNAL_FEED_URL   the RSS/Atom feed
 *   ASC_JOURNAL_SITE_URL   the publication root, used by the fallback
 *
 * TWO PATHS, ONE CONTRACT:
 *  1. RSS. The preferred path. beehiiv generates a feed URL once RSS is
 *     switched on for the publication (Settings, Publication, RSS). It
 *     is not switched on yet, which is why path 2 exists.
 *  2. Public sitemap plus per-post Open Graph tags. Same public site, no
 *     API key, no scraping of article bodies: only the metadata a post
 *     already publishes for social cards. Delete this path the day the
 *     RSS feed URL lands in the environment.
 *
 * Both paths are best-effort. Any failure at any stage resolves to an
 * empty array so the section renders its quiet empty state and the page
 * still paints. This function never throws.
 */
import 'server-only';

const DEFAULT_SITE_URL = 'https://altspot-terminal.beehiiv.com';

export const JOURNAL_SITE_URL =
  process.env.ASC_JOURNAL_SITE_URL?.replace(/\/$/, '') ?? DEFAULT_SITE_URL;

export const JOURNAL_FEED_URL =
  process.env.ASC_JOURNAL_FEED_URL ?? `${JOURNAL_SITE_URL}/feed`;

/** Half an hour and a bit. A newsletter does not publish by the minute. */
const REVALIDATE_SECONDS = Number(process.env.ASC_JOURNAL_REVALIDATE ?? 2700);

/** Beyond this the request is abandoned and the section degrades. */
const FETCH_TIMEOUT_MS = 6000;

/**
 * Identify the portal honestly. beehiiv rejects requests with no user
 * agent, so this is required rather than decorative.
 */
const USER_AGENT = 'AltSpotPortal/1.0 (+https://thealtspot.com)';

/** Most posts the fallback will open individually. Keeps the fan-out small. */
const MAX_FALLBACK_POSTS = 8;

export interface JournalPost {
  /** The canonical post URL. Stable, so it doubles as the React key. */
  id: string;
  title: string;
  /** The standfirst. May be empty if the post publishes none. */
  excerpt: string;
  url: string;
  /** ISO 8601, or null when the source gives no date. */
  publishedAt: string | null;
  imageUrl: string | null;
}

// ---------------- small XML/HTML helpers ----------------

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

function decodeEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (match, name: string) => ENTITIES[name.toLowerCase()] ?? match);
}

/** Strip markup, collapse whitespace, then trim to a card-sized excerpt. */
function toText(raw: string, maxLength = 220): string {
  const text = decodeEntities(
    raw
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      .replace(/<[^>]*>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).replace(/[\s,.;:]+\S*$/, '')}…`;
}

function tagValue(block: string, tag: string): string | null {
  const match = block.match(
    new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'),
  );
  if (!match) return null;
  return match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
}

function attrValue(html: string, pattern: RegExp): string | null {
  const match = html.match(pattern);
  return match ? decodeEntities(match[1]).trim() : null;
}

function toIso(raw: string | null): string | null {
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { 'user-agent': USER_AGENT, accept: '*/*' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    // A dead feed is a quiet empty state, never a failed render.
    return null;
  }
}

// ---------------- path 1: RSS / Atom ----------------

function parseFeed(xml: string): JournalPost[] {
  const blocks = xml.match(/<(item|entry)\b[\s\S]*?<\/\1>/gi) ?? [];

  return blocks
    .map((block): JournalPost | null => {
      const title = tagValue(block, 'title');
      const url =
        tagValue(block, 'link') ??
        attrValue(block, /<link[^>]*href=["']([^"']+)["']/i) ??
        tagValue(block, 'guid');

      if (!title || !url || !/^https?:/i.test(url)) return null;

      const image =
        attrValue(block, /<enclosure[^>]*url=["']([^"']+)["']/i) ??
        attrValue(block, /<media:(?:content|thumbnail)[^>]*url=["']([^"']+)["']/i) ??
        attrValue(
          tagValue(block, 'content:encoded') ?? '',
          /<img[^>]*src=["']([^"']+)["']/i,
        );

      return {
        id: url,
        title: toText(title, 160),
        excerpt: toText(
          tagValue(block, 'description') ?? tagValue(block, 'summary') ?? '',
        ),
        url,
        publishedAt: toIso(
          tagValue(block, 'pubDate') ??
            tagValue(block, 'published') ??
            tagValue(block, 'updated'),
        ),
        imageUrl: image,
      };
    })
    .filter((post): post is JournalPost => post !== null);
}

// ---------------- path 2: sitemap + Open Graph ----------------

/**
 * Interim path, used only while the publication has no RSS feed
 * generated. Reads the public sitemap for post URLs, then reads each
 * post's own Open Graph tags. No article body is ever fetched into the
 * portal. Remove this once ASC_JOURNAL_FEED_URL points at a live feed.
 */
async function loadFromSite(limit: number): Promise<JournalPost[]> {
  const sitemap = await fetchText(`${JOURNAL_SITE_URL}/sitemap.xml`);
  if (!sitemap) return [];

  const urls = [...sitemap.matchAll(/<loc>\s*([^<\s]+\/p\/[^<\s]+)\s*<\/loc>/gi)]
    .map((match) => match[1])
    .slice(0, Math.min(limit, MAX_FALLBACK_POSTS));

  if (urls.length === 0) return [];

  const posts = await Promise.all(
    urls.map(async (url): Promise<JournalPost | null> => {
      const html = await fetchText(url);
      if (!html) return null;

      const meta = (property: string) =>
        attrValue(
          html,
          new RegExp(
            `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']*)["']`,
            'i',
          ),
        );

      const title = meta('og:title');
      if (!title) return null;

      return {
        id: url,
        title: toText(title, 160),
        excerpt: toText(meta('og:description') ?? ''),
        url: meta('og:url') ?? url,
        publishedAt: toIso(meta('article:published_time')),
        imageUrl: meta('og:image'),
      };
    }),
  );

  return posts.filter((post): post is JournalPost => post !== null);
}

// ---------------- the one function the app calls ----------------

/**
 * Published Journal posts, newest first. Returns an empty array rather
 * than throwing, on any failure, at any stage.
 */
export async function getJournalPosts(limit = 6): Promise<JournalPost[]> {
  const xml = await fetchText(JOURNAL_FEED_URL);
  let posts = xml ? parseFeed(xml) : [];

  if (posts.length === 0) posts = await loadFromSite(limit);

  return posts
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
    .slice(0, limit);
}
