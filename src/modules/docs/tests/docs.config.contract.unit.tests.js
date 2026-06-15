/**
 * Docs config ↔ API tree contract.
 *
 * Every persona "door" and the quickstart CTA in `docs.config.js` point at a
 * `target.category` that MUST exist in the backend's docs tree — otherwise the
 * home view resolves the link to the `/docs` fallback (a dead link). The shipped
 * defaults use `get-started`/`integrate`/`operate`; the real API serves
 * `{ id, label, guides }` (the wire shape). The unit tests miss this class of
 * bug when they mock the tree with the *assumed* (canonical) shape instead of
 * the real one.
 *
 * This test wires the REAL pieces together: the real `docs.config.js`, the real
 * `normalizeTree` (store I/O boundary), the real `resolveDocsTarget`, and a
 * fixture of the REAL `GET /api/public/docs` shape. A `target.category` typo or
 * an API-side category rename now fails here instead of in production.
 */
import { describe, it, expect } from 'vitest';
import docsConfig from '../config/docs.config';
import { normalizeTree } from '../stores/docs.store';
import { resolveDocsTarget } from '../composables/useDocsNav';
import { docsTreeApiFixture } from './fixtures/docsTree.api';

// Normalize the REAL API shape exactly as the store does at runtime.
const tree = normalizeTree(docsTreeApiFixture);

// A concrete article path, e.g. `/docs/get-started/welcome` — NOT the `/docs`
// fallback and NOT a bare `/docs/:category` landing (which means the category
// exists but has no articles).
const ARTICLE_PATH = /^\/docs\/[^/]+\/[^/]+$/;

describe('docs config ↔ API tree contract', () => {
  const personas = docsConfig.docs.personas;

  it('ships exactly the three persona doors', () => {
    expect(personas.map((p) => p.key)).toEqual(['developer', 'integrator', 'operator']);
  });

  it.each(personas.map((p) => [p.key, p.target]))(
    'persona %s resolves its target.category to a concrete article path',
    (key, target) => {
      const path = resolveDocsTarget(target, tree);
      expect(path, `persona "${key}" target.category=${target.category}`)
        .toMatch(ARTICLE_PATH);
      expect(path).not.toBe('/docs');
    },
  );

  it('the quickstart CTA resolves to a concrete article path', () => {
    const target = docsConfig.docs.quickstart.cta.target;
    const path = resolveDocsTarget(target, tree);
    expect(path).toMatch(ARTICLE_PATH);
    expect(path).not.toBe('/docs');
  });

  it('every persona/quickstart target.category exists in the normalized tree', () => {
    const slugs = new Set(tree.categories.map((c) => c.slug));
    const targets = [
      ...personas.map((p) => p.target.category),
      docsConfig.docs.quickstart.cta.target.category,
    ];
    targets.forEach((category) => {
      expect(slugs, `category "${category}" missing from the API tree`).toContain(category);
    });
  });
});
