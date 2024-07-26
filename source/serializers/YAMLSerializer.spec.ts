import assert from "node:assert";
import { YAMLSerializer } from "./YAMLSerializer.js";
import { CustomizedTestClass, SimpleTestClass, TestRing, TestRingElement } from "../../test/serializationTestClasses.js";

export class SerializeYAMLStringTests
{
    emitsSimpleString()
    {
        const serializer = new YAMLSerializer();
        const result = serializer.serialize("Hello World");
        assert.strictEqual(result, `Hello World`);
    }

    escapesSpecialStrings()
    {
        const serializer = new YAMLSerializer();
        assert.strictEqual(serializer.serialize("true"), `'true'`);
        assert.strictEqual(serializer.serialize("false"), `'false'`);
        assert.strictEqual(serializer.serialize("yes"), `'yes'`);
        assert.strictEqual(serializer.serialize("no"), `'no'`);
        assert.strictEqual(serializer.serialize("on"), `'on'`);
        assert.strictEqual(serializer.serialize("off"), `'off'`);
    }
}

export class SerializeYAMLNumberTests
{
    emitsSimpleNumber()
    {
        const serializer = new YAMLSerializer();
        const result = serializer.serialize(123);
        assert.strictEqual(result, "123");
    }

    emitsNAN()
    {
        const serializer = new YAMLSerializer();
        const result = serializer.serialize(NaN);
        assert.strictEqual(result, `.NaN`);
    }

    emitsInfinity()
    {
        const serializer = new YAMLSerializer();
        const result = serializer.serialize(Infinity);
        assert.strictEqual(result, `.Inf`);
    }
}

export class SerializeYAMLSymbolTests
{
    emitsSimpleSymbol()
    {
        const symbol = Symbol("test");
        const serializer = new YAMLSerializer({ knownSymbols: new Map([[symbol, "test"]]) });
        const result = serializer.serialize(symbol);
        assert.strictEqual(result, `!symbol test`);
    }
}

export class SerializeYAMLBinaryTests
{
    private testBytes = new Uint8Array(256);
    constructor()
    {
        for (let index = 0; index <= 255; index++)
        {
            this.testBytes[index] = index;
        }
    }

    serializesEmptyBytes()
    {
        const serializer = new YAMLSerializer();
        const emptyArray = new Uint8Array(0);
        const result = serializer.serialize(emptyArray.buffer);
        assert.strictEqual(result, `!!binary |`);
    }

    serializesSingleByte()
    {
        const serializer = new YAMLSerializer();
        const smallArray = this.testBytes.buffer.slice(0, 1);
        const result = serializer.serialize(smallArray);
        assert.strictEqual(result, `!!binary |
AA==`);
    }

    serializesDoubleByte()
    {
        const serializer = new YAMLSerializer();
        const smallArray = this.testBytes.buffer.slice(0, 2);
        const result = serializer.serialize(smallArray);
        assert.strictEqual(result, `!!binary |
AAE=`);
    }

    serializesTripleByte()
    {
        const serializer = new YAMLSerializer();
        const smallArray = this.testBytes.buffer.slice(0, 3);
        const result = serializer.serialize(smallArray);
        assert.strictEqual(result, `!!binary |
AAEC`);
    }

    serializesAllByteValues()
    {
        const serializer = new YAMLSerializer();
        const result = serializer.serialize(this.testBytes.buffer);
        assert.strictEqual(result, `!!binary |
AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4
OTo7PD0+P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3Bx
cnN0dXZ3eHl6e3x9fn+AgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmq
q6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj
5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/w==`);
    }
}

export class SerializeYAMLObjectTests
{
    emitsSimpleObject()
    {
        const serializer = new YAMLSerializer();
        const obj = {
            numberKey: 123,
            stringKey: "Some string",
            boolKey: true,
            undef: undefined
        };
        const result = serializer.serialize(obj);
        assert.strictEqual(result,
            `numberKey: 123
stringKey: Some string
boolKey: true
undef: .Undefined`);
    }

