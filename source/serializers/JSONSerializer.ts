import { Serializer } from "../serializer.ts";
import { InternalConstant, InternalConstants, SerializationSymbols, SerializedType } from "../serium.ts";

export class JSONSerializer extends Serializer<string>
{
    private base64Encodings = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    private indentString = "";
    constructor(
        knownClasses: Map<any, string>,
        knownSymbols: Map<symbol, string>,
        knownObjects: Map<any, number> = new Map(),
        public whitespace?: {
            indentation: string;
        }
    )
    {
        super(knownClasses, knownSymbols, knownObjects);
    }

    protected *emitInstance(instanceData: SerializedType)
    {
        yield "{";

        this.increaseIndentation();

        if (this.whitespace)
            yield "\n" + this.indentString;

        yield `"[Type]":`;

        if (this.whitespace)
            yield " ";

        yield `"${instanceData.type}"`;

        const dataObj = instanceData.data;

        for (const key of Reflect.ownKeys(dataObj))
        {
            if (key === "constructor")
                continue;

            yield* this.emitKVPair(true, key, dataObj[key]);
        }

        this.decreaseIndentation();

        if (this.whitespace)
            yield "\n" + this.indentString;

        yield "}";
    }

    protected *emitObject(object: any)
    {
        if (object === null)
        {
            yield "null";
            return;
        }

        yield "{";

        this.increaseIndentation();

        let nextKVPairNeedsComma = false;

        for (const key of Reflect.ownKeys(object))
        {
            yield* this.emitKVPair(nextKVPairNeedsComma, key, object[key]);
            nextKVPairNeedsComma = true;
        }

        this.decreaseIndentation();

        if (this.whitespace)
            yield "\n" + this.indentString;

        yield "}";
    }

    private *emitKVPair(prependComma: boolean, key: symbol | string, value: any)
    {
        if (prependComma)
            yield ",";

        if (this.whitespace)
            yield "\n" + this.indentString;

        if (typeof key === "string")
            yield JSON.stringify(this.escapedString(key));
        else
            yield this.emitSymbol(key);

        yield ":";

        if (this.whitespace)
            yield " ";

        yield* this.stream(value);
    }

    protected *emitArray(array: any)
    {
        yield "[";

        this.increaseIndentation();

        if (this.whitespace)
            yield "\n";

        for (const element of array)
        {
            if (this.whitespace)
                yield this.indentString;

            yield* this.stream(element);
            yield ",";

            if (this.whitespace)
                yield "\n";
        }

        this.decreaseIndentation();

        if (this.whitespace)
            yield this.indentString;

        yield "]";
    }

    protected *emitBinary(blob: ArrayBuffer)
    {
        //Inspired by https://gist.github.com/jonleighton/958841
        //This streams a base64 encoded string from an ArrayBuffer
        yield `"`;

        const bytes = new Uint8Array(blob);
        const byteLength = bytes.byteLength;
        const byteRemainder = byteLength % 3;
        const mainLength = byteLength - byteRemainder;

        let a, b, c, d;
        let chunk;

        // Main loop deals with bytes in chunks of 3
        for (let i = 0; i < mainLength; i = i + 3)
        {
            // Combine the three bytes into a single integer
            chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

            // Use bitmasks to extract 6-bit segments from the triplet
            a = (chunk & 16515072) >> 18;   // 16515072 = (2^6 - 1) << 18
            b = (chunk & 258048) >> 12;     // 258048   = (2^6 - 1) << 12
            c = (chunk & 4032) >> 6;        // 4032     = (2^6 - 1) << 6
            d = chunk & 63;                 // 63       = 2^6 - 1

            // Convert the raw binary segments to the appropriate ASCII encoding
            yield this.base64Encodings[a] + this.base64Encodings[b] + this.base64Encodings[c] + this.base64Encodings[d];
        }

        // Deal with the remaining bytes and padding
        if (byteRemainder == 1)
        {
            chunk = bytes[mainLength];

            a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

            // Set the 4 least significant bits to zero
            b = (chunk & 3) << 4; // 3   = 2^2 - 1

            yield this.base64Encodings[a] + this.base64Encodings[b] + '==';
        } else if (byteRemainder == 2)
        {
            chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

            a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
            b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4

            // Set the 2 least significant bits to zero
            c = (chunk & 15) << 2; // 15    = 2^4 - 1

            yield this.base64Encodings[a] + this.base64Encodings[b] + this.base64Encodings[c] + '=';
        }

        return `"`;
    }

    protected emitInternalConstant(constant: InternalConstant): string
    {
        return `"[const: ${InternalConstants[constant.value]}]"`;
    }

    protected emitReference(identifier: any): string
    {
        return `"[ref: ${identifier}]"`;
    }

    protected emitNumber(number: number): string
    {
        return number.toString(10);
    }

    protected emitString(string: string): string
    {
        return JSON.stringify(this.escapedString(string));
    }

    protected emitBoolean(bool: boolean): string
    {
        return bool ? "true" : "false";
    }

    protected emitSymbol(symbol: symbol): string
    {
        const symbolName = this.knownSymbols.get(symbol);

        if (!symbolName)
            throw new Error("Can not serialize unknown Symbol");

        return `"[sym: ${symbolName}]"`;
    }

    private escapedString(string)
    {
        if ((string.startsWith("[") || string.startsWith("#")) && string.match(/#*\[(ref: |sym: |const: |Type\])/))
            return `#${string}`;
        else
            return string;
    }

    private increaseIndentation()
    {
        if (this.whitespace)
            this.indentString += this.whitespace.indentation;
    }

    private decreaseIndentation()
    {
        if (this.whitespace)
            this.indentString = this.indentString.substring(0, this.indentString.length - this.whitespace.indentation.length);
    }
}
