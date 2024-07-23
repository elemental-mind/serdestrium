import assert from "node:assert";
import { JSONInterpreter } from "./JSONInterpreter.js";

export class InterpretJSONStringTests
{
    parsesSimpleString()
    {
        const interpreter = new JSONInterpreter();
        const result = interpreter.parse('"Hello World"');
        assert.strictEqual(result, "Hello World");
    }

    parsesEscapedString()
    {
        const interpreter = new JSONInterpreter();
        const result = interpreter.parse('"Hello \\"World\\""');
        assert.strictEqual(result, 'Hello "World"');
    }
}

export class InterpretJSONNumberTests
{
    parsesSimpleNumber()
    {
        const interpreter = new JSONInterpreter();
        const result = interpreter.parse("123");
        assert.strictEqual(result, 123);
    }

    parsesNegativeNumber()
    {
        const interpreter = new JSONInterpreter();
        const result = interpreter.parse("-123");
        assert.strictEqual(result, -123);
    }

    parsesFloatNumber()
    {
        const interpreter = new JSONInterpreter();
        const result = interpreter.parse("123.456");
        assert.strictEqual(result, 123.456);
    }
}

export class InterpretJSONBooleanTests
{
    parsesTrueBoolean()
    {
        const interpreter = new JSONInterpreter();
        const result = interpreter.parse("true");
        assert.strictEqual(result, true);
    }

    parsesFalseBoolean()
    {
        const interpreter = new JSONInterpreter();
        const result = interpreter.parse("false");
        assert.strictEqual(result, false);
    }
}

export class InterpretJSONNullTests
{
    parsesNullValue()
    {
        const interpreter = new JSONInterpreter();
        const result = interpreter.parse("null");
        assert.strictEqual(result, null);
    }
}

export class InterpretJSONObjectTests
{
    parsesSimpleObject()
    {
        const interpreter = new JSONInterpreter();
        const result = interpreter.parse('{"key": "value"}');
        assert.deepStrictEqual(result, { key: "value" });
    }

    parsesNestedObject()
    {
        const interpreter = new JSONInterpreter();
        const result = interpreter.parse('{"key": {"nestedKey": "nestedValue"}}');
        assert.deepStrictEqual(result, { key: { nestedKey: "nestedValue" } });
    }
}

export class InterpretJSONArrayTests
{
    parsesSimpleArray()
    {
        const interpreter = new JSONInterpreter();
        const result = interpreter.parse('["value1", "value2"]');
        assert.deepStrictEqual(result, ["value1", "value2"]);
    }

    parsesNestedArray()
    {
        const interpreter = new JSONInterpreter();
        const result = interpreter.parse('[[1, 2], [3, 4]]');
        assert.deepStrictEqual(result, [[1, 2], [3, 4]]);
    }
}


export class InterpretJSONSpecialValuesTests
{
    parsesSymbolValue()
    {
        const testSymbol = Symbol("test");
        const interpreter = new JSONInterpreter({ knownSymbols: new Map([[testSymbol, "test"]]) });
        const result = interpreter.parse('"[sym: test]"');
        assert.strictEqual(typeof result, 'symbol');
        assert.strictEqual(result.toString(), 'Symbol(test)');
    }

    parsesConstNaN()
    {
        const interpreter = new JSONInterpreter();
        const result = interpreter.parse('"[const: NaN]"');
        assert.strictEqual(isNaN(result), true);
    }

    parsesConstInfinity()
    {
        const interpreter = new JSONInterpreter();
        const result = interpreter.parse('"[const: Infinity]"');
        assert.strictEqual(result, Infinity);
    }

    parsesConstUndefined()
    {
        const interpreter = new JSONInterpreter();
        const result = interpreter.parse('{"key": "[const: Undefined]"}');
        assert.strictEqual(result.key, undefined);
    }

    parsesRefValue()
    {
        const ambientEnvironmentObject = {};
        const interpreter = new JSONInterpreter({ knownObjects: new Map([[ambientEnvironmentObject, "envObj"]]) });
        const result = interpreter.parse('[[],{},"[ref: ~1]","[ref: ~2]","[ref: ~3]","[ref: envObj]"]');
        assert(result instanceof Array);
        assert(result[0] instanceof Array);
        assert(result[1] instanceof Object);
        assert(result[2] === result);
        assert(result[3] === result[0]);
        assert(result[4] === result[1]);
        assert(result[5] === ambientEnvironmentObject);
    }

