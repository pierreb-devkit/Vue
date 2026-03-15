import { describe, it, expect, vi, beforeEach } from 'vitest';

/** @returns {import('vitest').Mock} Hoisted mock for marked.parse, wraps source in a paragraph tag. */
const parseMock = vi.hoisted(() => vi.fn().mockImplementation((src) => `<p>${src}</p>`));
/** @returns {import('vitest').Mock} Hoisted mock for marked.parseInline, wraps source in a strong tag. */
const parseInlineMock = vi.hoisted(() => vi.fn().mockImplementation((src) => `<strong>${src}</strong>`));

vi.mock('marked', () => ({
  marked: {
    parse: parseMock,
    parseInline: parseInlineMock,
    setOptions: vi.fn(),
  },
}));

vi.mock('dompurify', () => ({
  /** @param {string} html - Raw HTML string to sanitize. @returns {string} The sanitized HTML string (passthrough in tests). */
  default: { sanitize: vi.fn((html) => html) },
}));

import markdownPlugin from '../markdown';

/**
 * Extract the VMarkdown component definition via install().
 * @returns {object} The VMarkdown component options object registered on the mock app.
 */
const getComponent = () => {
  const registered = {};
  const app = { component: (name, def) => (registered[name] = def) };
  markdownPlugin.install(app);
  return registered['VMarkdown'];
};

describe('markdown plugin', () => {
  beforeEach(() => {
    parseMock.mockImplementation((src) => `<p>${src}</p>`);
    parseInlineMock.mockImplementation((src) => `<strong>${src}</strong>`);
    vi.clearAllMocks();
  });

  it('has an install method', () => {
    expect(typeof markdownPlugin.install).toBe('function');
  });

  it('registers a VMarkdown component', () => {
    const app = { component: vi.fn() };
    markdownPlugin.install(app);
    expect(app.component).toHaveBeenCalledWith('VMarkdown', expect.any(Object));
  });

  describe('VMarkdown component', () => {
    it('has a source prop with empty string default', () => {
      const component = getComponent();
      expect(component.props.source.default).toBe('');
    });

    it('has an inline prop defaulting to false', () => {
      const component = getComponent();
      expect(component.props.inline.default).toBe(false);
    });

    it('render() returns null when source is empty string', () => {
      const component = getComponent();
      expect(component.render.call({ source: '', inline: false })).toBeNull();
    });

    it('render() returns null when source is falsy', () => {
      const component = getComponent();
      expect(component.render.call({ source: null, inline: false })).toBeNull();
    });

    it('render() returns a div vnode wrapping parsed HTML in block mode', () => {
      parseMock.mockReturnValueOnce('<h1>Hello</h1>');
      const component = getComponent();
      const vnode = component.render.call({ source: '# Hello', inline: false });
      expect(vnode).not.toBeNull();
      expect(vnode.type).toBe('div');
      expect(vnode.props.innerHTML).toBe('<h1>Hello</h1>');
    });

    it('render() returns a span vnode wrapping parsed HTML in inline mode', () => {
      parseInlineMock.mockReturnValueOnce('<strong>Hello</strong>');
      const component = getComponent();
      const vnode = component.render.call({ source: '**Hello**', inline: true });
      expect(vnode).not.toBeNull();
      expect(vnode.type).toBe('span');
      expect(vnode.props.innerHTML).toBe('<strong>Hello</strong>');
    });

    it('render() calls marked.parse in block mode', () => {
      const component = getComponent();
      component.render.call({ source: 'some text', inline: false });
      expect(parseMock).toHaveBeenCalledWith('some text');
    });

    it('render() calls marked.parseInline in inline mode', () => {
      const component = getComponent();
      component.render.call({ source: 'some text', inline: true });
      expect(parseInlineMock).toHaveBeenCalledWith('some text');
    });

    it('render() falls back to raw source div when marked.parse throws', () => {
      parseMock.mockImplementationOnce(() => {
        throw new Error('parse error');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const component = getComponent();
      const vnode = component.render.call({ source: 'raw text', inline: false });
      expect(vnode).not.toBeNull();
      expect(vnode.type).toBe('div');
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('render() falls back to raw source span when marked.parseInline throws in inline mode', () => {
      parseInlineMock.mockImplementationOnce(() => {
        throw new Error('parse error');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const component = getComponent();
      const vnode = component.render.call({ source: 'raw text', inline: true });
      expect(vnode).not.toBeNull();
      expect(vnode.type).toBe('span');
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});
