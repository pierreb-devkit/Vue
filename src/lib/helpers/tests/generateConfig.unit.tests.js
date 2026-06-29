/**
 * generateConfig serializer round-trip test.
 *
 * The generateConfig script emits:
 *   `export default ${JSON.stringify(config, null, 2)};`
 *
 * Before the fix (#4310) a regex pipeline was used that corrupted any string
 * VALUE containing `:`, `{`, `}`, `,`, or quotes (e.g. a curl+JSON snippet).
 * This test proves the current serialization idiom round-trips such strings
 * byte-for-byte.
 *
 * We test the serialization pattern directly (no Node-only I/O imports) so
 * the suite runs in the vitest environment without side effects.
 */
import { describe, it, expect } from 'vitest';

/**
 * Replicate the generateConfig serialization step exactly.
 * @param {Object} config
 * @returns {string} The ESM file body (excluding the header comment).
 */
const serialize = (config) => {
  const configJSON = JSON.stringify(config, null, 2);
  return `export default ${configJSON};\n`;
};

/**
 * Parse the serialized ESM body back to a plain object via Function evaluation
 * (safe here: the input is the output of JSON.stringify — no user content).
 * @param {string} esmBody
 * @returns {Object}
 */
const deserialize = (esmBody) => {
  // Strip the ESM `export default` wrapper and trailing semicolon/newline so we
  // can evaluate the JSON literal directly as a JS expression.
  const json = esmBody.replace(/^export default\s*/, '').replace(/;\s*$/, '');
  return JSON.parse(json);
};

/**
 * Idempotent-write guard logic extracted from generateConfig.js.
 *
 * The script skips `fs.writeFileSync` when the on-disk content is byte-identical
 * to the newly generated content, preventing a spurious mtime bump that would
 * restart vite's watcher mid Playwright run (regression: #4372).
 *
 * These tests verify the decision predicate and the ENOENT-only catch contract
 * without performing real I/O.
 */

/** Mirror of the write-skip predicate in generateConfig.js */
const shouldWrite = (existingContent, newContent) => existingContent !== newContent;

/**
 * Mirror of the ENOENT-narrow catch in generateConfig.js:
 * rethrows anything that isn't a missing-file error.
 */
const handleReadError = (err) => {
  if (err.code !== 'ENOENT') throw err;
  return null; // file absent — fall through to write
};

describe('generateConfig idempotent write', () => {
  it('skips write when content is byte-identical', () => {
    const content = 'export default {};\n';
    expect(shouldWrite(content, content)).toBe(false);
  });

  it('writes when content differs', () => {
    expect(shouldWrite('export default {"old":true};\n', 'export default {"new":true};\n')).toBe(true);
  });

  it('writes when file is absent (null existingContent)', () => {
    expect(shouldWrite(null, 'export default {};\n')).toBe(true);
  });

  it('rethrows non-ENOENT read errors so permission failures surface loudly', () => {
    const permError = Object.assign(new Error('Permission denied'), { code: 'EACCES' });
    expect(() => handleReadError(permError)).toThrow('Permission denied');
  });

  it('returns null for ENOENT so a missing file falls through to the write path', () => {
    const notFoundError = Object.assign(new Error('No such file'), { code: 'ENOENT' });
    expect(handleReadError(notFoundError)).toBeNull();
  });
});

describe('generateConfig serializer', () => {
  it('round-trips a string value containing quotes, braces, colons, commas, and newlines', () => {
    const nastyCommand = [
      'curl https://api.example.com/api/resource \\',
      '  -H "Authorization: Bearer <YOUR_API_KEY>" \\',
      '  -H "Content-Type: application/json" \\',
      '  -d \'{ "input": "your request here" }\'',
    ].join('\n');

    const nastyResult = [
      '{',
      '  "id": "abc123",',
      '  "status": "done",',
      '  "data": { "items": [] }',
      '}',
    ].join('\n');

    const config = {
      docs: {
        quickstart: {
          language: 'bash',
          command: nastyCommand,
          result: nastyResult,
        },
      },
    };

    const esmBody = serialize(config);
    const recovered = deserialize(esmBody);

    expect(recovered.docs.quickstart.command).toBe(nastyCommand);
    expect(recovered.docs.quickstart.result).toBe(nastyResult);
  });

  it('round-trips a nested config object with multiple string values', () => {
    const config = {
      api: { host: 'https://api.example.com', port: '' },
      docs: {
        home: { title: 'Documentation: all you need', subtitle: 'Sub { line }' },
        quickstart: {
          command: 'curl https://api.example.com -H "Authorization: Bearer <KEY>"',
          result: '{ "status": "ok", "data": { "items": [1, 2, 3] } }',
          language: 'bash',
        },
      },
    };

    const recovered = deserialize(serialize(config));

    expect(recovered).toEqual(config);
  });

  it('produces valid JSON that can be parsed directly (quoted keys)', () => {
    const config = { some: { key: 'value: with {braces} and, commas' } };
    const esmBody = serialize(config);
    // Extract the JSON part and assert it parses cleanly.
    const json = esmBody.replace(/^export default\s*/, '').replace(/;\s*$/, '');
    expect(() => JSON.parse(json)).not.toThrow();
    expect(JSON.parse(json)).toEqual(config);
  });
});
