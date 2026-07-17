import { describe, it, expect } from 'vitest';
import { createComponentRegistry } from '../createComponentRegistry';

describe('createComponentRegistry', () => {
  it('starts empty', () => {
    const { extras } = createComponentRegistry();
    expect(extras.value).toEqual([]);
  });

  it('registers a component under the given id', () => {
    const { extras, register } = createComponentRegistry();
    const Stub = { name: 'Stub', template: '<div />' };
    register('a', Stub);
    expect(extras.value).toHaveLength(1);
    expect(extras.value[0]._id).toBe('a');
    expect(extras.value[0].component).toBe(Stub);
  });

  it('preserves registration order across multiple entries', () => {
    const { extras, register } = createComponentRegistry();
    register('a', { name: 'A' });
    register('b', { name: 'B' });
    expect(extras.value.map((e) => e._id)).toEqual(['a', 'b']);
  });

  it('replaces an entry in-place (same position) when registering the same id twice', () => {
    const { extras, register } = createComponentRegistry();
    register('a', { name: 'A' });
    register('b', { name: 'B' });
    const ReplacementA = { name: 'A2' };
    register('a', ReplacementA);
    expect(extras.value.map((e) => e._id)).toEqual(['a', 'b']);
    expect(extras.value[0].component).toBe(ReplacementA);
  });

  it('unregisters an entry by id', () => {
    const { extras, register, unregister } = createComponentRegistry();
    register('a', { name: 'A' });
    register('b', { name: 'B' });
    unregister('a');
    expect(extras.value.map((e) => e._id)).toEqual(['b']);
  });

  it('unregistering a missing id is a no-op', () => {
    const { extras, register, unregister } = createComponentRegistry();
    register('a', { name: 'A' });
    unregister('does-not-exist');
    expect(extras.value).toHaveLength(1);
  });

  it('two calls to the factory return independent registries', () => {
    const registryOne = createComponentRegistry();
    const registryTwo = createComponentRegistry();
    registryOne.register('a', { name: 'A' });
    expect(registryOne.extras.value).toHaveLength(1);
    expect(registryTwo.extras.value).toHaveLength(0);
  });
});
