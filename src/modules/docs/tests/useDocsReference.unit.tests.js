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
