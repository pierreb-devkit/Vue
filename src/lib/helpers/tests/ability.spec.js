import { describe, it, expect, beforeEach } from 'vitest';
import { ability, updateAbilities } from '../ability';

describe('Ability Helper', () => {
  beforeEach(() => {
    updateAbilities([]);
  });

  it('should export a reactive ability instance', () => {
    expect(ability).toBeDefined();
    expect(typeof ability.can).toBe('function');
    expect(typeof ability.cannot).toBe('function');
  });

  it('should start with no rules (deny all)', () => {
    expect(ability.cannot('read', 'Article')).toBe(true);
    expect(ability.can('read', 'Article')).toBe(false);
  });

  it('should update abilities with new rules', () => {
    updateAbilities([{ action: 'read', subject: 'Article' }]);
    expect(ability.can('read', 'Article')).toBe(true);
    expect(ability.cannot('delete', 'Article')).toBe(true);
  });

  it('should replace previous rules on update', () => {
    updateAbilities([{ action: 'read', subject: 'Article' }]);
    expect(ability.can('read', 'Article')).toBe(true);

    updateAbilities([{ action: 'manage', subject: 'User' }]);
    expect(ability.can('read', 'Article')).toBe(false);
    expect(ability.can('manage', 'User')).toBe(true);
  });

  it('should clear all abilities when given an empty array', () => {
    updateAbilities([{ action: 'read', subject: 'Article' }]);
    expect(ability.can('read', 'Article')).toBe(true);

    updateAbilities([]);
    expect(ability.can('read', 'Article')).toBe(false);
  });

  it('should support multiple rules at once', () => {
    updateAbilities([
      { action: 'read', subject: 'Article' },
      { action: 'create', subject: 'Comment' },
      { action: 'update', subject: 'Profile' },
    ]);

    expect(ability.can('read', 'Article')).toBe(true);
    expect(ability.can('create', 'Comment')).toBe(true);
    expect(ability.can('update', 'Profile')).toBe(true);
    expect(ability.can('delete', 'Article')).toBe(false);
  });

  it('should have an update method on the ability instance', () => {
    expect(typeof ability.update).toBe('function');
  });
});