    emitsObjectsWithComplexKeys()
    {
        const symbol = Symbol("SymProp");
        const serializer = new YAMLSerializer({ knownSymbols: new Map([[symbol, "SymProp"]]) });
        const obj = {
            " quoted key": "value3",
            [symbol]: "symbolValue"
        };
        const result = serializer.serialize(obj);
        assert.strictEqual(result,
            `' quoted key': value3
!symbol SymProp: symbolValue`);
    }

    emitsEmptyObject()
    {
        const serializer = new YAMLSerializer();
        const obj = {};
        const result = serializer.serialize(obj);
        assert.strictEqual(result, '{}');
    }
}

export class SerializeYAMLInstanceTests
{
    emitsSimpleClassInstance()
    {
        const serializer = new YAMLSerializer({ knownClasses: new Map([[SimpleTestClass, "SimpleClass"]]) });
        const instance = new SimpleTestClass();
        const result = serializer.serialize(instance);
        assert.strictEqual(result,
            `!SimpleClass
name: ''
age: 35
isActive: false
preferences: 
  mail: john.doe@example.com
  marketing: false`);
    }

    emitsCustomizedClassInstance()
    {
        const serializer = new YAMLSerializer({ knownClasses: new Map([[CustomizedTestClass, "CustomizedClass"]]) });
        const instance = new CustomizedTestClass();
        const result = serializer.serialize(instance);
        assert.strictEqual(result, `!CustomizedClass
name: ''
age: 35
preferences: 
  mail: john.doe@example.com
  marketing: false
isActive: false`);
    }

    emitsCircularInstances()
    {
        const serializer = new YAMLSerializer({ knownClasses: new Map([[TestRing as any, "TestRing"], [TestRingElement, "TestRingElement"]]) }, { indentation: "  " });
        const ring = new TestRing<number>();
        ring.add(1);
        ring.add(2);
        ring.add(3);

        const result = serializer.serialize(ring);
        assert.strictEqual(result,
            `!TestRing
entry: !TestRingElement
  value: 1
  next: !TestRingElement
    value: 2
    next: !TestRingElement
      value: 3
      next: *2
      previous: *3
    previous: *2
  previous: *4`);
    }

    emitsSelfReferencingInstances()
    {
        const serializer = new YAMLSerializer({ knownClasses: new Map([[TestRing as any, "TestRing"], [TestRingElement, "TestRingElement"]]) }, { indentation: "  " });
        const ring = new TestRing<number>();
        ring.add(1);

        const result = serializer.serialize(ring);
        assert.strictEqual(result,
            `!TestRing
entry: !TestRingElement
  value: 1
  next: *2
  previous: *2`);
    }
}

export class SerializeYAMLArrayTests
{
    serializesSimpleArray()
    {
        const serializer = new YAMLSerializer();
        const array = [1, 2, 3, 4, 5];
        const result = serializer.serialize(array);
        assert.strictEqual(result,
            `- 1
- 2
- 3
- 4
- 5`);
    }

    serializesNestedArray()
    {
        const serializer = new YAMLSerializer();
        const nestedArray = [[1, 2], [3, 4], [5, 6]];
        const result = serializer.serialize(nestedArray);
        assert.strictEqual(result, 
`- - 1
  - 2
- - 3
  - 4
- - 5
  - 6`);
    }

    serializesEmptyArray()
    {
        const serializer = new YAMLSerializer();
        const emptyArray: any[] = [];
        const result = serializer.serialize(emptyArray);
        assert.strictEqual(result, `[]`);
    }

    serializesMixedTypeArray()
    {
        const serializer = new YAMLSerializer();
        const mixedArray = [1, "two", true, { key: "value" }];
        const result = serializer.serialize(mixedArray);
        assert.strictEqual(result,
`- 1
- two
- true
- key: value`);
    }

    serializesArrayWithCustomObjects()
    {
        class TestClass{
            constructor(public name: string) {};
        }
        const serializer = new YAMLSerializer({ knownClasses: new Map([[TestClass, "TestClass"]]) });
        const arrayWithObjects = [new TestClass("Test1"), new TestClass("Test2")];
        const result = serializer.serialize(arrayWithObjects);
        assert.strictEqual(result,
`- !TestClass
  name: Test1
- !TestClass
  name: Test2`);
    }
}

