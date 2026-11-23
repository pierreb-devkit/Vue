import { describe, it, expect } from 'vitest';
import { parseSpec, useDocsReference } from '../composables/useDocsReference';

/**
 * A representative slice of the merged OpenAPI 3 spec the backend serves at
 * `GET /api/spec.json`: top-level `tags` (authoritative order + descriptions),
 * `paths` keyed by URL → method → operation with
 * `tags`/`summary`/`parameters`/`responses`/`requestBody`.
 */
const spec = {
  openapi: '3.0.0',
  info: { title: 'Example API', version: '2.1.0', description: 'desc' },
  servers: [{ url: 'https://api.example.com' }],
  tags: [
    { name: 'Items', description: 'Item CRUD and execution.' },
    { name: 'Billing', description: 'Plans and usage.' },
  ],
  paths: {
    '/api/items': {
      get: {
        tags: ['Items'],
        operationId: 'listItems',
        summary: 'List items',
        description: 'Returns all items.',
        security: [{ apiKeyAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            required: false,
            description: 'Page number',
            schema: { type: 'integer', default: 0 },
          },
        ],
        responses: {
          200: { description: 'OK' },
          401: { description: 'Unauthenticated' },
        },
      },
      post: {
        tags: ['Items'],
        summary: 'Create an item',
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { 201: { description: 'Created' } },
      },
    },
    '/api/billing/usage': {
      get: {
        tags: ['Billing'],
        summary: 'Get usage',
        responses: { 200: { description: 'OK' } },
      },
    },
  },
};

