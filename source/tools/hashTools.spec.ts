import assert from "node:assert";
import { HashTools } from "./hashTools.js";

export class HashToolsTests
{
    generatesQuickHash()
    {
        const hash = HashTools.quickHash("test string", 35);
        assert.ok(hash >= 0 && hash < 2 ** 35);
    }

    throwsErrorForTooManyBits()
    {
        assert.throws(() => HashTools.quickHash("test", 54), Error);
    }
}
