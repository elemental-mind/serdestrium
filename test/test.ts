import { SerializeJSONBinaryTests, SerializeJSONInstanceTests, SerializeJSONNumberTests, SerializeJSONObjectTests, SerializeJSONStringTests, SerializeJSONSymbolTests } from "../source/serializers/JSONSerializer.spec.js";
import { InterpretJSONStringTests, InterpretJSONNumberTests, InterpretJSONBooleanTests, InterpretJSONNullTests, InterpretJSONObjectTests, InterpretJSONArrayTests, InterpretJSONSpecialValuesTests, InterpretJSONBinaryTests } from "../source/interpreters/JSONInterpreter.spec.js";
import { EncodingToolsTests } from "../source/tools/encodingTools.spec.js";
import { FingerPrintingToolsTests, ClassIdentifierTests } from "../source/tools/fingerprintingTools.spec.js";
import { HashToolsTests } from "../source/tools/hashTools.spec.js";

//#region Tool tests

const encodingToolsTests = new EncodingToolsTests();
encodingToolsTests.encodesNumberWithAlphaNumNonAmbiguous();
encodingToolsTests.encodesNumberWithBase64();
encodingToolsTests.convertsDecimalToBase();

const hashToolsTests = new HashToolsTests();
hashToolsTests.generatesQuickHash();
hashToolsTests.throwsErrorForTooManyBits();

const fingerPrintingToolsTests = new FingerPrintingToolsTests();
fingerPrintingToolsTests.fingerPrintsSimpleClass();
fingerPrintingToolsTests.fingerPrintsInheritedClass();

const classIdentifierTests = new ClassIdentifierTests();
classIdentifierTests.generatesUniqueIdentifier();
classIdentifierTests.generatesDifferentIdentifiersForDifferentClasses();

//#endregion

//#region JSON Serialization Tests

const serializeJSONStringTests = new SerializeJSONStringTests();
serializeJSONStringTests.emitsSimpleString();
serializeJSONStringTests.escapesRefString();
serializeJSONStringTests.escapesSymString();
serializeJSONStringTests.escapesJSONChriticalCharacters();

const serializeJSONNumberTests = new SerializeJSONNumberTests();
serializeJSONNumberTests.emitsSimpleNumber();
serializeJSONNumberTests.emitsNAN();
serializeJSONNumberTests.emitsInfinity();

const serializeJSONSymbolTests = new SerializeJSONSymbolTests();
serializeJSONSymbolTests.emitsSimpleSymbol();

const serializeJSONBinaryTests = new SerializeJSONBinaryTests();
serializeJSONBinaryTests.serializesEmptyBytes()
serializeJSONBinaryTests.serializesSingleByte()
serializeJSONBinaryTests.serializesDoubleByte()
serializeJSONBinaryTests.serializesTripleByte()
serializeJSONBinaryTests.serializesAllByteValues()

const serializeJSONObjectTests = new SerializeJSONObjectTests();
serializeJSONObjectTests.emitsObjectUnformatted();
serializeJSONObjectTests.emitsObjectFormatted();
serializeJSONObjectTests.emitsObjectsWithKnownSymbols();

const serializeJSONInstanceTests = new SerializeJSONInstanceTests();
serializeJSONInstanceTests.emitsSimpleClassInstance();
serializeJSONInstanceTests.emitsCustomizedClassInstance();
serializeJSONInstanceTests.emitsCircularInstances();
serializeJSONInstanceTests.emitsSelfReferencingInstances();

//#endregion

//#region JSON Interpretation tests

const interpretJSONStringTests = new InterpretJSONStringTests()
interpretJSONStringTests.parsesSimpleString()
interpretJSONStringTests.parsesEscapedString()

const interpretJSONNumberTests = new InterpretJSONNumberTests()
interpretJSONNumberTests.parsesSimpleNumber()
interpretJSONNumberTests.parsesNegativeNumber()
interpretJSONNumberTests.parsesFloatNumber()

const interpretJSONBooleanTests = new InterpretJSONBooleanTests()
interpretJSONBooleanTests.parsesTrueBoolean()
interpretJSONBooleanTests.parsesFalseBoolean()

const interpretJSONNullTests = new InterpretJSONNullTests()
interpretJSONNullTests.parsesNullValue()

const interpretJSONObjectTests = new InterpretJSONObjectTests()
interpretJSONObjectTests.parsesSimpleObject()
interpretJSONObjectTests.parsesNestedObject()

const interpretJSONArrayTests = new InterpretJSONArrayTests()
interpretJSONArrayTests.parsesSimpleArray()
interpretJSONArrayTests.parsesNestedArray()

const interpretJSONSpecialValuesTests = new InterpretJSONSpecialValuesTests();
interpretJSONSpecialValuesTests.parsesSymbolValue()
interpretJSONSpecialValuesTests.parsesConstNaN()
interpretJSONSpecialValuesTests.parsesConstInfinity()
interpretJSONSpecialValuesTests.parsesConstUndefined()
interpretJSONSpecialValuesTests.parsesRefValue()
interpretJSONSpecialValuesTests.parsesObjectWithSpecialValues()

const interpretJSONBinaryTests = new InterpretJSONBinaryTests()
interpretJSONBinaryTests.parsesEmptyBinaryString()
interpretJSONBinaryTests.parsesSingleByteBinaryString()
interpretJSONBinaryTests.parsesTwoByteBinaryString()
interpretJSONBinaryTests.parsesThreeByteBinaryString()
interpretJSONBinaryTests.parsesMultipleByteBinaryString()
interpretJSONBinaryTests.parsesMultiChunkBinaryString();

//#endregion

console.log("All tests passed!")
