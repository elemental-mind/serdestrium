import { JSONBinaryTests, JSONInstanceTests, JSONNumberTests, JSONObjectTests, JSONStringTests, JSONSymbolTests } from "../source/serializers/JSONSerializer.spec.ts";
import { EncodingToolsTests } from "../source/tools/encodingTools.spec.ts";
import { FingerPrintingToolsTests, ClassIdentifierTests } from "../source/tools/fingerprintingTools.spec.ts";
import { HashToolsTests } from "../source/tools/hashTools.spec.ts";

const stringTests = new JSONStringTests();
stringTests.emitsSimpleString();
stringTests.escapesRefString();
stringTests.escapesSymString();
stringTests.escapesJSONChriticalCharacters();

const numberTests = new JSONNumberTests();
numberTests.emitsSimpleNumber();
numberTests.emitsNAN();
numberTests.emitsInfinity();

const symbolTests = new JSONSymbolTests();
symbolTests.emitsSimpleSymbol();

const binaryTests = new JSONBinaryTests();

const objectTests = new JSONObjectTests();
objectTests.emitsObjectUnformatted();
objectTests.emitsObjectFormatted();
objectTests.emitsObjectsWithKnownSymbols();

const instanceTests = new JSONInstanceTests();
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
