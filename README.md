# Walmart MCP Server

<!-- mcp-name: com.hasdata/walmart -->

A hosted Model Context Protocol (MCP) server that gives Claude, Cursor, Windsurf and any other MCP client three read-only Walmart tools. Run a keyword or category search, read one item with the seller holding the buy box, and page through its customer reviews, all as structured JSON, with no Walmart developer account and nothing to host.

It reads public Walmart pages that a signed-out visitor can see, on `walmart.com` and `walmart.ca`.

**1,000 free credits every month, no card required**, which is 100 Walmart calls at the 10-credit rate.

```
https://mcp.hasdata.com/api/mcp?apis=walmart
```

[![Glama score](https://glama.ai/mcp/servers/HasData/walmart-mcp/badges/score.svg)](https://glama.ai/mcp/servers/HasData/walmart-mcp)
[![tool contract](https://github.com/HasData/walmart-mcp/actions/workflows/contract.yml/badge.svg)](https://github.com/HasData/walmart-mcp/actions/workflows/contract.yml)
[![MCP](https://img.shields.io/badge/MCP-remote%20%7C%20streamable%20HTTP-6366f1?style=flat-square)](https://mcp.hasdata.com/api/mcp?apis=walmart)
[![Tools](https://img.shields.io/badge/tools-3-10b981?style=flat-square)](#tools)
[![npm](https://img.shields.io/npm/v/@hasdata/walmart-mcp?style=flat-square&logo=npm&label=npm&color=cb3837)](https://www.npmjs.com/package/@hasdata/walmart-mcp)
[![PyPI](https://img.shields.io/pypi/v/hasdata-walmart-mcp?style=flat-square&logo=pypi&logoColor=white&label=PyPI&color=3775a9)](https://pypi.org/project/hasdata-walmart-mcp/)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

## Contents

- [What you need](#what-you-need)
- [Quick start](#quick-start)
- [Example prompts](#example-prompts)
- [Tools](#tools)
- [Errors and failure paths](#errors-and-failure-paths)
- [Pricing, free tier and limits](#pricing-free-tier-and-limits)
- [Tool selection](#tool-selection)
- [How it compares](#how-it-compares)
- [FAQ](#faq)
- [HasData links](#hasdata-links)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## What you need

An MCP client and a HasData API key from the [dashboard](https://app.hasdata.com/sign-up?utm_source=github&utm_medium=syndication&utm_campaign=walmart-mcp), free to create with no card, and the free tier covers about 100 calls a month at the 10-credit rate. This is a remote server, so the simplest path is a URL and an `x-api-key` header, with no container to run. A client that only speaks stdio reaches it through a thin launcher, published as `@hasdata/walmart-mcp` on npm and `hasdata-walmart-mcp` on PyPI, shown below.

## Quick start

The server URL is the same for every client. We run it hands-on in Claude Code and Claude Desktop. The other blocks follow each client's own documented format for a remote server.

| Field | Value |
| :--- | :--- |
| URL | `https://mcp.hasdata.com/api/mcp?apis=walmart` |
| Transport | HTTP, streamable |
| Auth header | `x-api-key: HASDATA_API_KEY` |

Clients with OAuth support can add the same URL as a connector and sign in without putting a key in a config file.

<details>
<summary><b>Claude Code</b></summary>

```bash
claude mcp add --transport http walmart "https://mcp.hasdata.com/api/mcp?apis=walmart" \
  --header "x-api-key: HASDATA_API_KEY"
```

</details>

<details>
<summary><b>Claude Desktop</b></summary>

Settings, then Connectors, then Add custom connector, then paste `https://mcp.hasdata.com/api/mcp?apis=walmart` and sign in.

For the config-file route, Claude Desktop loads only local (stdio) servers, so it reaches a remote server through a stdio launcher. The `@hasdata/walmart-mcp` package is that launcher, and it reads the key from the environment. Add this to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "walmart": {
      "command": "npx",
      "args": ["-y", "@hasdata/walmart-mcp"],
      "env": { "HASDATA_API_KEY": "YOUR_KEY" }
    }
  }
}
```

For Python instead of Node, swap the launcher for the PyPI package, which `uvx` runs without a manual install:

```json
{
  "mcpServers": {
    "walmart": {
      "command": "uvx",
      "args": ["hasdata-walmart-mcp"],
      "env": { "HASDATA_API_KEY": "YOUR_KEY" }
    }
  }
}
```

</details>

<details>
<summary><b>Cursor</b></summary>

`~/.cursor/mcp.json` for every project, or `.cursor/mcp.json` for one:

```json
{
  "mcpServers": {
    "walmart": {
      "url": "https://mcp.hasdata.com/api/mcp?apis=walmart",
      "headers": { "x-api-key": "HASDATA_API_KEY" }
    }
  }
}
```

</details>

<details>
<summary><b>Windsurf</b></summary>

`~/.codeium/windsurf/mcp_config.json`. Windsurf calls the field `serverUrl`, not `url`:

```json
{
  "mcpServers": {
    "walmart": {
      "serverUrl": "https://mcp.hasdata.com/api/mcp?apis=walmart",
      "headers": { "x-api-key": "HASDATA_API_KEY" }
    }
  }
}
```

</details>

<details>
<summary><b>VS Code</b></summary>

`.vscode/mcp.json` in the workspace:

```json
{
  "servers": {
    "walmart": {
      "type": "http",
      "url": "https://mcp.hasdata.com/api/mcp?apis=walmart",
      "headers": { "x-api-key": "HASDATA_API_KEY" }
    }
  }
}
```

</details>

## Example prompts

Each of these lands on one tool, or on two in sequence when the second needs the item id the first returns.

- Find laptop stands under $30 on Walmart and sort them by price.
- What does item 18493462688 cost right now, and who holds the buy box?
- Show me every other seller offering this item and what they charge with shipping.
- Read the reviews of this item that mention battery life.
- Pull only the verified-purchase reviews of this item and summarise the complaints.
- Compare the price of this item on walmart.com and walmart.ca.

A prompt that names a product rather than an item id takes two calls, one search to resolve the id and one product lookup to read it. Reviews work the same way, and the search result carries the id both need.

## Tools

Three tools, 10 credits per successful call. Each takes `domain`, either `walmart.com` or `walmart.ca`, and `language`, where `walmart.com` serves `en` and `es` while `walmart.ca` serves `en` and `fr`. A language the storefront does not offer falls back to its default.

Item ids are storefront-scoped. On `walmart.com` they are numeric, such as `18493462688`, and on `walmart.ca` alphanumeric, such as `6NZMJ5CW6MH2`. An id from one storefront does not resolve on the other.

### Get Walmart search results

[`hasdata_walmart_search_getSearchResults`](https://docs.hasdata.com/apis/walmart/search?utm_source=github&utm_medium=syndication&utm_campaign=walmart-mcp)

A page of search results for a keyword, a category, or both.

| Parameter | Type | Required | Notes |
| :--- | :--- | :--- | :--- |
| `q` | string | see below | The search term |
| `catId` | string | see below | Category id from a category URL, such as `976759_1086446_1229651` |
| `url` | string | | A full Walmart search or category URL, scraped as is. Overrides the parameters above |
| `domain` | string | | `walmart.com` or `walmart.ca` |
| `language` | string | | `en`, `es` or `fr`, subject to the storefront |
| `sort` | string | | `bestMatch`, `priceLowToHigh`, `priceHighToLow`, `bestseller`, `highlyRated` or `newArrivals` |
| `page` | number | | Result page, starting at 1 |
| `minPrice` / `maxPrice` | number | | Price band in the storefront currency |
| `deliveryType` | string | | `shipping` or `pickup` |
| `facet` | string | | One filter in `name:value` form, such as `brand:Great Value` |

Send `q` to search, `catId` to browse a whole category, or both to search inside one. Neither appears in the schema's `required` array because either one satisfies the call on its own.

Returns `searchInformation`, a `productResults` array, a `facets` block and `pagination`. Each result carries `position`, `id`, `title`, `url`, `brand`, `isSponsored`, `badges`, `walmartPlusSavings`, `categoryPathId`, a `price` object, `reviews` with `rating` and `totalReviews`, `image`, `seller`, `availability` and `fulfillment`.

The `facets` block is the map of every filter the query supports, and each value carries the exact string to send back in `facet`. Running one unfiltered search to read the facets is cheaper than guessing.

```json
{
  "position": 1,
  "id": "18493462688",
  "title": "Incipio Portable Foldable Aluminum Laptop Stand and Riser with Adjustable Angles, Anti-Slip and Ventilated Design",
  "url": "https://www.walmart.com/ip/Portable-Laptop-Stand-Black/18493462688",
  "isSponsored": true,
  "badges": ["Overall pick"],
  "walmartPlusSavings": true,
  "categoryPathId": "4125_4134_1074326_9623037_7875081",
  "price": { "currentPrice": 9.96, "currentPriceDisplay": "$9.96" },
  "reviews": { "rating": 4.5, "totalReviews": 49 }
}
```

### Get Walmart product details

[`hasdata_walmart_product_getWalmartProduct`](https://docs.hasdata.com/apis/walmart/product?utm_source=github&utm_medium=syndication&utm_campaign=walmart-mcp)

One item in full.

| Parameter | Type | Required | Notes |
| :--- | :--- | :--- | :--- |
| `itemId` | string | see below | The Walmart item id |
| `url` | string | see below | A full product URL, scraped as is. Overrides `itemId` and sets the storefront |
| `domain` | string | | `walmart.com` or `walmart.ca`, ignored when `url` is given |
| `language` | string | | `en`, `es` or `fr`, subject to the storefront |
| `otherOffers` | boolean | | Also collect competing offers. Costs 5 credits on top, 15 instead of 10 |

Pass `itemId` or `url`. As with search, neither is listed as required because either one works alone.

Returns a `product` object with `itemId`, `title`, `url`, `brand`, `brandUrl`, `type`, `model`, `upc`, `condition`, `badges`, `availability`, a `price` object, the `seller` holding the buy box, `reviews`, `images`, `categoryPath`, `categoryPathId`, `highlights`, `specifications`, `keyItemFeatures`, `productDetails` and `fulfillment`.

The base call already reports how many competitors the page advertises and the cheapest competing price. Turn on `otherOffers` only when you need the offers themselves, because it takes a second request to Walmart and costs half again as much.

```json
{
  "itemId": "18493462688",
  "brand": "Incipio",
  "condition": "New",
  "price": { "currentPrice": 9.96, "currentPriceDisplay": "$9.96", "currency": "USD" },
  "seller": {
    "name": "Walmart.com",
    "id": "F55CDC31AB754BB68FE0B39041159D63",
    "returnPolicy": "Free 30-day returns"
  },
  "reviews": {
    "totalReviews": 49,
    "rating": 4.5,
    "fiveStars": 38,
    "fourStars": 4,
    "threeStars": 3,
    "twoStars": 1,
    "oneStar": 3
  },
  "specifications": [{ "name": "Maximum screen size", "value": "16 in" }],
  "fulfillment": {
    "type": "FC",
    "message": "Pickup, today at Fredericksburg Massaponax Supercenter",
    "deliveryDate": "2026-09-09T21:59:00.000Z"
  }
}
```

### Get Walmart product reviews

[`hasdata_walmart_reviews_getWalmartReviews`](https://docs.hasdata.com/apis/walmart/reviews?utm_source=github&utm_medium=syndication&utm_campaign=walmart-mcp)

The review feed of one item, ten reviews a page.

| Parameter | Type | Required | Notes |
| :--- | :--- | :--- | :--- |
| `itemId` | string | see below | The Walmart item id |
| `url` | string | see below | A full product URL whose reviews to read. Overrides `itemId` |
| `domain` | string | | `walmart.com` or `walmart.ca`, ignored when `url` is given |
| `language` | string | | Language of the review page, not of the reviews themselves |
| `page` | number | | Review page, ten a page |
| `sort` | string | | `mostRelevant`, `mostRecent`, `mostHelpful`, `highestRated`, `lowestRated` or `oldest` |
| `rating` | number | | Keep one star rating, 1 to 5 |
| `aspectId` | string | | Keep reviews mentioning one topic, by its id |
| `condition` | string | | Keep reviews about one condition of the item |
| `verifiedPurchasesOnly` | boolean | | Keep only purchases Walmart confirmed |

Returns `reviewsInformation`, a `reviewResults` array, a `filters` block, `appliedFilters` and `pagination`.

`filters` is the part worth reading first. It lists the star ratings, frequent mentions and conditions this item can actually be filtered by, each with a count and with the exact `value` to send back. Given `{"name": "Battery Life", "value": "6049", "count": 8}` you send `aspectId: "6049"` and expect eight reviews. Guessing an aspect id instead of reading it here is the usual way to get an empty page.

`reviewsInformation` carries the item rating, the per-star breakdown, per-aspect scores and Walmart's AI review summary. It also separates `totalRatings` from `totalReviews`, which matter separately: the item below has 49 ratings but only 21 written reviews, and paging covers the 21.

```json
{
  "reviewsInformation": {
    "rating": 4.49,
    "totalRatings": 49,
    "totalReviews": 21,
    "recommendedPercentage": 100,
    "ratingBreakdown": { "fiveStars": 38, "fourStars": 4, "threeStars": 3, "twoStars": 1, "oneStar": 3 }
  },
  "reviewResults": [
    {
      "position": 1,
      "id": "434698083",
      "rating": 5,
      "title": "Good value laptop stand.",
      "text": "Good value for money. Not the sturdiest, but that is to be expected for a collapsible laptop stand. Overall gets the job done, I'd buy it again.",
      "date": "8/1/2026",
      "verifiedPurchase": true,
      "helpfulVotes": 0,
      "notHelpfulVotes": 0,
      "badges": ["Verified Purchase"],
      "seller": "Walmart.com",
      "language": "English",
      "aspects": [{ "id": "284", "polarity": "Positive" }]
    }
  ],
  "filters": [
    { "name": "Star rating", "parameter": "rating", "values": [{ "name": "5 stars", "value": "5", "count": 38 }] },
    { "name": "Frequent mentions", "parameter": "aspectId", "values": [{ "name": "Sturdiness", "value": "828", "count": 6 }] }
  ],
  "pagination": { "currentPage": 1, "reviewsPerPage": 10, "totalPages": 3, "totalResults": 21, "nextPage": 2 }
}
```

## Errors and failure paths

Plan for these rather than assuming a happy path.

**Two totals disagree in one search response, and both are correct.** `searchInformation.totalResultsDisplay` is the string Walmart prints on the page, such as `"1000+"`, while `pagination.totalResults` is the number behind it, such as `8005`. One is display text and the other is an integer, so do not parse the first or print the second.

**Walmart stops serving results after roughly page 10.** Beyond that the page comes back empty rather than erroring. A large keyword cannot be enumerated by paging, so narrow it with `facet`, a price band or a category instead.

**Prices belong to one store, and the response says which.** `searchInformation.storeId` names it, and `fulfillment.message` names it in words, down to `"Pickup, today at Fredericksburg Massaponax Supercenter"`. Comparing prices across calls only means something while that store stays the same.

**`deliveryType: pickup` is answered against a single store.** An item in stock nationally can still come back unavailable, because it is unavailable at that one store rather than everywhere.

**The product tool reports ratings where you might read reviews.** Its `reviews.totalReviews` is the count of ratings, 49 for the item above, while the reviews tool reports 49 ratings and 21 written reviews separately. Use the reviews tool when the distinction matters.

**Review dates are `M/D/YYYY` strings.** `"8/1/2026"` is the first of August, not the eighth of January. Parse with the format in hand rather than letting a date library guess.

**A review can carry an aspect id absent from `filters`.** The block lists the topics the item can be filtered by, which is a shorter list than the topics its reviews were tagged with. Read aspects off the review, and filter only with ids the block offers.

**`variants` is missing rather than empty on an item with no variants.** Check for the key before you read it.

**Only one `condition` per request.** The parameter takes a single value, so a query across two conditions is two calls.

Results that carry data also carry a `requestMetadata.id` worth quoting in support.

## Pricing, free tier and limits

Each Walmart tool costs **10 credits per successful call**. Turning on `otherOffers` adds 5 credits to the product call, 15 instead of 10, so leave it off unless the competing offers are the point. Response size does not change the price.

The free tier is **1,000 credits every month with no card**, which is 100 Walmart calls at the base rate. It renews with the billing cycle, so a low-volume agent runs on the free tier indefinitely.

Paid plans start at **$49 a month** for 200,000 credits, which is 20,000 calls. The unit price falls with volume, from **$2.45 per 1,000 calls** on the entry plan to **$1.00** on Business, **$0.84** on Growth and **$0.74** on the largest [high-volume plans](https://hasdata.com/prices?utm_source=github&utm_medium=syndication&utm_campaign=walmart-mcp).

Your plan also sets concurrency. The free tier allows 1 request at a time, Startup 15, Business 30, Growth 50, and the high-volume plans run from 200 to 1,500. Retry on the 429 with a backoff in anything unattended, because an agent that fans out across item ids will reach the ceiling before you do.

A request that comes back non-200 is not billed. A successful call that finds nothing is still a call.

## Tool selection

Start from what the prompt gives you. A keyword or a category goes to the search tool, an item id goes straight to the product or reviews tool. Spending a search call to reach an id you already have is the most common waste.

Then pick by what the question is about. The search result is enough for ranking, price sweeps and share-of-shelf work across many items. The product tool is the only one carrying specifications, the buy-box seller and the competing-offer count. The reviews tool is the only one carrying review text.

Read the `filters` block before you filter. One unfiltered reviews call tells you which ratings, topics and conditions exist and how many reviews each holds, which turns a guessed filter into a known one.

## How it compares

Walmart's own Affiliate and Marketplace APIs are the official routes to this data, and they answer different questions.

| | Walmart Affiliate API | Walmart Marketplace API | This server |
| :--- | :--- | :--- | :--- |
| Eligibility | An approved affiliate account | A Walmart seller account | An API key |
| Scope | Items in the affiliate catalogue | Your own listings and orders | Any public item page |
| Competing sellers | Not returned | Your own offers only | The offer list, with `otherOffers` |
| Review text | Not returned | Reviews of your items | The feed, with filters |
| Buy box | Not returned | For your items | Whoever holds it |
| `walmart.ca` | Separate programme | Separate account | A parameter |
| Cost | Free, when you qualify | Free with a seller account | Paid past the free tier |

The row that decides it is scope. Both official APIs answer questions about a catalogue you have a commercial relationship with, which rules them out for watching a competitor. When the items are yours, the Marketplace API is authoritative and free, and you should use it.

## FAQ

### Is there an official Walmart MCP server?

Walmart does not publish one. This one is maintained by HasData and reads public Walmart pages.

### What is a Walmart MCP server?

An MCP server exposes tools an AI client can call. This one turns Walmart search results, item pages and review feeds into JSON an agent can reason over, without a browser or a scraping library in your stack.

### Do I need a Walmart account or a seller account?

No. The only credential is your HasData key.

### Which storefronts are covered?

`walmart.com` and `walmart.ca`. They hold separate catalogues, item ids, prices and currencies, so a cross-storefront comparison is a real comparison rather than a currency conversion.

### Why did my item id return nothing?

Most often because it belongs to the other storefront. A numeric id is `walmart.com` and an alphanumeric one is `walmart.ca`, and neither resolves on the other. Pass `domain` to match, or pass the full `url` and let it set the storefront.

### How do I get the competing offers?

Set `otherOffers` on the product call. Each offer comes back with the seller name, storefront URL, price, condition, shipping cost, delivery date and return policy. It costs 5 credits more, because it takes a second request to Walmart.

### Why does the same search return different prices on different days?

Partly because prices move, and partly because the response is answered against one Walmart store, reported as `searchInformation.storeId`. Hold that store constant before reading a price change as a price change.

### Can I use this together with other HasData APIs?

Yes. One key covers everything, and one endpoint serves them all through the `apis` parameter. Point a client at `?apis=walmart,amazon` to get both tool sets in one connection, or at [`mcp.hasdata.com/api/mcp`](https://docs.hasdata.com/mcp-server?utm_source=github&utm_medium=syndication&utm_campaign=walmart-mcp) for the full catalogue.

### Is HasData affiliated with Walmart?

No. HasData is an independent service and is not affiliated with, endorsed by, or sponsored by Walmart. Walmart is a trademark of its respective owner. The tools work with publicly available data only, and you are responsible for using the results in line with Walmart's terms and the law that applies to you.

### Compliance and personal data

Reviews carry an author name as the reviewer chose to publish it, along with a verified-purchase flag. Marketplace seller entries carry a business name and a storefront URL. Neither block needs the author fields for sentiment or pricing work, so drop them unless your purpose needs them, and check your own obligations before storing them.

## HasData links

- [Walmart API documentation](https://docs.hasdata.com/apis/walmart/search?utm_source=github&utm_medium=syndication&utm_campaign=walmart-mcp), the REST endpoints behind these tools
- [MCP server documentation](https://docs.hasdata.com/mcp-server?utm_source=github&utm_medium=syndication&utm_campaign=walmart-mcp)
- [Pricing](https://hasdata.com/prices?utm_source=github&utm_medium=syndication&utm_campaign=walmart-mcp)
- [Dashboard](https://app.hasdata.com/sign-up?utm_source=github&utm_medium=syndication&utm_campaign=walmart-mcp)

Other HasData MCP servers: [Google Search](https://github.com/HasData/google-search-mcp), [Google Maps](https://github.com/HasData/google-maps-mcp), [Google Trends](https://github.com/HasData/google-trends-mcp), [Google Flights](https://github.com/HasData/google-flights-mcp), [DuckDuckGo](https://github.com/HasData/duckduckgo-mcp), [YouTube](https://github.com/HasData/youtube-mcp), [TikTok](https://github.com/HasData/tiktok-mcp), [Instagram](https://github.com/HasData/instagram-mcp), [Amazon](https://github.com/HasData/amazon-mcp), [Shopify](https://github.com/HasData/shopify-mcp), [Yelp](https://github.com/HasData/yelp-mcp), [Zillow](https://github.com/HasData/zillow-mcp), [Redfin](https://github.com/HasData/redfin-mcp), [Airbnb](https://github.com/HasData/airbnb-mcp), [Booking.com](https://github.com/HasData/booking-mcp), [Indeed](https://github.com/HasData/indeed-mcp).

## Development

The launcher is a thin stdio bridge to the remote server, so there is nothing to build.

```bash
npm install
HASDATA_API_KEY=your_key_here npm test
```

The tests in `test/` assert the tool contract, the part that can break without a commit here. They check that `?apis=walmart` returns the expected tool count, that no name changed, that every tool still carries a description, that the either/or parameters this README documents are still in the schema, and that the key in use is actually accepted. That last check calls a tool for real and costs 10 credits, which is the price of a canary that can fail for the right reason.

None of the three tools declares a required parameter, because each accepts one of two inputs. The suite pins the alternatives instead of the `required` array, which would pass while the schema said nothing.

The contract suite also runs weekly on a schedule, because the upstream tool list can change without anyone touching this repository.

## Contributing

A tool table, a response sample or a documented behaviour that does not match reality is worth an issue. There is a template for exactly that. Pull requests are welcome for the same, and for anything in the launcher.

## License

MIT, see [LICENSE](LICENSE).
