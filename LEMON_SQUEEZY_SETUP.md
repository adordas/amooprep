# Lemon Squeezy setup — exact next steps

1. Create/sign in to your Lemon Squeezy account and finish the store onboarding/merchant verification requested by Lemon Squeezy.
2. Create a **Product** named: `AmooPrep — Greek & Roman Civilization Premium`.
3. Create a **one-time purchase** variant. Recommended launch price: **$9.99 one time**.
4. Enable **License Keys** for the product/variant. Recommended activation limit: **3 devices/browsers**. No expiration for the one-time purchase.
5. From the product Share menu, copy the reusable **hosted checkout URL** (`.../checkout/buy/...`). Do not copy the single-use cart URL.
6. Copy the Lemon Squeezy **Product ID** and **Variant ID**.
7. Open `data/commerce.json` and replace:
   - `checkoutUrl`
   - `expectedProductId`
   - `expectedVariantId`
   - support email and public policy URLs
8. Reload the unpacked extension in `chrome://extensions`.
9. Make a test purchase in Lemon Squeezy test mode, enter the license key + checkout email in Premium Access, and confirm Premium unlocks.
10. Test **Deactivate This Browser** and reactivation so activation limits behave correctly.

## Important implementation choice
AmooPrep opens Lemon Squeezy's **hosted checkout** in a browser tab. It does not embed Lemon.js in the extension. Manifest V3 does not allow remotely hosted executable JavaScript in an extension package.

The extension calls Lemon Squeezy's License API directly for activate/validate/deactivate and stores only the license key, instance ID, status, and study progress in `chrome.storage.local`. Card data never enters the extension.


## Current integration state
Checkout URL added: `https://amooprep.lemonsqueezy.com/checkout/buy/c70c2a13-08c4-4e7c-9143-5fb74da9967c`

Configured for test activation:
- Product ID: `1276326`
- Variant ID: `1995382`

Do not put a Lemon Squeezy secret API key in this extension. The client uses the public License API endpoints only.
