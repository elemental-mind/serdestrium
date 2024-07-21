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

