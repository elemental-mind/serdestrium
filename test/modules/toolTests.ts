import { EncodingToolsTests } from "../../source/tools/encodingTools.spec.js";
import { FingerPrintingToolsTests, ClassIdentifierTests } from "../../source/tools/fingerprintingTools.spec.js";
import { HashToolsTests } from "../../source/tools/hashTools.spec.js";

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