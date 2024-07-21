import assert from "node:assert";
import { EncodingTools } from "./encodingTools.ts";

export class EncodingToolsTests
{
    encodesNumberWithAlphaNumNonAmbiguous()
    {
        const result = EncodingTools.encode(1000, EncodingTools.Encodings.AlphaNumNonAmbiguous, 6);
        assert.strictEqual(result.length, 6);
        assert.strictEqual(result.every(char => EncodingTools.Encodings.AlphaNumNonAmbiguous.includes(char)), true);
    }

    encodesNumberWithBase64()
    {
        const result = EncodingTools.encode(1000, EncodingTools.Encodings.Base64, 6);
        assert.strictEqual(result.length, 6);
        assert.strictEqual(result.every(char => EncodingTools.Encodings.Base64.includes(char)), true);
    }

    convertsDecimalToBase()
    {
        //1000 is 3E8 in HEX
        const result = EncodingTools.decimalToBase(1000, 16);
        assert.deepStrictEqual(result.digits, [8, 14, 3]);
        assert.strictEqual(result.base, 16);
    }
}