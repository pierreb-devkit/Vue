/**
 * Docs navigation helpers.
 *
 * Pure functions over the backend guide tree (`{ categories: [{ slug, order,
 * articles: [{ slug, order }] }] }`). Shared by the home view (persona/quickstart
 * targets) and the article view (prev/next), so the resolution rules live in one
 * place. No store dependency — the tree is injected.
 */

/**
 * Categories sorted by their `order` field (stable, ascending).
 * @param {Object|null} tree - The guide tree.
 * @returns {Array} Order-sorted categories (empty array when absent).
 */
const orderedCategories = (tree) => {
  const cats = Array.isArray(tree?.categories) ? tree.categories : [];
  return [...cats].sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0));
};

/**
 * Articles within a category, sorted by `order`.
 * @param {Object} category - A category node.
 * @returns {Array} Order-sorted articles.
 */
const orderedArticles = (category) => {
  const articles = Array.isArray(category?.articles) ? category.articles : [];
  return [...articles].sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0));
};

/**
 * Resolve a docs link target to a concrete router path (internal routing only).
 *
 * Resolution order:
 *  1. `target.to` — an explicit internal router path override (e.g. '/docs/api').
 *  2. `target.category` — the first article of that category (`/docs/:cat/:slug`).
 *  3. `/docs` as the safe fallback when the category is empty, missing, or the tree
 *     is not yet loaded. The bare `/docs/:category` path has no matching route, so
 *     it is never returned.
 *
 * @param {{ to?: string, category?: string }|null|undefined} target - The link target.
 * @param {Object|null} tree - The loaded guide tree (or null before load).
 * @returns {string} An internal router path (always matches a declared route).
 */
export const resolveDocsTarget = (target, tree) => {
  if (!target) return '/docs';
  if (typeof target.to === 'string' && target.to) return target.to;
  if (!target.category) return '/docs';

  const category = orderedCategories(tree).find((c) => c?.slug === target.category);
  if (!category) return '/docs';

  const first = orderedArticles(category)[0];
  return first ? `/docs/${category.slug}/${first.slug}` : '/docs';
};

/**
 * Flatten the guide tree into an order-sorted list of articles (each carrying its
 * category slug). Drives prev/next navigation.
 * @param {Object|null} tree - The loaded guide tree.
 * @returns {Array<{ slug: string, title: string, category: string }>}
 */
export const flattenArticles = (tree) =>
  orderedCategories(tree).flatMap((cat) =>
    orderedArticles(cat).map((art) => ({
      ...art,
      category: art?.category ?? cat?.slug,
    })));

export default { resolveDocsTarget, flattenArticles };
