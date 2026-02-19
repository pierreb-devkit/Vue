import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import gravatarPlugin from '../gravatar';

// Extract the VGravatar component definition via install()
const getComponent = () => {
  const registered = {};
  const app = { component: (name, def) => (registered[name] = def) };
  gravatarPlugin.install(app);
  return registered['VGravatar'];
};

// Stable fake hash bytes → always resolves to "0102030405060708090a0b0c0d0e0f10"
const fakeHashBuffer = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]).buffer;

describe('gravatar plugin', () => {
  beforeEach(() => {
    vi.stubGlobal('crypto', {
      subtle: { digest: vi.fn().mockResolvedValue(fakeHashBuffer) },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('has an install method', () => {
    expect(typeof gravatarPlugin.install).toBe('function');
  });

  it('registers a VGravatar component', () => {
    const app = { component: vi.fn() };
    gravatarPlugin.install(app);
    expect(app.component).toHaveBeenCalledWith('VGravatar', expect.any(Object));
  });

  describe('VGravatar component', () => {
    it('has email, size and tag props with defaults', () => {
      const component = getComponent();
      expect(component.props.email.default).toBe('default');
      expect(component.props.size.default).toBe(200);
      expect(component.props.tag.default).toBe('div');
    });

    describe('created() — size clamping', () => {
      it('uses the provided size when within valid range', () => {
        const component = getComponent();
        const instance = { size: 100, finalSize: 0 };
        component.created.call(instance);
        expect(instance.finalSize).toBe(100);
      });

      it('clamps size to 24 when below minimum', () => {
        const component = getComponent();
        const instance = { size: 10, finalSize: 0 };
        component.created.call(instance);
        expect(instance.finalSize).toBe(24);
      });

      it('clamps size to 24 when size is 0', () => {
        const component = getComponent();
        const instance = { size: 0, finalSize: 0 };
        component.created.call(instance);
        expect(instance.finalSize).toBe(24);
      });

      it('clamps size to 2048 when above maximum', () => {
        const component = getComponent();
        const instance = { size: 9999, finalSize: 0 };
        component.created.call(instance);
        expect(instance.finalSize).toBe(2048);
      });

      it('accepts exactly 24 (lower boundary)', () => {
        const component = getComponent();
        const instance = { size: 24, finalSize: 0 };
        component.created.call(instance);
        expect(instance.finalSize).toBe(24);
      });

      it('accepts exactly 2048 (upper boundary)', () => {
        const component = getComponent();
        const instance = { size: 2048, finalSize: 0 };
        component.created.call(instance);
        expect(instance.finalSize).toBe(2048);
      });

      it('coerces string size to number', () => {
        const component = getComponent();
        const instance = { size: '80', finalSize: 0 };
        component.created.call(instance);
        expect(instance.finalSize).toBe(80);
      });
    });

    describe('gravatarUrl computed', () => {
      it('returns empty string when hash is not yet computed', () => {
        const component = getComponent();
        expect(component.computed.gravatarUrl.call({ hash: '', finalSize: 80 })).toBe('');
      });

      it('returns a gravatar URL when hash is available', () => {
        const component = getComponent();
        const url = component.computed.gravatarUrl.call({ hash: 'abc123', finalSize: 80 });
        expect(url).toBe('https://www.gravatar.com/avatar/abc123?s=80&d=mp');
      });

      it('URL includes the configured size', () => {
        const component = getComponent();
        const url = component.computed.gravatarUrl.call({ hash: 'aabbcc', finalSize: 200 });
        expect(url).toContain('?s=200');
      });
    });

    describe('render()', () => {
      it('returns an img vnode with src from gravatarUrl', () => {
        const component = getComponent();
        const vnode = component.render.call({ gravatarUrl: 'https://www.gravatar.com/avatar/abc?s=80&d=mp' });
        expect(vnode.type).toBe('img');
        expect(vnode.props.src).toBe('https://www.gravatar.com/avatar/abc?s=80&d=mp');
      });

      it('returns an img with empty src when gravatarUrl is empty', () => {
        const component = getComponent();
        const vnode = component.render.call({ gravatarUrl: '' });
        expect(vnode.type).toBe('img');
        expect(vnode.props.src).toBe('');
      });
    });

    describe('mounted() — calls md5 with email', () => {
      it('sets hash after mount using crypto.subtle', async () => {
        const component = getComponent();
        const instance = { email: 'user@example.com', hash: '', finalSize: 80 };
        await component.mounted.call(instance);
        expect(crypto.subtle.digest).toHaveBeenCalledWith('MD5', expect.any(Uint8Array));
        expect(instance.hash).toBeTruthy();
      });

      it('trims and lowercases email before hashing', async () => {
        const component = getComponent();
        const instance = { email: '  USER@Example.COM  ', hash: '', finalSize: 80 };
        await component.mounted.call(instance);
        const encodedArg = crypto.subtle.digest.mock.calls[0][1];
        const decoded = new TextDecoder().decode(encodedArg);
        expect(decoded).toBe('user@example.com');
      });
    });

    describe('watch.email — updates hash on email change', () => {
      it('recomputes hash when email changes', async () => {
        const component = getComponent();
        const instance = { hash: '' };
        await component.watch.email.call(instance, 'new@example.com');
        expect(crypto.subtle.digest).toHaveBeenCalled();
        expect(instance.hash).toBeTruthy();
      });
    });
  });
});
