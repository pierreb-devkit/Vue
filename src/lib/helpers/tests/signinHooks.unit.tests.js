import { describe, it, expect, vi, afterEach } from 'vitest';
import { onSignin, offSignin, runSigninHooks } from '../signinHooks';

describe('signinHooks', () => {
  afterEach(() => {
    offSignin('a');
    offSignin('b');
  });

  it('runs every registered hook with the session context', () => {
    const a = vi.fn();
    const b = vi.fn();
    onSignin('a', a);
    onSignin('b', b);
    const ctx = { serverConfig: { x: 1 }, user: { id: 'u' } };
    runSigninHooks(ctx);
    expect(a).toHaveBeenCalledWith(ctx);
    expect(b).toHaveBeenCalledWith(ctx);
  });

  it('replaces a hook registered twice under the same id', () => {
    const first = vi.fn();
    const second = vi.fn();
    onSignin('a', first);
    onSignin('a', second);
    runSigninHooks({});
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('stops running a hook once removed', () => {
    const a = vi.fn();
    onSignin('a', a);
    offSignin('a');
    runSigninHooks({});
    expect(a).not.toHaveBeenCalled();
  });

  it('never throws when a hook throws or rejects, and still runs the others', async () => {
    const b = vi.fn();
    onSignin('a', () => { throw new Error('boom'); });
    onSignin('b', () => Promise.reject(new Error('async boom')));
    expect(() => runSigninHooks({})).not.toThrow();
    onSignin('b', b);
    runSigninHooks({});
    await Promise.resolve();
    expect(b).toHaveBeenCalled();
  });
});