    parsesObjectWithSpecialValues()
    {
        const testSymbol = Symbol("test");
        const interpreter = new JSONInterpreter({ knownSymbols: new Map([[testSymbol, "test"]]) });
        const result = interpreter.parse('{"sym": "[sym: test]", "nan": "[const: NaN]", "inf": "[const: Infinity]", "undef": "[const: Undefined]", "ref": "[ref: ~1]"}');
        assert.deepStrictEqual(result, {
            sym: testSymbol,
            nan: NaN,
            inf: Infinity,
            undef: undefined,
            ref: result
        });
    }
}

export class InterpretJSONBinaryTests
{
    private testBytes = new Uint8Array(256);
    private testByteString = "";
    constructor()
    {
        for (let index = 0; index <= 255; index++)
        {
            this.testBytes[index] = index;
            this.testByteString += String.fromCharCode(index);
        }
    }

    parsesEmptyBinaryString()
    {
        const binaryString = `"[bin]"`;
        const interpreter = new JSONInterpreter();
        const result = interpreter.parse(binaryString);
        assert(result instanceof ArrayBuffer);
        assert(result.byteLength === 0);
    }

    parsesSingleByteBinaryString()
    {
        const binaryString = `"[bin]${btoa(this.testByteString.substring(0, 1))}"`;
        const interpreter = new JSONInterpreter();
        const result = interpreter.parse(binaryString);
        assert(result instanceof ArrayBuffer);
        assert(result.byteLength === 1);
        const resultView = new Uint8Array(result);
        assert.strictEqual(resultView[0], this.testBytes[0]);
    }

    parsesTwoByteBinaryString()
    {
        const binaryString = `"[bin]${btoa(this.testByteString.substring(0, 2))}"`;
        const interpreter = new JSONInterpreter();
        const result = interpreter.parse(binaryString);
        assert(result instanceof ArrayBuffer);
        assert(result.byteLength === 2);
        const resultView = new Uint8Array(result);
        assert.strictEqual(resultView[0], this.testBytes[0]);
        assert.strictEqual(resultView[1], this.testBytes[1]);
    }

    parsesThreeByteBinaryString()
    {
        const binaryString = `"[bin]${btoa(this.testByteString.substring(0, 3))}"`;
        const interpreter = new JSONInterpreter();
        const result = interpreter.parse(binaryString);
        assert(result instanceof ArrayBuffer);
        assert(result.byteLength === 3);
        const resultView = new Uint8Array(result);
        assert.strictEqual(resultView[0], this.testBytes[0]);
        assert.strictEqual(resultView[1], this.testBytes[1]);
        assert.strictEqual(resultView[2], this.testBytes[2]);
    }

    parsesMultipleByteBinaryString()
    {
        const binaryString = `"[bin]${btoa(this.testByteString)}"`;
        const interpreter = new JSONInterpreter();
        const result = interpreter.parse(binaryString);
        assert(result instanceof ArrayBuffer);
        assert(result.byteLength === 256);
        const resultView = new Uint8Array(result);
        for (let i = 0; i < 256; i++)
        {
            assert.strictEqual(resultView[i], this.testBytes[i]);
        }
    }

    parsesMultiChunkBinaryString()
    {
        const testArray = new Uint8Array(6500);
        let testString = "";
        for (let i = 0; i < 6500; i++)
        {
            testArray[i] = Math.floor(Math.random() * 255);
            testString += String.fromCharCode(testArray[i]);
        }
        const base64String = btoa(testString);
        const binaryString = `"[bin]${btoa(testString)}"`;
        const interpreter = new JSONInterpreter();
        const result = interpreter.parse(binaryString);
        assert(result instanceof ArrayBuffer);
        assert(result.byteLength === 6500);
        const resultView = new Uint8Array(result);
        for (let i = 0; i < 6500; i++)
        {
            assert.strictEqual(resultView[i], testArray[i]);
        }
    }
}