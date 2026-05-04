import { describe, it, expect } from 'vitest';
import { validateStripeUrl } from '../lib/stripeRedirect';

describe('validateStripeUrl', () => {
  // ── Valid URLs ─────────────────────────────────────────────────────────────

  it('accepts a valid checkout.stripe.com HTTPS URL', () => {
    const url = 'https://checkout.stripe.com/pay/cs_test_abc123';
    expect(validateStripeUrl(url)).toBe(url);
  });

  it('accepts a valid billing.stripe.com HTTPS URL', () => {
    const url = 'https://billing.stripe.com/session/live_xyz789';
    expect(validateStripeUrl(url)).toBe(url);
  });

  it('returns the normalised URL string', () => {
    const url = 'https://checkout.stripe.com/pay/cs_test_abc?session_id=123';
    const result = validateStripeUrl(url);
    expect(typeof result).toBe('string');
    expect(result).toContain('checkout.stripe.com');
  });

  // ── Empty / missing ────────────────────────────────────────────────────────

  it('throws when URL is an empty string', () => {
    expect(() => validateStripeUrl('')).toThrow('Stripe URL is empty');
  });

  it('throws when URL is null', () => {
    expect(() => validateStripeUrl(null)).toThrow('Stripe URL is empty');
  });

  it('throws when URL is undefined', () => {
    expect(() => validateStripeUrl(undefined)).toThrow('Stripe URL is empty');
  });

  it('throws when URL is a non-string', () => {
    expect(() => validateStripeUrl(42)).toThrow('Stripe URL is empty');
  });

  // ── Relative URLs ──────────────────────────────────────────────────────────

  it('throws for a relative URL (no protocol)', () => {
    expect(() => validateStripeUrl('/pay/session')).toThrow('Stripe URL is invalid');
  });

  it('throws for a protocol-relative URL', () => {
    expect(() => validateStripeUrl('//checkout.stripe.com/pay')).toThrow('Stripe URL is invalid');
  });

  // ── Non-HTTPS ──────────────────────────────────────────────────────────────

  it('throws for an http:// URL even on a whitelisted host', () => {
    expect(() => validateStripeUrl('http://checkout.stripe.com/pay/cs_test')).toThrow(
      'Stripe URL must use HTTPS',
    );
  });

  it('throws for ftp:// URLs', () => {
    expect(() => validateStripeUrl('ftp://checkout.stripe.com/file')).toThrow(
      'Stripe URL must use HTTPS',
    );
  });

  // ── Off-whitelist hosts ────────────────────────────────────────────────────

  it('throws for a valid HTTPS URL on a non-Stripe host', () => {
    expect(() => validateStripeUrl('https://evil.example.com/steal')).toThrow(
      'Stripe URL host not allowed: evil.example.com',
    );
  });

  it('throws for a Stripe subdomain not on the whitelist', () => {
    expect(() => validateStripeUrl('https://api.stripe.com/v1/charges')).toThrow(
      'Stripe URL host not allowed: api.stripe.com',
    );
  });

  it('throws for a URL that attempts to spoof the host via path', () => {
    expect(() => validateStripeUrl('https://evil.com/checkout.stripe.com')).toThrow(
      'Stripe URL host not allowed: evil.com',
    );
  });
});
