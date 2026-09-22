---
description: Price and availability for a Walmart item, pinned to one store
---

Check what a Walmart item costs and whether it can actually be had.

Ask me for the item and the store or ZIP if I have not given them. The item can be an `itemId` or a product URL.

Then:

1. Call `hasdata_walmart_product_getWalmartProduct` with `otherOffers` on. Report the price, the seller, the rating and the availability exactly as the payload states them.
2. Name the store the answer came from, reading `searchInformation.storeId` and the wording in `fulfillment.message`. Do not present a price without saying where it applies.
3. If other sellers are listed, show them with their prices so the buy box is not the whole story.
4. When I gave a second store or ZIP, repeat the call for it and put the two side by side.

Unavailable at one store is not unavailable everywhere, and the difference matters to the person asking. Say which of the two you actually checked.
