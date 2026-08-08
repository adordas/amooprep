# AmooPrep v0.3.0 — License Test

This build is configured for the Lemon Squeezy **test-mode** product:

- Product ID: `1276326`
- Variant ID: `1995382`
- Activation limit: 3 (configured in Lemon Squeezy)
- License length: unlimited / never expires (configured in Lemon Squeezy)

## Test

1. Extract the ZIP.
2. Open `chrome://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the extracted `AmooPrep_Greek_Roman_Commercial_v0.3.0` folder.
5. Open AmooPrep, then **Premium Access**.
6. Enter the test purchase email and test license key.
7. Click **Activate License**.
8. Confirm AmooPrep says Premium is active and Lemon Squeezy changes from `0/3` to `1/3`.
9. Click **Check License** to validate the stored instance.
10. Click **Deactivate This Browser** and confirm Lemon Squeezy returns to `0/3`.

## Expected behavior

A key only unlocks this pack when Lemon Squeezy returns both:

- `product_id = 1276326`
- `variant_id = 1995382`

The extension stores the license key and Lemon Squeezy instance ID in `chrome.storage.local` so the same browser instance can be validated or deactivated later.

## Important

This is a test-integration build. Do not publish it to the Chrome Web Store yet. Premium question/flashcard data is still bundled in the package; production content protection should be improved before public launch.