describe('parseSpec', () => {
  it('flattens paths and groups endpoints by their first tag', () => {
    const ref = parseSpec(spec);
    expect(ref.notFound).toBe(false);
    expect(ref.groups.map((g) => g.name)).toEqual(['Items', 'Billing']);

    const items = ref.groups[0];
    expect(items.description).toBe('Item CRUD and execution.');
    expect(items.endpoints).toHaveLength(2);
    expect(items.endpoints.map((e) => e.method)).toEqual(['GET', 'POST']);
    expect(items.endpoints[0].path).toBe('/api/items');
  });

  it('carries spec info through', () => {
    const ref = parseSpec(spec);
    expect(ref.info.version).toBe('2.1.0');
    expect(ref.info.title).toBe('Example API');
  });

  it('normalizes parameters (type/required/default from the inlined schema)', () => {
    const ref = parseSpec(spec);
    const [param] = ref.groups[0].endpoints[0].parameters;
    expect(param).toMatchObject({
      name: 'page',
      in: 'query',
      required: false,
      type: 'integer',
      default: 0,
      description: 'Page number',
    });
  });

  it('normalizes + status-sorts responses', () => {
    const ref = parseSpec(spec);
    const responses = ref.groups[0].endpoints[0].responses;
    expect(responses.map((r) => r.status)).toEqual(['200', '401']);
    expect(responses[0].description).toBe('OK');
  });

  it('flags secured operations and request bodies', () => {
    const ref = parseSpec(spec);
    const [list, create] = ref.groups[0].endpoints;
    expect(list.secured).toBe(true);
    expect(list.hasRequestBody).toBe(false);
    expect(create.secured).toBe(false);
    expect(create.hasRequestBody).toBe(true);
  });

  it('honors the top-level tags order over first-seen path order', () => {
    const reordered = {
      ...spec,
      tags: [
        { name: 'Billing', description: 'b' },
        { name: 'Items', description: 's' },
      ],
    };
    const ref = parseSpec(reordered);
    expect(ref.groups.map((g) => g.name)).toEqual(['Billing', 'Items']);
  });

  it('buckets untagged operations under "Other" and appends undeclared tags', () => {
    const ref = parseSpec({
      paths: {
        '/api/ping': { get: { summary: 'ping', responses: { 200: { description: 'OK' } } } },
        '/api/extra': {
          get: { tags: ['Extra'], summary: 'x', responses: { 200: { description: 'OK' } } },
        },
      },
    });
    expect(ref.groups.map((g) => g.name)).toEqual(['Other', 'Extra']);
  });

  it('produces a stable, unique id per endpoint', () => {
    const ref = parseSpec(spec);
    const ids = ref.groups.flatMap((g) => g.endpoints.map((e) => e.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBe('get-api-items');
  });

  it('merges path-level parameters into each operation', () => {
    const ref = parseSpec({
      paths: {
        '/api/items/{id}': {
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          get: { tags: ['Items'], summary: 'get', responses: { 200: { description: 'OK' } } },
        },
      },
    });
    const params = ref.groups[0].endpoints[0].parameters;
    expect(params.map((p) => p.name)).toContain('id');
    expect(params[0].required).toBe(true);
  });

  // Finding #4: hasRequestBody must detect $ref request bodies.
  it('detects a $ref requestBody as hasRequestBody=true', () => {
    const ref = parseSpec({
      paths: {
        '/api/items': {
          post: {
            tags: ['Items'],
            summary: 'Create',
            requestBody: { $ref: '#/components/requestBodies/CreateItem' },
            responses: { 201: { description: 'Created' } },
          },
        },
      },
    });
    expect(ref.groups[0].endpoints[0].hasRequestBody).toBe(true);
  });

  it('treats a $ref requestBody with an empty ref string as absent (no false-positive)', () => {
    const ref = parseSpec({
      paths: {
        '/api/items': {
          post: {
            tags: ['Items'],
            summary: 'Create',
            requestBody: { $ref: '' },
            responses: { 201: { description: 'Created' } },
          },
        },
      },
    });
    expect(ref.groups[0].endpoints[0].hasRequestBody).toBe(false);
  });

  // Finding #5: parameter merge must use override semantics, not naive concat.
  it('operation parameters override path-level params with the same name+in (no duplication)', () => {
    const ref = parseSpec({
      paths: {
        '/api/items/{id}': {
          // Path-level `id` param (required: true, type: string).
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'shared', in: 'query', schema: { type: 'integer' } },
          ],
          get: {
            tags: ['Items'],
            summary: 'get',
            // Operation-level `id` param overrides — adds description, keeps required.
            parameters: [
              { name: 'id', in: 'path', required: true, description: 'override', schema: { type: 'string' } },
            ],
            responses: { 200: { description: 'OK' } },
          },
        },
      },
    });
    const params = ref.groups[0].endpoints[0].parameters;
    // Only ONE `id` param — no duplication.
    expect(params.filter((p) => p.name === 'id' && p.in === 'path')).toHaveLength(1);
    // The operation's version wins (has description).
    expect(params.find((p) => p.name === 'id').description).toBe('override');
    // Shared path param that was NOT overridden is still present.
    expect(params.find((p) => p.name === 'shared')).toBeDefined();
  });

  // Finding #6: secured must fall back to spec.security when op omits security.
  it('inherits spec-level security when the operation has no security field', () => {
    const ref = parseSpec({
      security: [{ apiKeyAuth: [] }], // global
      paths: {
        '/api/items': {
          get: {
            tags: ['Items'],
            summary: 'list',
            // no `security` field → should inherit global
            responses: { 200: { description: 'OK' } },
          },
        },
      },
    });
    expect(ref.groups[0].endpoints[0].secured).toBe(true);
  });

  it('operation-level security: [] overrides global (disables auth for this op)', () => {
    const ref = parseSpec({
      security: [{ apiKeyAuth: [] }], // global
      paths: {
        '/api/health': {
          get: {
            tags: ['Health'],
            summary: 'ping',
            security: [], // explicit empty → public
            responses: { 200: { description: 'OK' } },
          },
        },
      },
    });
    expect(ref.groups[0].endpoints[0].secured).toBe(false);
  });

  it('operation-level security overrides global when non-empty', () => {
    const ref = parseSpec({
      security: [], // no global auth
      paths: {
        '/api/secure': {
          get: {
            tags: ['Secure'],
            summary: 'secure',
            security: [{ bearerAuth: [] }], // op-level auth
            responses: { 200: { description: 'OK' } },
          },
        },
      },
    });
    expect(ref.groups[0].endpoints[0].secured).toBe(true);
  });

  it.each([
    ['null', null],
    ['a non-object', 'nope'],
    ['a spec without paths', { info: {}, tags: [] }],
    ['a spec with empty paths', { paths: {} }],
  ])('returns notFound for %s', (_label, input) => {
    const ref = parseSpec(input);
    expect(ref.notFound).toBe(true);
    expect(ref.groups).toEqual([]);
  });
});

