const unambiguousChars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghkmnpqrstuvwxyz23456789".split("");

export function encodeClass(clss: any) : string
{
    //encodes a prototype into a form like this: [{topProto: someMethod, someOtherMethod}, {oneDownProto: inheritedMethod}, {object}];
    const prototypes = unfoldProtoChain(clss.prototype);
    const protoStrings = prototypes.map(proto => getProtoPropertyString(proto));
    
    const fingerprintString = `[${protoStrings.join(", ")}]`;

    //We only need 35 bits, as we have 54 characters 6 times = 54**6 = 2**34.529 ~ 2**35 
    const hash = quickHash(fingerprintString, 35);
    const identifier = encode(hash, unambiguousChars, 6);

    return identifier.reverse().join("");
}

function unfoldProtoChain(prototype: any)
{
    const protoChain: any[] = [];

    let currentPrototype = prototype;

    while (currentPrototype !== Object.prototype || currentPrototype !== null)
    {
        protoChain.push(currentPrototype);
        currentPrototype = Object.getPrototypeOf(currentPrototype);
    }

    return protoChain;
}

function getProtoPropertyString(proto: any)
{
    const commaSeparatedPropNames = Reflect.ownKeys(proto).map(key => key.toString()).join(", ");

    return `{${proto.constructor.name}: ${commaSeparatedPropNames}}`;
}

//Taken and adapted from https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js
function quickHash(text: string, bits: number = 53)
{
    if(bits > 53)
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
    
    //This returns a 53 bit hash (h2 shifted left by 21, contributing 32 bits, h1 shifted right by 11, contributing 21 bits)
    const hashResult = (2**21) * (h2 >>> 0) + (h1 >>> 11);

    //We ditch bits to the right until we reach the desired number of bits.
    return hashResult / 2**(53-bits);
};


function encode<T>(number: number, symbols: T[], fixedLength?: number) : T[]
{
    let digits = convertToBase(number, symbols.length);

    if(fixedLength)
    {
        if(digits.length > fixedLength)
            digits = digits.slice(0, fixedLength);
        else if(digits.length < fixedLength)
            for(let i = digits.length; i < fixedLength; i++)
                digits.push(0);
    }

    const symbolString = digits.map(digit => symbols[digit]);

    return symbolString;
}

function convertToBase(number: number, newBase: number)
{
    const digits: number[] = [];
    
    let currentValue = number;

    while(currentValue > 0)
    {
        const remainder = number % newBase;
        digits.push(remainder);

        currentValue -= remainder;
        currentValue /= newBase;
    }

    return digits;
}