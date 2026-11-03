// Release data for the footer and the /changelog page. Fetched at build time.
// If GitHub fails, the list is empty and the build goes on.

export type Asset = { name: string; browser_download_url: string };
export type Release = {
  tag_name: string;
  html_url: string;
  published_at: string;
  prerelease: boolean;
  draft: boolean;
  body: string | null;
  assets: Asset[];
};

// Published releases, newest first. Pages through the GitHub API, 100 per page.
export async function getReleases(): Promise<Release[]> {
  const token = process.env.GITHUB_TOKEN;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const found: Release[] = [];
  let url: string | null = 'https://api.github.com/repos/aipdv/better-files/releases?per_page=100';
  try {
    for (let page = 0; url && page < 10; page++) {
      const res: Response = await fetch(url, { headers, signal: AbortSignal.timeout(10_000) });
      if (!res.ok) break;
      found.push(...((await res.json()) as Release[]));
      url = res.headers.get('link')?.match(/<([^>]+)>;\s*rel="next"/)?.[1] ?? null;
    }
  } catch {}
  return found
    .filter((r) => !r.draft && r.published_at)
    .sort((a, b) => b.published_at.localeCompare(a.published_at));
}

// "Thu, 29 Oct 2026 ..." -> "29 Oct 2026"
export const formatDay = (iso: string) => new Date(iso).toUTCString().slice(5, 16).replace(/^0/, '');

// First plain line of the release body (skips headings and links).
export const firstLine = (body: string | null) =>
  (body ?? '').split('\n').map((l) => l.trim()).find((l) => l && !l.startsWith('#') && !l.startsWith('http')) ?? '';

// Markdown sections ("## Title") with their bullet items, markup stripped.
export function sections(body: string | null): { title: string; items: string[] }[] {
  const out: { title: string; items: string[] }[] = [];
  for (const raw of (body ?? '').split('\n')) {
    const line = raw.trim();
    if (line.startsWith('## ')) out.push({ title: line.slice(3).trim(), items: [] });
    else if (line.startsWith('- ') && out.length) {
      out[out.length - 1].items.push(line.slice(2).replace(/\*\*|`/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1'));
    }
  }
  return out;
}
