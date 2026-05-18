# Archive Folder

This folder contains files that have been removed from the active site but preserved for reference.

## Archived Files

### CSS Files (Archived: 2025-12-30)
- **alt.stylesheet.css** - Alternative stylesheet experiment, unused
- **static_stylesheet.css** - Static site stylesheet prototype, unused

**Reason**: Consolidation - Only `stylesheet.css` is actively used. These were experimental/backup files that added maintenance complexity without providing value.

---

### HTML Files (Archived: 2025-12-30)
- **index2.html** - Previous minimal version of index page

**Reason**: 
- Duplicate content SEO issue (two index pages with similar content)
- Missing features compared to main index.html (no Open Graph tags, no PWA manifest, simpler layout)
- No navigation links pointing to it (unreachable by users)
- 208% smaller but less polished
- Maintenance burden - every update needed to be applied to both files
- Archived to preserve design evolution history while cleaning up active site

---

### HTML Files (Archived: 2025-01-01 — Privacy migration)
- **AdBlockerTestPage.html** — Ad blocker detection test page
- **gpt5_basic_page.html** — GPT-5 landing page with AdSense layout
- **gpt5_basic_page_v2.html** — Revised GPT-5 landing page with AdSense layout
- **adsense_multiframe_test.html** — Multi-frame AdSense iframe test

**Reason**: GitHub Pages Terms of Service prohibit monetization. Removed all Google AdSense integration, Google Analytics, and geolocation tracking as part of a privacy-first migration. These pages existed solely to support or test ad infrastructure.

## Restoration

If needed, these files can be restored from this archive or from git history:
```bash
# Restore a file
cp archive/[filename] ./

# Or from git
git log --all --full-history -- "archive/[filename]"
```
