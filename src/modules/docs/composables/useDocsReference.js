/**
 * OpenAPI reference parser.
 *
 * Pure functions over the merged OpenAPI 3 spec served at `GET /api/spec.json`.
 * Flattens `spec.paths` into tag-grouped, render-ready endpoints so the
 * in-theme reference view stays declarative (no parsing in the template).
 *
 * Mirrors `useDocsPage` / `useLegalPage`: a pure transform with no store or Vue
 * dependency — the spec object is injected. The view owns presentation; this
 * file owns the shape.
 */

/** OpenAPI HTTP methods, in conventional display order. */
const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'];

const EMPTY = { info: {}, groups: [], notFound: true };

/**
 * Normalize an OpenAPI `parameters` array into a flat, render-ready list.
 * Resolves the (commonly inlined) schema's type/enum/default so the view can
 * render a compact param row without reaching into nested objects.
 * @param {Array} [parameters] - Raw OpenAPI parameter objects.
 * @returns {Array<{ name: string, in: string, required: boolean, description: string, type: string, enum: Array|null, default: * }>}
 */
const normalizeParameters = (parameters) => {
  if (!Array.isArray(parameters)) return [];
  return parameters
    .filter((p) => p && typeof p === 'object' && p.name)
    .map((p) => {
      const schema = p.schema && typeof p.schema === 'object' ? p.schema : {};
      return {
        name: String(p.name),
        in: p.in || 'query',
        required: Boolean(p.required),
        description: p.description || '',
        type: schema.type || (schema.$ref ? 'object' : ''),
        enum: Array.isArray(schema.enum) ? schema.enum : null,
        default: schema.default,
      };
    });
};

/**
 * Normalize an OpenAPI `responses` object into a status-sorted list.
 * @param {Object} [responses] - Raw OpenAPI responses keyed by status code.
 * @returns {Array<{ status: string, description: string }>}
 */
const normalizeResponses = (responses) => {
  if (!responses || typeof responses !== 'object') return [];
  return Object.entries(responses)
    .map(([status, body]) => ({
      status: String(status),
      description: (body && typeof body === 'object' && body.description) || '',
    }))
    .sort((a, b) => a.status.localeCompare(b.status, undefined, { numeric: true }));
};

/**
 * Does this operation declare a non-empty request body?
 * Handles both inline bodies (`requestBody.content`) and `$ref` bodies
 * (`requestBody.$ref`). A `$ref` body is treated as present — its content is
 * resolved externally, so the reference itself is proof of a body.
 * @param {Object} operation - An OpenAPI operation object.
 * @returns {boolean}
 */
const hasRequestBody = (operation) => {
  const rb = operation?.requestBody;
  if (!rb || typeof rb !== 'object') return false;
  // $ref body: presence of the reference is sufficient evidence.
  if (typeof rb.$ref === 'string' && rb.$ref.length > 0) return true;
  // Inline body: require at least one content media type.
  return Boolean(rb.content && Object.keys(rb.content).length > 0);
};

/**
 * Merge path-level and operation-level parameters per the OpenAPI 3 spec:
 * operation parameters override path parameters with the same `name` + `in`
 * combination. Parameters unique to either list are kept as-is.
 *
 * @param {Array} pathParams - Path-item–level parameter objects.
 * @param {Array} opParams   - Operation-level parameter objects.
 * @returns {Array} Merged parameter list (no duplicate name+in pairs).
 */
const mergeParameters = (pathParams, opParams) => {
  // Build a map of operation-level params keyed by `${name}:${in}` so we can
  // detect overrides in O(1).
  const opKeys = new Set(
    opParams.filter((p) => p?.name && p?.in).map((p) => `${p.name}:${p.in}`),
  );
  // Path params that are NOT overridden by an operation param come first
  // (conventional OpenAPI ordering: path-wide defaults before op-specific).
  const base = pathParams.filter((p) => !opKeys.has(`${p?.name}:${p?.in}`));
  return [...base, ...opParams];
};

/**
 * Flatten one path-item's operations into endpoint descriptors.
 * @param {string} path - The URL path (e.g. `/api/items`).
 * @param {Object} pathItem - The OpenAPI path-item object (method → operation).
 * @param {Array|undefined} [globalSecurity] - Root `spec.security` (inherited when op omits its own).
 * @returns {Array<Object>} Endpoint descriptors for this path.
 */
