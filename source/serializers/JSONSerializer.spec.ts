import assert from "node:assert";
import { JSONSerializer } from "./JSONSerializer.js";
import { CustomizedTestClass, SimpleTestClass, TestRing, TestRingElement } from "../../test/serializationTestClasses.js";

export class SerializeJSONStringTests
{
    emitsSimpleString()
    {
        const serializer = new JSONSerializer(new Map(), new Map());
        const result = serializer.serialize("Hello World");
        assert.strictEqual(result, `"Hello World"`);
    }

    escapesRefString()
    {
        const serializer = new JSONSerializer(new Map(), new Map());
        const result = serializer.serialize("[ref: 1]");
        assert.strictEqual(result, `"#[ref: 1]"`);
    }

    escapesSymString()
    {
        const serializer = new JSONSerializer(new Map(), new Map());
        const result = serializer.serialize("[sym: 1]");
        assert.strictEqual(result, `"#[sym: 1]"`);
    }

    escapesJSONChriticalCharacters()
    {
        const serializer = new JSONSerializer(new Map(), new Map());
        const result = serializer.serialize(`"Hello World"`);
        assert.strictEqual(result, `"\\"Hello World\\""`);
    }
}

export class SerializeJSONNumberTests
{
    emitsSimpleNumber()
    {
        const serializer = new JSONSerializer(new Map(), new Map());
        const result = serializer.serialize(123);
        assert.strictEqual(result, "123");
    }

    emitsNAN()
    {
        const serializer = new JSONSerializer(new Map(), new Map());
        const result = serializer.serialize(NaN);
        assert.strictEqual(result, `"[const: NaN]"`);
    }

    emitsInfinity()
    {
        const serializer = new JSONSerializer(new Map(), new Map());
        const result = serializer.serialize(Infinity);
        assert.strictEqual(result, `"[const: Infinity]"`);
    }
}

export class SerializeJSONSymbolTests
{
    emitsSimpleSymbol()
    {
        const symbol = Symbol("test");
        const serializer = new JSONSerializer(new Map(), new Map([[symbol, "test"]]));
        const result = serializer.serialize(symbol);
        assert.strictEqual(result, `"[sym: test]"`);
    }
}

export class SerializeJSONBinaryTests
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

    serializesEmptyBytes()
    {
        const serializer = new JSONSerializer(new Map(), new Map());
        const emptyArray = new Uint8Array(0);
        const result = serializer.serialize(emptyArray.buffer);
        assert.strictEqual(result, `"[bin]"`);
    }

    serializesSingleByte()
    {
        const serializer = new JSONSerializer(new Map(), new Map());
        const smallArray = this.testBytes.buffer.slice(0, 1);
        const result = serializer.serialize(smallArray);
        const base64String = btoa(this.testByteString.substring(0,1));
        assert.strictEqual(result, `"[bin]${base64String}"`);
    }

    serializesDoubleByte()
    {
        const serializer = new JSONSerializer(new Map(), new Map());
        const smallArray = this.testBytes.buffer.slice(0, 2);
        const result = serializer.serialize(smallArray);
        const base64String = btoa(this.testByteString.substring(0,2));
        assert.strictEqual(result, `"[bin]${base64String}"`);
    }

    serializesTripleByte()
    {
        const serializer = new JSONSerializer(new Map(), new Map());
        const smallArray = this.testBytes.buffer.slice(0, 3);
        const result = serializer.serialize(smallArray);
        const base64String = btoa(this.testByteString.substring(0,3));
        assert.strictEqual(result, `"[bin]${base64String}"`);
    }

    serializesAllByteValues()
    {
        const serializer = new JSONSerializer(new Map(), new Map());
        const result = serializer.serialize(this.testBytes.buffer);
        const base64String = btoa(this.testByteString);
        assert.strictEqual(result, `"[bin]${base64String}"`);
    }
}

export class SerializeJSONObjectTests
{
    emitsObjectUnformatted()
    {
        const serializer = new JSONSerializer(new Map(), new Map());
        const obj = {
            numberKey: 123,
            stringKey: "Some string",
            " quoted key": "value3"
        };
        const result = serializer.serialize(obj);
        assert.strictEqual(result, `{"numberKey":123,"stringKey":"Some string"," quoted key":"value3"}`);
    }

    emitsObjectFormatted()
    {
        const serializer = new JSONSerializer(new Map(), new Map(), new Map(), { indentation: "    " });

        const obj = {
            numberKey: 123,
            stringKey: "Some string",
            boolKey: true,
            undef: undefined
        };

        const result = serializer.serialize(obj);
        assert.strictEqual(result,
            `{
    "numberKey": 123,
    "stringKey": "Some string",
    "boolKey": true,
    "undef": "[const: Undefined]"
}`);
    }

    emitsObjectsWithKnownSymbols()
    {
        const symbol = Symbol("SymProp");
        const serializer = new JSONSerializer(new Map(), new Map([[symbol, "SymProp"]]));
        const obj = {
            numberKey: 123,
            stringKey: "Some string",
            [symbol]: "value3"
        };
        const result = serializer.serialize(obj);
        assert.strictEqual(result, `{"numberKey":123,"stringKey":"Some string","[sym: SymProp]":"value3"}`);
    }
}

export class SerializeJSONInstanceTests
{
    emitsSimpleClassInstance()
    {
        const serializer = new JSONSerializer(new Map([[SimpleTestClass, "SimpleClass"]]), new Map());
        const instance = new SimpleTestClass();
        const result = serializer.serialize(instance);
        assert.strictEqual(result, `{"[Type]":"SimpleClass","name":"","age":35,"isActive":false,"preferences":{"mail":"john.doe@example.com","marketing":false}}`);
    }

    emitsCustomizedClassInstance()
    {
        const serializer = new JSONSerializer(new Map([[CustomizedTestClass, "CustomizedClass"]]), new Map());
        const instance = new CustomizedTestClass();
        const result = serializer.serialize(instance);
        assert.strictEqual(result, `{"[Type]":"CustomizedClass","name":"","age":35,"preferences":{"mail":"john.doe@example.com","marketing":false},"isActive":false}`);
    }

    emitsCircularInstances()
    {
        const serializer = new JSONSerializer(new Map([[TestRing as any, "TestRing"], [TestRingElement, "TestRingElement"]]), new Map(), new Map(), { indentation: "    " });
        const ring = new TestRing<number>();
        ring.add(1);
        ring.add(2);
        ring.add(3);

        const result = serializer.serialize(ring);
        assert.strictEqual(result,
            `{
    "[Type]": "TestRing",
    "entry": {
        "[Type]": "TestRingElement",
        "value": 1,
        "next": {
            "[Type]": "TestRingElement",
            "value": 2,
            "next": {
                "[Type]": "TestRingElement",
                "value": 3,
                "next": "[ref: 1]",
                "previous": "[ref: 2]"
            },
            "previous": "[ref: 1]"
        },
        "previous": "[ref: 3]"
    }
}`);
    }

    emitsSelfReferencingInstances()
    {
        const serializer = new JSONSerializer(new Map([[TestRing as any, "TestRing"], [TestRingElement, "TestRingElement"]]), new Map(), new Map(), { indentation: "    " });
        const ring = new TestRing<number>();
        ring.add(1);

        const result = serializer.serialize(ring);
        assert.strictEqual(result,
            `{
    "[Type]": "TestRing",
    "entry": {
        "[Type]": "TestRingElement",
        "value": 1,
        "next": "[ref: 1]",
        "previous": "[ref: 1]"
    }
}`);
    }
}
