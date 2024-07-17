import { StringTests } from "../source/serializers/JSONSerializer.spec.ts";
import { NumberTests } from "../source/serializers/JSONSerializer.spec.ts";
import { SymbolTests } from "../source/serializers/JSONSerializer.spec.ts";
import { BinaryTests } from "../source/serializers/JSONSerializer.spec.ts";
import { ObjectTests } from "../source/serializers/JSONSerializer.spec.ts";
import { InstanceTests } from "../source/serializers/JSONSerializer.spec.ts";

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

console.log("All tests passed!");
