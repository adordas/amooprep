# AmooPrep — Commercial Foundation v0.1.0

This is the public/commercial branch. It is separate from the private course-specific extension.

**Brand:** AmooPrep  
**First course pack:** Greek & Roman Civilization — Final Review

The build intentionally contains **no UOP/University branding, no school name, no course code, and none of the exact 40 review questions** from the private version. The commercial question bank contains 198 original practice items written around historical concepts.

## Free vs Premium
- Free: 32 questions (4 per topic), 24 flashcards, timeline, people/ideas, progress tracking, 10-question mock.
- Premium: all 198 questions, all 99 flashcards, 20/40/60-question mocks, full adaptive bank.

## Before selling
Complete `LEMON_SQUEEZY_SETUP.md`, then edit `data/commerce.json`.


## v0.3.0 commerce status
The reusable Lemon Squeezy checkout URL is now wired into the Buy Premium button. Privacy, Terms, and Refund links point to the public AmooPrep GitHub Pages site. License activation remains intentionally locked until the numeric Lemon Squeezy Product ID and Variant ID are added to `data/commerce.json`.


## v0.3.0 licensing test

This build is configured for the AmooPrep Greek & Roman Civilization Premium Lemon Squeezy product.

- Product ID: `1276326`
- Variant ID: `1995382`
- Checkout URL: `https://amooprep.lemonsqueezy.com/checkout/buy/c70c2a13-08c4-4e7c-9143-5fb74da9967c`

Use a Lemon Squeezy **test-mode** license for testing. A successful activation should increase the license activation count from `0/3` to `1/3`. Deactivating the browser should return it to `0/3`.

This is a licensing integration test build. Premium content is still packaged with the extension and gated by license state; move premium content delivery behind an authenticated download before treating content protection as production-grade.

## v0.4.0 multi-course update
AmooPrep now opens to a Course Library and loads course packs from `data/courses/<course-id>/`. Greek & Roman Civilization remains Course #1. See `MULTI_COURSE_ARCHITECTURE.md` before adding Course #2.
