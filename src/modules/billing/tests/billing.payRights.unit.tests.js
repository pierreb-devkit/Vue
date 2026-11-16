import { describe, it, expect, afterEach } from 'vitest';
import { updateAbilities } from '../../../lib/helpers/ability';
import { lacksPayRight } from '../lib/payRights.js';

const member = { isLoggedIn: true, user: { currentOrganization: 'org1' } };

describe('lacksPayRight', () => {
  afterEach(() => updateAbilities([]));

  it('blocks a signed-in member whose abilities lack the create right', () => {
    updateAbilities([{ action: 'read', subject: 'BillingSubscription' }]);
    expect(lacksPayRight(member, 'BillingCheckout')).toBe(true);
    expect(lacksPayRight(member, 'BillingExtrasCheckout')).toBe(true);
  });

  it('does not block an owner or admin holding the right', () => {
    updateAbilities([{ action: 'create', subject: 'BillingCheckout' }]);
    expect(lacksPayRight(member, 'BillingCheckout')).toBe(false);
  });

  it('does not block a platform admin (manage all)', () => {
    updateAbilities([{ action: 'manage', subject: 'all' }]);
    expect(lacksPayRight(member, 'BillingExtrasCheckout')).toBe(false);
  });

  it('does not block a guest or a user without an organization', () => {
    updateAbilities([{ action: 'read', subject: 'BillingSubscription' }]);
    expect(lacksPayRight({ isLoggedIn: false, user: null }, 'BillingCheckout')).toBe(false);
    expect(lacksPayRight({ isLoggedIn: true, user: {} }, 'BillingCheckout')).toBe(false);
  });

  it('does not block while abilities are not loaded yet', () => {
    expect(lacksPayRight(member, 'BillingCheckout')).toBe(false);
  });
});
