# AmooPrep multi-course architecture — v0.4.0

AmooPrep is now structured as one Chrome extension containing a course library.

- `data/catalog.json` lists the course packs visible in Course Library.
- `data/courses/<course-id>/` contains one course pack's content and Lemon Squeezy settings.
- Progress is stored separately per course.
- Premium license state is stored separately per course.
- The existing Greek & Roman v0.3 license/progress keys are automatically migrated so testing can continue without losing the activation.

## Add Course #2
1. Copy `data/courses/_course-template/` to a new folder such as `data/courses/programming-2/`.
2. Fill its JSON files with the new original course content.
3. Create a separate Lemon Squeezy product for that course and add its checkout URL, Product ID, and Variant ID to that course's `commerce.json`.
4. Add the course to `data/catalog.json`.
5. Add a matching course landing page to the AmooPrep website.

No new Chrome extension is needed.
