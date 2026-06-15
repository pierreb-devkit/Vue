import { describe, it, expect } from 'vitest';
import { resolveDocsTarget, flattenArticles } from '../composables/useDocsNav';

const tree = {
  categories: [
    {
      slug: 'getting-started',
      title: 'Getting Started',
      order: 1,
      articles: [
        { slug: 'quickstart', title: 'Quickstart', order: 2 },
        { slug: 'install', title: 'Install', order: 1 },
      ],
    },
    {
      slug: 'integrate',
      title: 'Integrate',
      order: 2,
      articles: [{ slug: 'webhooks', title: 'Webhooks', order: 1 }],
    },
    {
      slug: 'empty-cat',
      title: 'Empty',
      order: 3,
      articles: [],
    },
  ],
};

describe('resolveDocsTarget', () => {
  it('resolves a category to its first (order-sorted) article', () => {
    expect(resolveDocsTarget({ category: 'getting-started' }, tree))
      .toBe('/docs/getting-started/install');
  });

  it('prefers an explicit `to` override over the category', () => {
    expect(resolveDocsTarget({ to: '/changelog', category: 'integrate' }, tree)).toBe('/changelog');
  });

  it('falls back to the category landing when the category has no articles', () => {
    expect(resolveDocsTarget({ category: 'empty-cat' }, tree)).toBe('/docs/empty-cat');
  });

  it('falls back to /docs for a missing category', () => {
    expect(resolveDocsTarget({ category: 'nope' }, tree)).toBe('/docs');
  });

  it('falls back to /docs when target or tree is absent', () => {
    expect(resolveDocsTarget(null, tree)).toBe('/docs');
    expect(resolveDocsTarget({ category: 'integrate' }, null)).toBe('/docs');
  });
});

describe('flattenArticles', () => {
  it('flattens + order-sorts articles across categories, carrying the category slug', () => {
    const flat = flattenArticles(tree);
    expect(flat.map((a) => a.slug)).toEqual(['install', 'quickstart', 'webhooks']);
    expect(flat[0].category).toBe('getting-started');
    expect(flat[2].category).toBe('integrate');
  });

  it('returns an empty array for an absent tree', () => {
    expect(flattenArticles(null)).toEqual([]);
  });
});
