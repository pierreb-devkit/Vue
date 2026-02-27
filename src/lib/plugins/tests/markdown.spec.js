import { describe, it, expect, vi, beforeEach } from 'vitest';

const parseMock = vi.hoisted(() => vi.fn().mockImplementation((src) => `<p>${src}</p>`));

vi.mock('marked', () => ({
  marked: {
    parse: parseMock,
    setOptions: vi.fn(),
  },
}));

import markdownPlugin from '../markdown';

// Extract the VMarkdown component definition via install()
const getComponent = () => {
  const registered = {};
  const app = { component: (name, def) => (registered[name] = def) };
  markdownPlugin.install(app);
  return registered['VMarkdown'];
};

describe('markdown plugin', () => {
  beforeEach(() => {
    parseMock.mockImplementation((src) => `<p>${src}</p>`);
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

    it('render() returns null when source is empty string', () => {
      const component = getComponent();
      expect(component.render.call({ source: '' })).toBeNull();
    });

    it('render() returns null when source is falsy', () => {
      const component = getComponent();
      expect(component.render.call({ source: null })).toBeNull();
    });

    it('render() returns a vnode wrapping parsed HTML', () => {
      parseMock.mockReturnValueOnce('<h1>Hello</h1>');
      const component = getComponent();
      const vnode = component.render.call({ source: '# Hello' });
      expect(vnode).not.toBeNull();
      expect(vnode.type).toBe('div');
      expect(vnode.props.innerHTML).toBe('<h1>Hello</h1>');
    });

    it('render() calls marked.parse with the source', () => {
      const component = getComponent();
      component.render.call({ source: 'some text' });
      expect(parseMock).toHaveBeenCalledWith('some text');
    });

    it('render() falls back to raw source span when marked.parse throws', () => {
      parseMock.mockImplementationOnce(() => {
        throw new Error('parse error');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const component = getComponent();
      const vnode = component.render.call({ source: 'raw text' });
      expect(vnode).not.toBeNull();
      expect(vnode.type).toBe('div');
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});
