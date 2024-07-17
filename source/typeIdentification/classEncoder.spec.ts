import assert from "node:assert";
import { generateClassIdentifier, EncodingTools, HashTools, FingerPrintingTools } from "./classEncoder.ts";

export class FingerPrintingToolsTests
{
    fingerPrintsSimpleClass()
    {
        class TestClass
        {
            testMethod() { }
        }
        const fingerprint = FingerPrintingTools.fingerPrintClass(TestClass);
        assert.strictEqual(fingerprint, "[{TestClass: testMethod}]");
    }

    fingerPrintsInheritedClass()
    {
        class BaseClass
        {
            baseMethod() { }
        }
        class DerivedClass extends BaseClass
        {
            derivedMethod() { }
        }
        const fingerprint = FingerPrintingTools.fingerPrintClass(DerivedClass);
        assert.strictEqual(fingerprint, "[{DerivedClass: derivedMethod}, {BaseClass: baseMethod}]");
    }
}

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


export class ClassIdentifierTests
{
    generatesUniqueIdentifier()
    {
        class TestClass
        {
            testMethod() { }
        }

        const identifier = generateClassIdentifier(TestClass);
        assert.strictEqual(identifier.length, 6);
        assert.match(identifier, /^[ABCDEFGHJKLMNPQRSTUVWXYZabcdefghkmnpqrstuvwxyz23456789]{6}$/);
    }

    generatesDifferentIdentifiersForDifferentClasses()
    {
        class TestClass1
        {
            method1() { }
        }

        class TestClass2
        {
            method1() { }
        }

        const identifier1 = generateClassIdentifier(TestClass1);
        const identifier2 = generateClassIdentifier(TestClass2);
        assert.notStrictEqual(identifier1, identifier2);
    }
}

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


