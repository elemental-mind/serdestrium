import { Serializer } from "../serializer.js";
import { InternalConstant, InternalConstants, SerializedType } from "../constants.js";
import { IEnvironment } from "../serdestrium.js";

export class JSONSerializer extends Serializer<string>
{
    private indentString = "";
    constructor(
        environment?: IEnvironment,
        public whitespace?: {
            indentation: string;
        }
    )
    {
        super(environment);
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

    protected *emitBinary(buffer: ArrayBuffer)
    {
        yield `"[bin]`;
        yield* this.streamArrayBufferAsBase64String(buffer);
        yield `"`;
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

    private escapedString(string: string)
    {
        if ((string.startsWith("[") || string.startsWith("#")) && string.match(/#*\[(ref: |sym: |const: |bin\] |Type\])/))
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
