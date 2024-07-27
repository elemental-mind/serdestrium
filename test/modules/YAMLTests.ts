import { SerializeYAMLArrayTests, SerializeYAMLBinaryTests, SerializeYAMLInstanceTests, SerializeYAMLNumberTests, SerializeYAMLObjectTests, SerializeYAMLStringTests, SerializeYAMLSymbolTests } from "../../source/serializers/YAMLSerializer.spec.js";

// SerializeYAMLStringTests
const stringTests = new SerializeYAMLStringTests();
stringTests.emitsSimpleString();
stringTests.escapesSpecialStrings();
stringTests.emitsMultilineString();
stringTests.escapesSpecialCharacters();
stringTests.preservesLeadingAndTrailingWhitespace();
stringTests.preservesLeadingWhitespaceInMultiline();
stringTests.preservesTrailingNewlinesInMultiline();

// SerializeYAMLNumberTests 
const numberTests = new SerializeYAMLNumberTests();
numberTests.emitsSimpleNumber();
numberTests.emitsNAN();
numberTests.emitsInfinity();

// SerializeYAMLSymbolTests
const symbolTests = new SerializeYAMLSymbolTests();
symbolTests.emitsSimpleSymbol();

// // SerializeYAMLBinaryTests
// const binaryTests = new SerializeYAMLBinaryTests();
// binaryTests.serializesEmptyBytes();
// binaryTests.serializesSingleByte();
// binaryTests.serializesDoubleByte();
// binaryTests.serializesTripleByte();
// binaryTests.serializesAllByteValues();

// SerializeYAMLObjectTests
const objectTests = new SerializeYAMLObjectTests();
objectTests.emitsSimpleObject();
objectTests.emitsObjectsWithComplexKeys();
objectTests.emitsEmptyObject();

// SerializeYAMLInstanceTests
const instanceTests = new SerializeYAMLInstanceTests();
instanceTests.emitsSimpleClassInstance();
instanceTests.emitsCustomizedClassInstance();
instanceTests.emitsCircularInstances();
instanceTests.emitsSelfReferencingInstances();

// SerializeYAMLArrayTests
const arrayTests = new SerializeYAMLArrayTests();
arrayTests.serializesSimpleArray();
arrayTests.serializesNestedArray();
arrayTests.serializesEmptyArray();
arrayTests.serializesMixedTypeArray();
arrayTests.serializesArrayWithCustomObjects()


