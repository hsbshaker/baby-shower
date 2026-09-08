/**
 * Smoke test for lib/amazon.ts's parseRegistryHtml, run against a saved
 * copy of the real public registry page. Not a unit test framework —
 * just asserts + prints, run via `npm run test:parse`.
 */
import { readFileSync, existsSync } from 'node:fs';
import { parseRegistryHtml } from '../lib/amazon';

const REGISTRY_HTML_PATH =
  '/tmp/claude-0/-home-user-baby-shower/1140cd38-cf78-530e-acd1-f51f746819cb/scratchpad/registry.html';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  }
}

function main() {
  if (!existsSync(REGISTRY_HTML_PATH)) {
    console.log(
      `test-parse: skipping — saved registry HTML not found at ${REGISTRY_HTML_PATH}`,
    );
    return;
  }

  const html = readFileSync(REGISTRY_HTML_PATH, 'utf-8');
  const items = parseRegistryHtml(html);

  assert(items.length === 7, `expected 7 items, got ${items.length}`);

  for (const item of items) {
    assert(!!item.asin, `item ${item.amazon_item_id} missing asin`);
    assert(!!item.amazon_item_id, 'item missing amazon_item_id');
    assert(!!item.name, `item ${item.amazon_item_id} missing name`);
    assert(
      item.buy_url.includes('coliid='),
      `item ${item.amazon_item_id} buy_url missing coliid: ${item.buy_url}`,
    );
  }

  console.log(`Parsed ${items.length} items:\n`);
  for (const item of items) {
    console.log(
      `- ${item.name}\n` +
        `    asin=${item.asin} amazon_item_id=${item.amazon_item_id}\n` +
        `    price=${item.price === null ? 'null' : `$${item.price.toFixed(2)}`} ` +
        `qty=${item.qty_purchased} of ${item.qty_needed}\n` +
        `    image=${item.image_url}\n` +
        `    buy_url=${item.buy_url}\n`,
    );
  }

  if (process.exitCode === 1) {
    console.error('\ntest-parse: FAILED');
  } else {
    console.log('test-parse: PASSED');
  }
}

main();
