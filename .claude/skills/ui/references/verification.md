# Visual Verification

## Workflow

After implementing a frontend change, verify visually before opening a PR.

### 1. Take screenshots

Use Puppeteer to capture the page in multiple configurations:

```bash
# Prerequisites: dev server must be running
npm run dev &

# If scripts/screenshot.js exists:
node scripts/screenshot.js /path --light --dark --mobile --desktop

# If not, create captures manually or use the script template below
```

### 2. Required captures (minimum 4)

| Viewport | Theme | Size |
|----------|-------|------|
| Desktop | Light | 1440x900 |
| Desktop | Dark | 1440x900 |
| Mobile | Light | 390x844 |
| Mobile | Dark | 390x844 |

Optional extras for thorough review:
- Tablet: 768x1024
- Extra-wide: 1920x1080
- Specific breakpoint where layout changes

### 3. Review checklist

For each screenshot, verify:

- [ ] **Contrast**: Text readable on all backgrounds (especially glass effects)
- [ ] **Spacing**: Consistent margins/padding, no elements touching edges
- [ ] **Alignment**: Grid alignment holds, no unexpected shifts
- [ ] **Typography**: Correct hierarchy (display > headline > title > body)
- [ ] **Dark mode**: All elements visible, no invisible text, glass effects adapt
- [ ] **Responsive**: No horizontal overflow, content reflows properly
- [ ] **Config colors**: Using theme tokens, not hardcoded values
- [ ] **Intentional design**: Matches the aesthetic direction from Step 1

### 4. Iterate

If issues found:
1. Fix the code
2. Re-screenshot the specific failing configuration
3. Verify the fix doesn't break other configurations

## Puppeteer screenshot script template

If `scripts/screenshot.js` doesn't exist, create it:

```javascript
import puppeteer from 'puppeteer';
import path from 'path';
import { mkdir } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const OUTPUT_DIR = './screenshots';

const viewports = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844, isMobile: true },
  tablet: { width: 768, height: 1024 },
};

const takeScreenshot = async (page, urlPath, viewport, theme) => {
  await page.setViewport(viewports[viewport]);
  await page.emulateMediaFeatures([
    { name: 'prefers-color-scheme', value: theme },
  ]);
  await page.goto(`${BASE_URL}${urlPath}`, { waitUntil: 'networkidle0' });
  await page.waitForTimeout(1000); // Wait for animations
  const filename = `${urlPath.replace(/\//g, '_')}-${viewport}-${theme}.png`;
  await page.screenshot({
    path: path.join(OUTPUT_DIR, filename),
    fullPage: true,
  });
  return filename;
};

const main = async () => {
  const urlPath = process.argv[2] || '/';
  await mkdir(OUTPUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  const screenshots = [];
  for (const viewport of ['desktop', 'mobile']) {
    for (const theme of ['light', 'dark']) {
      const file = await takeScreenshot(page, urlPath, viewport, theme);
      screenshots.push(file);
      console.log(`Captured: ${file}`);
    }
  }

  await browser.close();
  console.log(`\n${screenshots.length} screenshots saved to ${OUTPUT_DIR}/`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

**Note**: Add `puppeteer` as a devDependency: `npm install -D puppeteer`

## Without Puppeteer

If Puppeteer is not available:
1. Open the dev server in a browser
2. Use DevTools device toolbar for mobile viewports
3. Toggle dark mode via system settings or browser flag
4. Take manual screenshots
5. Present them for review
