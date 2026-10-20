import { assertEquals } from "@std/assert";
import { fromFileUrl } from "@std/path";
import {
    liveSkip,
    loadFixture,
    runEndpoint,
    testSealedUnit,
} from "@shared/testing";

const ID = "bloomberry#vendors/all_vendors.json";
const fixturesDir = fromFileUrl(new URL("./fixtures/", import.meta.url));

Deno.test(`${ID} happy (recorded): free catalog — zero usage, array relayed`, async () => {
    const unit = await testSealedUnit(ID);
    const fixture = await loadFixture(`${fixturesDir}happy.json`);
    const result = await runEndpoint({
        unit,
        input: { queryParams: {} },
        mode: "replay",
        fixture,
    });
    assertEquals(result.httpStatus, 200);
    assertEquals(result.isProviderError, false);
    // FREE model: nothing folds, nothing is evidenced
    assertEquals(result.usage, { credits: {}, evidence: {} });
    const output = result.output as { name: string; category: string }[];
    // the recorder trims arrays to 2 — the live catalog is 1,700+ rows
    assertEquals(output.length, 2);
    assertEquals(typeof output[0].name, "string");
    assertEquals(typeof output[0].category, "string");
});

Deno.test({
    name: `${ID} live (gated on BLOOMBERRY_CREDENTIALS_API_KEY; free)`,
    ignore: liveSkip("bloomberry"),
    fn: async () => {
        const unit = await testSealedUnit(ID);
        const result = await runEndpoint({
            unit,
            input: { queryParams: {} },
            mode: "live",
        });
        assertEquals(
            result.isProviderError,
            false,
            JSON.stringify(result.output).slice(0, 300),
        );
        assertEquals(result.usage, { credits: {}, evidence: {} });
        assertEquals((result.output as unknown[]).length > 1000, true);
    },
});
