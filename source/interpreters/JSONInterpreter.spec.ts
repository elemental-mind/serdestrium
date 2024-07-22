import assert from "node:assert"
import { JSONInterpreter } from "./JSONInterpreter.js";

export class InterpretJSONStringTests {
    parsesSimpleString() {
        const interpreter = new JSONInterpreter(new Map(), new Map())
        const result = interpreter.parse('"Hello World"')
        assert.strictEqual(result, "Hello World")
    }

    parsesEscapedString() {
        const interpreter = new JSONInterpreter(new Map(), new Map())
        const result = interpreter.parse('"Hello \\"World\\""')
        assert.strictEqual(result, 'Hello "World"')
    }
}

export class InterpretJSONNumberTests {
    parsesSimpleNumber() {
        const interpreter = new JSONInterpreter(new Map(), new Map())
        const result = interpreter.parse("123")
        assert.strictEqual(result, 123)
    }

    parsesNegativeNumber() {
        const interpreter = new JSONInterpreter(new Map(), new Map())
        const result = interpreter.parse("-123")
        assert.strictEqual(result, -123)
    }

    parsesFloatNumber() {
        const interpreter = new JSONInterpreter(new Map(), new Map())
        const result = interpreter.parse("123.456")
        assert.strictEqual(result, 123.456)
    }
}

export class InterpretJSONBooleanTests {
    parsesTrueBoolean() {
        const interpreter = new JSONInterpreter(new Map(), new Map())
        const result = interpreter.parse("true")
        assert.strictEqual(result, true)
    }

    parsesFalseBoolean() {
        const interpreter = new JSONInterpreter(new Map(), new Map())
        const result = interpreter.parse("false")
        assert.strictEqual(result, false)
    }
}

export class InterpretJSONNullTests {
    parsesNullValue() {
        const interpreter = new JSONInterpreter(new Map(), new Map())
        const result = interpreter.parse("null")
        assert.strictEqual(result, null)
    }
}

export class InterpretJSONObjectTests {
    parsesSimpleObject() {
        const interpreter = new JSONInterpreter(new Map(), new Map())
        const result = interpreter.parse('{"key": "value"}')
        assert.deepStrictEqual(result, { key: "value" })
    }

    parsesNestedObject() {
        const interpreter = new JSONInterpreter(new Map(), new Map())
        const result = interpreter.parse('{"key": {"nestedKey": "nestedValue"}}')
        assert.deepStrictEqual(result, { key: { nestedKey: "nestedValue" } })
    }
}

export class InterpretJSONArrayTests {
    parsesSimpleArray() {
        const interpreter = new JSONInterpreter(new Map(), new Map())
        const result = interpreter.parse('["value1", "value2"]')
        assert.deepStrictEqual(result, ["value1", "value2"])
    }

    parsesNestedArray() {
        const interpreter = new JSONInterpreter(new Map(), new Map())
        const result = interpreter.parse('[[1, 2], [3, 4]]')
        assert.deepStrictEqual(result, [[1, 2], [3, 4]])
    }
}


export class InterpretJSONSpecialValuesTests {
    parsesSymbolValue() {
        const testSymbol = Symbol("test");
        const interpreter = new JSONInterpreter(new Map(), new Map([["test", testSymbol]]))
        const result = interpreter.parse('"[sym: test]"')
        assert.strictEqual(typeof result, 'symbol')
        assert.strictEqual(result.toString(), 'Symbol(test)')
    }

    parsesConstNaN() {
        const interpreter = new JSONInterpreter(new Map(), new Map())
        const result = interpreter.parse('"[const: NaN]"')
        assert.strictEqual(isNaN(result), true)
    }

    parsesConstInfinity() {
        const interpreter = new JSONInterpreter(new Map(), new Map())
        const result = interpreter.parse('"[const: Infinity]"')
        assert.strictEqual(result, Infinity)
    }

    parsesConstUndefined() {
        const interpreter = new JSONInterpreter(new Map(), new Map())
        const result = interpreter.parse('{"key": "[const: Undefined]"}')
        assert.strictEqual(result.key, undefined)
    }

    parsesRefValue() {
        const preExistingObject = {};
        const interpreter = new JSONInterpreter(new Map(), new Map(), new Map([[0, preExistingObject]]));
        const result = interpreter.parse('[[],{},"[ref: 1]","[ref: 2]","[ref: 3]","[ref: 0]"]');
        assert(result instanceof Array);
        assert(result[0] instanceof Array);
        assert(result[1] instanceof Object);
        assert(result[2] === result);
        assert(result[3] === result[0]);
        assert(result[4] === result[1]);
        assert(result[5] === preExistingObject);
    }

    parsesObjectWithSpecialValues() {
        const testSymbol = Symbol("test");
        const interpreter = new JSONInterpreter(new Map(), new Map([["test", testSymbol]]))
        const result = interpreter.parse('{"sym": "[sym: test]", "nan": "[const: NaN]", "inf": "[const: Infinity]", "undef": "[const: Undefined]", "ref": "[ref: 0]"}')
        assert.deepStrictEqual(result, {
            sym: testSymbol,
            nan: NaN,
            inf: Infinity,
            undef: undefined,
            ref: result
        })
    }
}
