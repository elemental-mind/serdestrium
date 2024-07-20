import { EncodingTools } from "./encodingTools.ts";
import { HashTools } from "./hashTools.ts";

export class FingerPrintingTools
{
    static generateClassIdentifier(clss: any): string
    {
        const fingerprint = FingerPrintingTools.fingerPrintClass(clss);
        //We only need 35 bits, as we have 54 characters 6 times = 54**6 = 2**34.529 ~ 2**35 
        const hash = HashTools.quickHash(fingerprint, 35);
        const alphaNumIdentifier = EncodingTools.encode(hash, EncodingTools.Encodings.AlphaNumNonAmbiguous, 6);

        return alphaNumIdentifier.reverse().join("");
    }
    
    //encodes a prototype into a form like this: [{topProto: someMethod, someOtherMethod}, {oneDownProto: inheritedMethod}, {object}];
    static fingerPrintClass(clss: any)
    {
        const prototypes = this.unfoldProtoChain(clss.prototype);
        const protoStrings = prototypes.map(proto => this.getProtoPropertyString(proto));

        return `[${protoStrings.join(", ")}]`;
    }

    private static unfoldProtoChain(prototype: any)
    {
        const protoChain: any[] = [];

        let currentPrototype = prototype;

        while (!(currentPrototype === Object.prototype || currentPrototype === null))
        {
            protoChain.push(currentPrototype);
            currentPrototype = Object.getPrototypeOf(currentPrototype);
        }

        return protoChain;
    }

    private static getProtoPropertyString(proto: any)
    {
        const commaSeparatedPropNames = Reflect.ownKeys(proto)
            .filter(key => key !== "constructor")
            .map(key => key.toString())
            .join(", ");

        return `{${proto.constructor.name}: ${commaSeparatedPropNames}}`;
    }
}