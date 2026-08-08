# AmooPrep course-pack template

Copy this folder and rename it to a lowercase course ID such as `programming-2`.

A complete course pack uses these files:
- `course.json` — title, counts, disclaimer, purpose.
- `commerce.json` — Lemon Squeezy checkout, product ID, variant ID, price, policies.
- `units.json` — topic/unit map.
- `concepts.json` — concepts tracked by adaptive review.
- `questions.json` — original practice bank.
- `flashcards.json` — flashcard bank.
- `timeline.json` — optional timeline items (use `[]` if not relevant).
- `people.json` — optional people/ideas items (use `[]` if not relevant).

Then add one entry to `data/catalog.json`. The AmooPrep app will show the new pack in Course Library without creating a separate Chrome extension.
