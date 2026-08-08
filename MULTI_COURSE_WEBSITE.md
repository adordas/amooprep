# AmooPrep website — multi-course structure

The GitHub Pages site now uses one landing page per course:

- `courses/index.html` — course catalog
- `courses/greek-roman-civilization.html` — Course #1 landing page
- `product.html` — redirect kept so old links still work

## Adding Course #2
Create `courses/<new-course-id>.html`, add its checkout and price under `courses` in `site-config.js`, and add a card/link to `courses/index.html` and the homepage.

This keeps one GitHub repository and one AmooPrep brand while every course gets its own shareable/SEO-friendly page.
