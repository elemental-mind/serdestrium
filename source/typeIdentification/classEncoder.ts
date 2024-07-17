export function generateClassIdentifier(clss: any): string
{
    const fingerprint = FingerPrintingTools.fingerPrintClass(clss);
    //We only need 35 bits, as we have 54 characters 6 times = 54**6 = 2**34.529 ~ 2**35 
    const hash = HashTools.quickHash(fingerprint, 35);
    const alphaNumIdentifier = EncodingTools.encode(hash, EncodingTools.Encodings.AlphaNumNonAmbiguous, 6);

    return alphaNumIdentifier.reverse().join("");
}

export class EncodingTools
{
    static Encodings = {
        Binary: "01".split(""),
        Hex: "0123456789ABCDEF".split(""),
        //This is a character set that avoids ambiguous chars like 0 an O, or l, I, 1 that can be misread for each other.
        AlphaNumNonAmbiguous: "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghkmnpqrstuvwxyz23456789".split(""),
        //Normal Base64 character set
        Base64: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("")
    } as const;

    static encode<T>(decimalNumber: number, symbols: T[], fixedLength?: number): T[]
    {
        let { digits } = this.decimalToBase(decimalNumber, symbols.length);

        if (fixedLength)
        {
            if (digits.length > fixedLength)
                digits = digits.slice(0, fixedLength);
            else if (digits.length < fixedLength)
                for (let i = digits.length; i < fixedLength; i++)
                    digits.push(0);
        }

        const symbolString = digits.map(digit => symbols[digit]);

        return symbolString;
    }

    static decimalToBase(decimalNumber: number, newBase: number): NumberRepresentation
    {
        const newRepresentation = new NumberRepresentation();
        newRepresentation.base = newBase;

        let currentValue = decimalNumber;

        while (currentValue > 0)
        {
            const remainder = currentValue % newBase;
            newRepresentation.digits.push(remainder);

            currentValue -= remainder;
            currentValue /= newBase;
        }

        return newRepresentation;
    }

    static baseToDecimal(representation: NumberRepresentation): number
    {
        throw new Error("Not implemented!");
    }
}

class NumberRepresentation
{
    base: number = 10;
    digits: number[] = [];
}

export class HashTools
{
    //Taken and adapted from https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js
    static quickHash(text: string, bits: number = 53)
    {
        if (bits > 53)
            throw new Error("Maximum number of bits limited to 53 as values beyond exceed Math.MAX_SAFE_INTEGER.");

        let h1 = 0xdeadbeef ^ 0;
        let h2 = 0x41c6ce57 ^ 0;

        for (let i = 0, charCode; i < text.length; i++)
        {
            charCode = text.charCodeAt(i);
            h1 = Math.imul(h1 ^ charCode, 0x85ebca77);
            h2 = Math.imul(h2 ^ charCode, 0xc2b2ae3d);
        }

        h1 ^= Math.imul(h1 ^ (h2 >>> 15), 0x735a2d97);
        h2 ^= Math.imul(h2 ^ (h1 >>> 15), 0xcaf649a9);
        h1 ^= h2 >>> 16;
        h2 ^= h1 >>> 16;

        //This returns a 53 bit hash (h2 shifted left by 21 (2**21 = ), contributing 32 bits, h1 shifted right by 11, contributing 21 bits)
        const hashResult = 2097152 * (h2 >>> 0) + (h1 >>> 11);

        //We ditch bits to the right until we reach the desired number of bits.
        return Math.trunc(hashResult / 2 ** (53 - bits));
    };
}

export class FingerPrintingTools
{
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