const flattenPathItem = (path, pathItem, globalSecurity) => {
  if (!pathItem || typeof pathItem !== 'object') return [];
  // Path-level parameters apply to every operation under the path.
  const sharedParams = Array.isArray(pathItem.parameters) ? pathItem.parameters : [];
  return HTTP_METHODS
    .filter((method) => pathItem[method] && typeof pathItem[method] === 'object')
    .map((method) => {
      const op = pathItem[method];
      const opTags = Array.isArray(op.tags) && op.tags.length ? op.tags : ['Other'];
      return {
        method: method.toUpperCase(),
        path,
        tag: opTags[0],
        operationId: op.operationId || '',
        summary: op.summary || '',
        description: op.description || '',
        deprecated: Boolean(op.deprecated),
        secured: isSecured(op, globalSecurity),
        parameters: normalizeParameters(mergeParameters(sharedParams, op.parameters || [])),
        responses: normalizeResponses(op.responses),
        hasRequestBody: hasRequestBody(op),
        // Stable, unique id for v-expansion-panel keys + deep-linking.
        id: `${method}-${path}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      };
    });
};

/**
 * Determine whether an endpoint is secured, per the OpenAPI 3 spec inheritance
 * rules: an operation's `security` field OVERRIDES the root `spec.security`;
 * when the operation omits `security`, it INHERITS the root value.
 *
 * A non-empty security requirement array means the endpoint requires auth.
 * An explicit empty array (`security: []`) on the operation disables auth even
 * when the root declares a global requirement.
 *
 * @param {Object} op - The operation object.
 * @param {Array|undefined} globalSecurity - `spec.security` (root-level).
 * @returns {boolean}
 */
const isSecured = (op, globalSecurity) => {
  // Operation-level security overrides the root when present (including []).
  if (Object.prototype.hasOwnProperty.call(op, 'security')) {
    return Array.isArray(op.security) && op.security.length > 0;
  }
  // Inherit from root.
  return Array.isArray(globalSecurity) && globalSecurity.length > 0;
};

/**
 * Parse a merged OpenAPI 3 spec into tag-grouped, render-ready endpoints.
 *
 * Grouping rules:
 *  - Endpoints group under their first tag (operations with no tag → `Other`).
 *  - Group order follows the spec's top-level `tags` array (authoritative order),
 *    with any tags only seen on operations appended afterwards (stable).
 *  - Each group carries the tag's `description` (from the top-level `tags` array)
 *    so the view can render a section blurb.
 *
 * @param {Object|null} spec - The OpenAPI spec object (`{ info, tags, paths, ... }`).
 * @returns {{ info: Object, groups: Array<{ name: string, description: string, endpoints: Array }>, notFound: boolean }}
 */
export function parseSpec(spec) {
  if (!spec || typeof spec !== 'object' || !spec.paths || typeof spec.paths !== 'object') {
    return { ...EMPTY };
  }

  const globalSecurity = Array.isArray(spec.security) ? spec.security : undefined;

  const endpoints = Object.entries(spec.paths).flatMap(([path, item]) =>
    flattenPathItem(path, item, globalSecurity));

  if (!endpoints.length) return { ...EMPTY };

  // Tag metadata + order from the spec's top-level `tags` array (authoritative).
  const declaredTags = Array.isArray(spec.tags) ? spec.tags : [];
  const tagDescriptions = new Map(
    declaredTags.filter((t) => t && t.name).map((t) => [t.name, t.description || '']),
  );
  const orderedTagNames = declaredTags.filter((t) => t && t.name).map((t) => t.name);

  // Bucket endpoints by tag.
  const byTag = new Map();
  endpoints.forEach((ep) => {
    if (!byTag.has(ep.tag)) byTag.set(ep.tag, []);
    byTag.get(ep.tag).push(ep);
  });

  // Append any tags seen only on operations (not declared at the top level),
  // preserving first-seen order for stability.
  const seenTagNames = [...byTag.keys()];
  const finalTagOrder = [
    ...orderedTagNames.filter((name) => byTag.has(name)),
    ...seenTagNames.filter((name) => !orderedTagNames.includes(name)),
  ];

  const groups = finalTagOrder.map((name) => ({
    name,
    description: tagDescriptions.get(name) || '',
    endpoints: byTag.get(name),
  }));

  return {
    info: spec.info && typeof spec.info === 'object' ? spec.info : {},
    groups,
    notFound: false,
  };
}

/**
 * Resolve the rendered reference from an injected spec fetcher.
 *
 * Convenience wrapper mirroring `useDocsPage(slug, { fetcher })`: awaits the
 * fetcher, then parses. Returns the `notFound` shape on any failure so the view
 * degrades to an empty state without an unhandled rejection.
 *
 * @param {Object} [options]
 * @param {() => Promise<Object|null>} [options.fetcher] - Spec loader.
 * @returns {Promise<{ info: Object, groups: Array, notFound: boolean }>}
 */
export async function useDocsReference({ fetcher } = {}) {
  if (typeof fetcher !== 'function') return { ...EMPTY };
  let spec;
  try {
    spec = await fetcher();
  } catch {
    return { ...EMPTY };
  }
  return parseSpec(spec);
}

export default useDocsReference;
