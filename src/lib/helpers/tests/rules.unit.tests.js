/**
 * @fileoverview Unit tests for the shared form rules: each one must answer
 * exactly like the inline rule it replaced (same pass, same message).
 */
import { describe, it, expect } from 'vitest';
import { required, requiredTrim, email, isEmail } from '../rules';

const INPUTS = [undefined, null, '', ' ', '  a ', 'a', 0, 'john@doe.com', 'john@doe', 'a b@c.d', 'x@y.z'];

/** The inline rules the helpers replaced, verbatim. */
const OLD = {
  required: (v) => !!v || 'Required',
  password: (v) => !!v || 'Password is required',
  requiredTrim: (v) => (!!v && !!v.trim()) || 'Required',
  orgName: (v) => (!!v && !!v.trim()) || 'Organization name is required',
  mail: (v) => /\S+@\S+\.\S+/.test(v) || 'E-mail must be valid',
  optionalMail: (v) => !v || /\S+@\S+\.\S+/.test(v) || 'E-mail must be valid',
};

describe('rules helpers', () => {
  it.each(INPUTS.filter((v) => typeof v !== 'number'))('match the replaced inline rules for %j', (v) => {
    expect(required()(v)).toBe(OLD.required(v));
    expect(required('Password is required')(v)).toBe(OLD.password(v));
    expect(requiredTrim()(v)).toBe(OLD.requiredTrim(v));
    expect(requiredTrim('Organization name is required')(v)).toBe(OLD.orgName(v));
    expect(email()(v)).toBe(OLD.mail(v));
    expect(!v || isEmail(v) || 'E-mail must be valid').toBe(OLD.optionalMail(v));
  });

  it('required treats 0 as missing, like the inline rule', () => {
    expect(required()(0)).toBe('Required');
  });

  it('isEmail returns a boolean', () => {
    expect(isEmail('john@doe.com')).toBe(true);
    expect(isEmail('nope')).toBe(false);
    expect(isEmail(undefined)).toBe(false);
  });
});
