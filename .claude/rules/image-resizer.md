---
paths:
  - "site/image-resizer/**"
  - "site/index.html"
---

# Image Resizer: history worth knowing

- The old `superjsal/image-resizer` repo only redirects to jsal.io/image-resizer/ (keeping any #fragment). All work happens in `site\image-resizer\`.
- `vendor\heic-to\heic-to.min.js` is loaded without a `?v=`, and `site\_headers` lets browsers keep every `.js` for a year. When upgrading it, give it a new folder or file name (and update `HEIC_LIB_URL` in `js\imaging.js`), or people keep the old copy.
- **JScale** is the Image Resizer's internal code name only: the home tile's CSS classes (`.jscale`, `.m-jscale`) and the save-folder storage names in `image-resizer/js/folder.js` (`"jscale"`, `"jscale-output"`). Leave them (renaming the storage would make people re-pick their save folder). Everything public, including structured data, says "Image Resizer".
