import { SerializeJSONBinaryTests, SerializeJSONInstanceTests, SerializeJSONNumberTests, SerializeJSONObjectTests, SerializeJSONStringTests, SerializeJSONSymbolTests } from "../source/serializers/JSONSerializer.spec.ts";
import { EncodingToolsTests } from "../source/tools/encodingTools.spec.ts";
import { FingerPrintingToolsTests, ClassIdentifierTests } from "../source/tools/fingerprintingTools.spec.ts";
import { HashToolsTests } from "../source/tools/hashTools.spec.ts";

const stringTests = new SerializeJSONStringTests();
stringTests.emitsSimpleString();
stringTests.escapesRefString();
stringTests.escapesSymString();
stringTests.escapesJSONChriticalCharacters();

const numberTests = new SerializeJSONNumberTests();
numberTests.emitsSimpleNumber();
numberTests.emitsNAN();
numberTests.emitsInfinity();

const symbolTests = new SerializeJSONSymbolTests();
symbolTests.emitsSimpleSymbol();

const binaryTests = new SerializeJSONBinaryTests();

const objectTests = new SerializeJSONObjectTests();
objectTests.emitsObjectUnformatted();
objectTests.emitsObjectFormatted();
objectTests.emitsObjectsWithKnownSymbols();

const instanceTests = new SerializeJSONInstanceTests();
instanceTests.emitsSimpleClassInstance();
instanceTests.emitsCustomizedClassInstance();
instanceTests.emitsCircularInstances();
instanceTests.emitsSelfReferencingInstances();

const fingerPrintingToolsTests = new FingerPrintingToolsTests();
fingerPrintingToolsTests.fingerPrintsSimpleClass();
fingerPrintingToolsTests.fingerPrintsInheritedClass();

const encodingToolsTests = new EncodingToolsTests();
encodingToolsTests.encodesNumberWithAlphaNumNonAmbiguous();
encodingToolsTests.encodesNumberWithBase64();
encodingToolsTests.convertsDecimalToBase();

const hashToolsTests = new HashToolsTests();
hashToolsTests.generatesQuickHash();
hashToolsTests.throwsErrorForTooManyBits();

const generateClassIdentifierTests = new ClassIdentifierTests();
generateClassIdentifierTests.generatesUniqueIdentifier();
generateClassIdentifierTests.generatesDifferentIdentifiersForDifferentClasses();

console.log("All tests passed!");
