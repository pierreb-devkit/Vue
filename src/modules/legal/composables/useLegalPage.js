import { marked } from 'marked';

const defaultSources = import.meta.glob('/src/**/*.md', { query: '?raw', import: 'default' });

const substitutePlaceholders = (md, entity) =>
  md.replace(/\{\{entity\.([a-zA-Z0-9_]+)\}\}/g, (match, key) => {
    const v = entity?.[key];
    return v === null || v === undefined || v === '' ? match : String(v);
  });

const NOT_FOUND = { title: '', html: '', notFound: true };

export async function useLegalPage(slug, { sources = defaultSources, config } = {}) {
  const cfg = config || {};
  const items = cfg?.legal?.pages?.items || {};
  const entity = cfg?.legal?.pages?.entity || {};
  const item = Object.values(items).find((it) => it.slug === slug);
  if (!item || !item.enabled) return { ...NOT_FOUND };
  const loader = sources[item.markdownPath];
  if (!loader) return { ...NOT_FOUND };
  let raw;
  try { raw = await loader(); } catch { return { ...NOT_FOUND }; }
  if (typeof raw !== 'string' || !raw) return { ...NOT_FOUND };
  const substituted = substitutePlaceholders(raw, entity);
  const html = marked.parse(substituted);
  return { title: item.title, html, notFound: false };
}
