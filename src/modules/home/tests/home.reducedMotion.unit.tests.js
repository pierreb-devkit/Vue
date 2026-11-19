import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const here = dirname(fileURLToPath(import.meta.url));

/**
 * @desc Read the style block of a home component.
 * @param {string} file - Path relative to the components folder.
 * @returns {string} The `<style>` part of the SFC.
 */
const styleOf = (file) => {
  const sfc = readFileSync(resolve(here, '../components', file), 'utf8');
  return sfc.slice(sfc.indexOf('<style'));
};

describe('home keyframes honour prefers-reduced-motion', () => {
  it('stops the social marquee', () => {
    const style = styleOf('home.social.component.vue');
    expect(style).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\.scroll-content \{\s*animation: none;/);
  });

  it('shows the dynamic island at its expanded end state without animating', () => {
    const style = styleOf('utils/home.dynamicIsland.component.vue');
    const guard = style.slice(style.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(guard).toMatch(/\.dynamicIsland\.expand \{\s*animation: none;\s*width: 260px;/);
    expect(guard).toMatch(/\.dynamicIsland\.minimize \{\s*animation: none;/);
  });
});
