// Tool contract test.
//
// The README promises three tools with specific names and a documented parameter set. The
// upstream list can change without a single commit here, and the README would start lying
// silently. These checks catch that before a user does.
//
// None of the three tools declares a required parameter, because each accepts one of two
// inputs: an item id or a URL, a keyword or a category id. A flat `required` array cannot say
// "either of these", so asserting on it would pass while the schema said nothing at all. The
// alternatives are pinned by name instead.
//
// One test calls a tool for real. Listing tools accepts any non-empty key, so a contract check
// that only lists tools stays green with a revoked or mistyped key. That call costs 10 credits,
// which is the price of a canary that can fail for the right reason.
//
// Run: HASDATA_API_KEY=your_key_here npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';

const ENDPOINT = 'https://mcp.hasdata.com/api/mcp?apis=walmart';
const KEY = process.env.HASDATA_API_KEY;
const TIMEOUT_MS = 30_000;

// Tool name mapped to the groups of parameters it must still offer. Every group is an
// either/or: at least one member has to be present for the documented workflow to hold.
const EXPECTED = {
    hasdata_walmart_search_getSearchResults: [['q', 'catId'], ['sort'], ['facet'], ['page']],
    hasdata_walmart_product_getWalmartProduct: [['itemId', 'url'], ['otherOffers'], ['domain']],
    hasdata_walmart_reviews_getWalmartReviews: [['itemId', 'url'], ['aspectId'], ['rating'], ['verifiedPurchasesOnly']],
};

// Enum values the README spells out.
const ENUMS = {
    hasdata_walmart_search_getSearchResults: {
        domain: ['walmart.com', 'walmart.ca'],
        sort: ['bestMatch', 'priceLowToHigh', 'priceHighToLow', 'bestseller', 'highlyRated', 'newArrivals'],
        deliveryType: ['shipping', 'pickup'],
    },
    hasdata_walmart_reviews_getWalmartReviews: {
        sort: ['mostRelevant', 'mostRecent', 'mostHelpful', 'highestRated', 'lowestRated', 'oldest'],
    },
};

// A streamable HTTP body arrives either as plain JSON or as server-sent events. One SSE event
// can span several data: lines, several events can share one response, and a server is free to
// send progress notifications before the answer. So collect every event and pick the message
// carrying our request id instead of trusting the first data: line.
function parseRpc(raw, id) {
    const trimmed = raw.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) return JSON.parse(trimmed);

    const messages = [];
    for (const event of trimmed.split(/\r?\n\r?\n+/)) {
        const data = event
            .split(/\r?\n/)
            .filter((l) => l.startsWith('data:'))
            .map((l) => l.slice(5).replace(/^ /, ''))
            .join('\n');
        if (!data || data === '[DONE]') continue;
        try {
            messages.push(JSON.parse(data));
        } catch {
            // A keep-alive or a partial event is not our response.
        }
    }
    assert.ok(messages.length, `no JSON-RPC message in the response: ${raw.slice(0, 300)}`);
    const match = messages.find((m) => m.id === id);
    assert.ok(match, `no message with id ${id} in the response: ${raw.slice(0, 300)}`);
    return match;
}

let nextId = 1;

async function rpc(method, params = {}) {
    // The CI key sits on the free plan, where concurrency is 1. When several of
    // these repos are pushed at once their contract runs collide, and HasData
    // answers 429 with code concurrency_limit straight away rather than queueing.
    // That is a plan limit, not a broken contract, so the call is retried before
    // the test gives up. A 401 still fails on the first attempt.
    for (let attempt = 1; ; attempt++) {
        const id = nextId++;
        const res = await fetch(ENDPOINT, {
            method: 'POST',
            headers: {
                'x-api-key': KEY,
                'Content-Type': 'application/json',
                // The server answers over streamable HTTP, so accept both a plain body and a stream.
                Accept: 'application/json, text/event-stream',
            },
            body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        assert.equal(res.status, 200, `${method} returned ${res.status}`);
        const raw = await res.text();
        if (raw.includes('concurrency_limit') && attempt < 5) {
            await new Promise((r) => setTimeout(r, attempt * 4000));
            continue;
        }
        return { raw, body: parseRpc(raw, id) };
    }
}

// One network round trip for every test that needs the list.
let toolsPromise;
function listTools() {
    toolsPromise ??= rpc('tools/list').then(({ body }) => {
        assert.ok(body.result?.tools, 'the response carried no result.tools');
        return body.result.tools;
    });
    return toolsPromise;
}

const live = { skip: KEY ? false : 'HASDATA_API_KEY is not set, skipping the live checks' };

test('apis=walmart exposes the documented tools and nothing else', live, async () => {
    const tools = await listTools();
    const names = tools.map((t) => t.name).sort().join(', ');
    assert.equal(
        tools.length,
        Object.keys(EXPECTED).length,
        `expected ${Object.keys(EXPECTED).length} tools, got ${tools.length}: ${names}`
    );
});

test('the tool names have not changed', live, async () => {
    const tools = await listTools();
    const names = new Set(tools.map((t) => t.name));
    for (const expected of Object.keys(EXPECTED)) {
        assert.ok(names.has(expected), `tool ${expected} is missing from the list`);
    }
});

test('every tool carries a description', live, async () => {
    const tools = await listTools();
    for (const tool of tools) {
        assert.ok(
            (tool.description || '').trim().length > 20,
            `${tool.name} has an empty or near-empty description`
        );
    }
});

test('the parameters the README documents are still in the schema', live, async () => {
    const tools = await listTools();
    for (const tool of tools) {
        const groups = EXPECTED[tool.name];
        assert.ok(groups, `tool ${tool.name} is not covered by this test`);
        const props = tool.inputSchema?.properties ?? {};
        for (const group of groups) {
            assert.ok(
                group.some((p) => props[p]),
                `${tool.name} offers none of ${group.join(' or ')}, which the README documents`
            );
        }
    }
});

test('the enum values the README lists are still offered', live, async () => {
    const tools = await listTools();
    for (const [name, params] of Object.entries(ENUMS)) {
        const tool = tools.find((t) => t.name === name);
        assert.ok(tool, `tool ${name} is missing from the list`);
        const props = tool.inputSchema?.properties ?? {};
        for (const [param, values] of Object.entries(params)) {
            const schema = props[param];
            assert.ok(schema, `${name} no longer accepts ${param}`);
            const offered = schema.enum ?? schema.items?.enum ?? [];
            for (const value of values) {
                assert.ok(
                    offered.includes(value),
                    `${name}.${param} no longer accepts ${value}, offers: ${offered.join(', ') || 'no enum'}`
                );
            }
        }
    }
});

test('the key is accepted by HasData', live, async () => {
    const { raw } = await rpc('tools/call', {
        name: 'hasdata_walmart_search_getSearchResults',
        arguments: { q: 'laptop stand' },
    });
    assert.ok(!raw.includes('401 Unauthorized'), 'HasData rejected the key');
    assert.ok(!raw.includes('"isError":true'), `the tool call failed: ${raw.slice(0, 300)}`);
});