describe('parseSpec — examples and body fields', () => {
  /** A spec fragment whose operations hold a request example, a response example, and neither. */
  const exampleSpec = {
    components: {
      schemas: {
        Base: { type: 'object', required: ['title'], properties: { title: { type: 'string', description: 'Title' } } },
        TaskCreate: {
          allOf: [
            { $ref: '#/components/schemas/Base' },
            { type: 'object', properties: { done: { type: 'boolean' }, owner: { $ref: '#/components/schemas/Base' } } },
          ],
        },
      },
      responses: {
        NotFound: {
          description: 'Not found',
          content: { 'application/json': { examples: { missing: { summary: 'Missing', value: { type: 'error' } } } } },
        },
      },
      examples: { Zero: { value: 0 } },
    },
    paths: {
      '/api/tasks': {
        post: {
          requestBody: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TaskCreate' },
                example: { title: 'Write docs' },
              },
            },
          },
          responses: { 200: { description: 'Created' } },
        },
        get: {
          responses: {
            200: { description: 'OK', content: { 'text/csv': { example: 'id,title' } } },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/api/tasks/{taskId}': {
        delete: { responses: { 204: { description: 'Deleted' } } },
        put: {
          requestBody: {
            content: { 'application/json': { examples: { zero: { $ref: '#/components/examples/Zero' }, gone: { $ref: '#/nope' } } } },
          },
          responses: { 200: { $ref: '#/components/responses/Loop' } },
        },
      },
    },
  };
  exampleSpec.components.responses.Loop = { $ref: '#/components/responses/Loop' };

  const find = (method, path) => parseSpec(exampleSpec).groups[0].endpoints
    .find((ep) => ep.method === method && ep.path === path);

  it('renders a request example as pretty JSON and lists the body fields (allOf + $ref)', () => {
    const create = find('POST', '/api/tasks');
    expect(create.requestExamples).toEqual([{ lang: 'json', label: '', code: '{\n  "title": "Write docs"\n}' }]);
    expect(create.bodyFields).toEqual([
      { name: 'title', type: 'string', required: true, description: 'Title' },
      { name: 'done', type: 'boolean', required: false, description: '' },
      { name: 'owner', type: 'object', required: false, description: '' },
    ]);
    expect(create.responses[0].examples).toEqual([]);
  });

  it('keeps the root schema own properties and required next to an allOf, and dedupes a repeated field (last wins)', () => {
    const body = (schema) => ({
      paths: { '/a': { post: { requestBody: { content: { 'application/json': { schema } } }, responses: {} } } },
    });
    const fields = (schema) => parseSpec(body(schema)).groups[0].endpoints[0].bodyFields;
    expect(fields({
      required: ['x'],
      allOf: [{ properties: { x: { type: 'string' } } }],
      properties: { y: { type: 'number' } },
    })).toEqual([
      { name: 'y', type: 'number', required: false, description: '' },
      { name: 'x', type: 'string', required: true, description: '' },
    ]);
    expect(fields({
      allOf: [{ properties: { x: { type: 'string' } } }, { properties: { x: { type: 'number' } } }],
    })).toEqual([{ name: 'x', type: 'number', required: false, description: '' }]);
  });

  it('renders response examples, resolving a $ref response and its named examples', () => {
    const list = find('GET', '/api/tasks');
    expect(list.responses[0].examples).toEqual([{ lang: 'plaintext', label: '', code: 'id,title' }]);
    expect(list.responses[1]).toEqual({
      status: '404',
      description: 'Not found',
      examples: [{ lang: 'json', label: 'Missing', code: '{\n  "type": "error"\n}' }],
    });
  });

  it('keeps a falsy example value and drops unresolvable or circular references', () => {
    const update = find('PUT', '/api/tasks/{taskId}');
    expect(update.requestExamples).toEqual([{ lang: 'json', label: 'zero', code: '0' }]);
    expect(update.bodyFields).toEqual([]);
    expect(update.responses[0]).toEqual({ status: '200', description: '', examples: [] });
  });

  it('adds nothing when the spec holds no example', () => {
    const remove = find('DELETE', '/api/tasks/{taskId}');
    expect(remove.requestExamples).toEqual([]);
    expect(remove.bodyFields).toEqual([]);
    expect(remove.responses[0].examples).toEqual([]);
  });
});

describe('useDocsReference', () => {
  it('parses the spec returned by an injected fetcher', async () => {
    const ref = await useDocsReference({ fetcher: async () => spec });
    expect(ref.notFound).toBe(false);
    expect(ref.groups.map((g) => g.name)).toEqual(['Items', 'Billing']);
  });

  it('returns notFound when no fetcher is supplied', async () => {
    const ref = await useDocsReference();
    expect(ref.notFound).toBe(true);
  });

  it('returns notFound when the fetcher rejects', async () => {
    const ref = await useDocsReference({
      fetcher: async () => {
        throw new Error('network');
      },
    });
    expect(ref.notFound).toBe(true);
  });

  it('returns notFound when the fetcher yields null', async () => {
    const ref = await useDocsReference({ fetcher: async () => null });
    expect(ref.notFound).toBe(true);
  });
});
