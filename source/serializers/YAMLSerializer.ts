import { Serializer } from "../serializer.js";
import { InternalConstant, InternalConstants, SerializedType } from "../constants.js";
import { IEnvironment } from "../serdestrium.js";

export interface YAMLFormatting
{
    indentation?: string;
    maxStringLineLength?: number;
}

export class YAMLSerializer extends Serializer<string>
{
    public indentation: Indentainer = new Indentainer(this);

    constructor(
        environment?: IEnvironment,
        public formatting?: YAMLFormatting
    )
    {
        super(environment);
    }

    protected * emitObject(object: any)
    {
        let emittedKeys = false;
        const keys = Reflect.ownKeys(object);

        for (const key of Reflect.ownKeys(object))
        {
            emittedKeys = true;
            yield* this.emitKVPair(key, object[key]);
        }

        if (!emittedKeys)
            yield "{}";
    }

    protected * emitInstance(instanceData: SerializedType)
    {
        let emittedKeys = false;

        yield `${this.indentation.objectHeaderSeparator} !${instanceData.type}`;

        const dataObj = instanceData.data;
        for (const key of Reflect.ownKeys(dataObj))
        {
            if (key === "constructor")
                continue;

            emittedKeys = true;
            yield* this.emitKVPair(key, dataObj[key]);
        }

        if (!emittedKeys)
            yield "{}";
    }

    private * emitKVPair(key: symbol | string, value: any)
    {
        yield this.indentation.keySeparator;
        yield `${typeof key === "string" ? this.escapedString(key) : this.emitSymbol(key)}: `;
        this.indentation.push(KeyIndentainer);
        yield* this.stream(value);
        this.indentation.pop();
    }

    protected * emitArray(array: any)
    {
        let emittedKeys = false;

        for (const element of array)
        {
            emittedKeys = true;
            yield this.indentation.bulletSeparator;
            this.indentation.push(BulletIndentainer);
            yield* this.stream(element);
            this.indentation.pop();
        }

        if (!emittedKeys)
            yield "[]";
    }

    protected *emitBinary(buffer: ArrayBuffer)
    {
        yield this.indentation.objectHeaderSeparator + "!!binary |";
        yield this.indentation.multilineStringSeparator;
        yield* this.streamArrayBufferAsBase64String(buffer);
    }

    protected emitInternalConstant(constant: InternalConstant): string
    {
        switch (constant.value)
        {
            case InternalConstants.NaN:
                return ".NaN";
            case InternalConstants.Infinity:
                return ".Inf";
            case InternalConstants.Undefined:
                return ".Undefined";
        }
    }

    protected emitReference(identifier: string): string
    {
        return `*${identifier}`;
    }

    protected emitNumber(number: number): string
    {
        return `${number}`;
    }

    protected emitString(string: string): string
    {
        return this.escapedString(string);
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

        return `!symbol ${symbolName}`;
    }

    private escapedString(string: string)
    {
        switch (string.charAt(0))
        {
            case "t":
            case "f":
            case "y":
            case "n":
            case "o":
                if (/^(true|false|yes|no|on|off)$/i.test(string))
                    return `'${string}'`;
        }

        return string;
    }
}

class Indentainer
{
    protected firstLineUsed = false;
    protected baseIndentation: string;

    constructor(
        private serializerInstance: YAMLSerializer,
        private previous?: Indentainer
    )
    {
        this.baseIndentation = this.previous?.childIndentation ?? "";
    };

    get childIndentation(): string
    {
        return this.baseIndentation + (this.serializerInstance.formatting?.indentation ?? "  ");
    }

    get objectHeaderSeparator(): string
    {
        this.firstLineUsed = true;
        return "";
    }

    get keySeparator(): string
    {
        if (!this.firstLineUsed)
        {
            this.firstLineUsed = true;
            return "";
        }
        else
            return "\n";
    }

    get bulletSeparator(): string
    {
        if (!this.firstLineUsed)
        {
            this.firstLineUsed = true;
            return "";
        }
        else
            return "\n";
    }

    get multilineStringSeparator()
    {
        return "\n" + this.baseIndentation;
    }

    public push(indentationManager: typeof BulletIndentainer | typeof KeyIndentainer)
    {
        this.serializerInstance.indentation = new indentationManager(this.serializerInstance, this.serializerInstance.indentation);
    }

    public pop()
    {
        this.serializerInstance.indentation = this.previous!;
    }
}

class KeyIndentainer extends Indentainer
{
    get bulletSeparator(): string
    {
        this.firstLineUsed = true;
        return "\n" + this.childIndentation;
    }

    get keySeparator(): string
    {
        this.firstLineUsed = true;
        return "\n" + this.childIndentation;
    }
}

class BulletIndentainer extends Indentainer
{
    get childIndentation()
    {
        return this.baseIndentation + "  ";
    }

    get bulletSeparator(): string
    {
        if (this.firstLineUsed)
        {
            this.firstLineUsed = true;
            return "";
        }
        else
            return "\n" + this.childIndentation;
    }

    get keySeparator(): string
    {
        if (this.firstLineUsed)
        {
            this.firstLineUsed = true;
            return "";
        }
        else
            return "\n" + this.childIndentation;
    }
}

