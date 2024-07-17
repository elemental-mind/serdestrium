import { BinaryTests, InstanceTests, NumberTests, ObjectTests, StringTests, SymbolTests } from "../source/serializers/JSONSerializer.spec.ts";
import { EncodingToolsTests, FingerPrintingToolsTests, ClassIdentifierTests, HashToolsTests } from "../source/typeIdentification/classEncoder.spec.ts";

const stringTests = new StringTests();
stringTests.emitsSimpleString();
stringTests.escapesRefString();
stringTests.escapesSymString();
stringTests.escapesJSONChriticalCharacters();

const numberTests = new NumberTests();
numberTests.emitsSimpleNumber();
numberTests.emitsNAN();
numberTests.emitsInfinity();

const symbolTests = new SymbolTests();
symbolTests.emitsSimpleSymbol();

const binaryTests = new BinaryTests();

const objectTests = new ObjectTests();
objectTests.emitsObjectUnformatted();
objectTests.emitsObjectFormatted();
objectTests.emitsObjectsWithKnownSymbols();

const instanceTests = new InstanceTests();
instanceTests.emitsSimpleClassInstance();
instanceTests.emitsCustomizedClassInstance();

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
