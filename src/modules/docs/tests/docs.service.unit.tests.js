import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import axios from '../../../lib/services/axios';
import config from '../../../lib/services/config';
import { getDocsTree, getDocArticle, getSpec } from '../services/docs.service';

vi.mock('../../../lib/services/axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

// Mutable config mock so we can exercise the endpoint-key fallback branch.
vi.mock('../../../lib/services/config', () => ({
  default: {
    api: {
      protocol: 'http',
      host: 'localhost',
      port: '3010',
      base: 'api',
      endPoints: { docs: 'docs' },
    },
  },
}));

describe('docs.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    config.api.endPoints = { docs: 'docs' };
  });

  it('getDocsTree hits the public docs tree endpoint', () => {
    getDocsTree();
    expect(axios.get).toHaveBeenCalledWith('http://localhost:3010/api/public/docs/');
  });

  it('getDocArticle hits the per-slug markdown endpoint with responseType text', () => {
    getDocArticle('install');
    expect(axios.get).toHaveBeenCalledWith(
      'http://localhost:3010/api/public/docs/install.md',
      { responseType: 'text' },
    );
  });

  it('url-encodes the slug', () => {
    getDocArticle('a/b c');
    expect(axios.get).toHaveBeenCalledWith(
      'http://localhost:3010/api/public/docs/a%2Fb%20c.md',
      { responseType: 'text' },
    );
  });

  it('falls back to the "docs" endpoint key when config omits it', () => {
    config.api.endPoints = {}; // exercise the `|| 'docs'` fallback branch
    getDocsTree();
    expect(axios.get).toHaveBeenCalledWith('http://localhost:3010/api/public/docs/');
  });

  it('getSpec hits the OpenAPI spec endpoint (sibling of public/, not under it)', () => {
    getSpec();
    expect(axios.get).toHaveBeenCalledWith('http://localhost:3010/api/spec.json');
  });
});
