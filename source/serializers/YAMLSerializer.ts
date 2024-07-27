import { Serializer } from "../serializer.js";
import { InternalConstant, InternalConstants, SerializedType } from "../constants.js";
import { IEnvironment } from "../serdestrium.js";
import { idGenerator } from "../tools/idTools.js";

const YAMLSerializerConfiguration = {
    standardIndentation: "  "
} as const;

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
        this.idProvider = environment?.idGenerator ?? idGenerator();
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

        yield `${this.indentation.objectHeaderSeparator}!${instanceData.type}`;

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

    private *emitKVPair(key: symbol | string, value: any)
    {
        yield this.indentation.keySeparator;
        yield `${typeof key === "string" ? this.escapedKey(key) : this.emitSymbol(key)}: `;
        this.indentation.push(KeyIndentainer);
        yield* this.streamValue(value);
        this.indentation.pop();
    }

    protected *emitArray(array: any)
    {
        let emittedKeys = false;

        for (const element of array)
        {
            emittedKeys = true;
            yield this.indentation.bulletSeparator;
            yield "- ";
            this.indentation.push(BulletIndentainer);
            yield* this.streamValue(element);
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

    protected emitHandle(identifier: string)
    {
        return `&${identifier}`;
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
        const lines = string.split('\n');

        if (lines.length > 1)
            return this.formatAndEscapeMultilineString(lines);
        else
            return this.escapeSingleLineString(string);
    }

    private formatAndEscapeMultilineString(lines: string[])
    {
        let multilineString = "|";
        let expectsTrailingNewline = false;

        if (lines[lines.length - 1] !== "")
        {
            //We check whether the last line ends with a linefeed. If not we need to omit it in parsed output.
            // | --> |-
            multilineString += "-";
        }
        else if (lines[lines.length - 1] === "" && lines[lines.length - 2] !== "")
        {
            //We have a trailing newline, but we do not emit it
            lines.pop();
            expectsTrailingNewline = true;
        }
        else if (lines.length >= 2 && lines[lines.length - 1] === "" && lines[lines.length - 2] === "")
        {
            //We had an original string with multiple line feeds at the end and need to preserve those.
            multilineString += "+";
            lines.pop();
            expectsTrailingNewline = true;
        } else if (lines[0] === "" && lines[1] === "" && lines.length === 2)
            return `"\\n"`;

        if (/^\s+/.test(lines[0]))
        {
            //We check whether the first line begins with whitespace, and if so, emit the indentation length after the pipe operator to avoid indentation parsing errors.
            const indentLength = this.formatting?.indentation?.length ?? YAMLSerializerConfiguration.standardIndentation.length;
            // | --> |2
            multilineString += indentLength.toString();
        }

        for (const line of lines)
            multilineString += this.indentation.multilineStringSeparator + line;

        this.indentation.expectsTrailingNewline = expectsTrailingNewline;

        return multilineString;
    }

    private escapeSingleLineString(input: string): string
    {
        const quoteType = this.getNeededQuotes(input);

        switch (quoteType)
        {
            case "":
                return input;
            case "'":
                return `'${this.escapeForSingleQuotes(input)}'`;
            case "\"":
                return `"${this.escapeForDoubleQuotes(input)}"`;
        }
    }

    private getNeededQuotes(input: string): '"' | "'" | ""
    {
        if (
            // Check if the input contains any double quote requiring characters
            /['\n\r\t]/.test(input)
        )
            return '"';
        else if (
            input === "" ||
            // Check if the input contains any special characters
            /["\\:@#,\[\]{}?&*!|>%`\-\=]/.test(input) ||
            // Check if string starts or ends with whitespace
            /^\s|\s$/.test(input) ||
            // Check if the input is a reserved YAML keyword (case-insensitive)
            /^(null|true|false|yes|no|on|off)$/i.test(input) ||
            // Check if the input could be mistaken for a number
            /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(input) ||
            // Check for .NaN .Undefined .Inf -.Inf
            /^(?:\.(?:nan|undefined|inf)|-\.inf)$/i.test(input)
        )
            return "'";
        else
            return "";
    }

    private escapeForSingleQuotes(input: string): string
    {
        return input.replace(/'/g, "''");
    }

    private escapeForDoubleQuotes(input: string): string
    {
        return input.replace(/[\\"\t\n\r]/g, char =>
        {
            switch (char)
            {
                case '\\': return '\\\\';
                case '"': return '\\"';
                case '\t': return '\\t';
                case '\n': return '\\n';
                case '\r': return '\\r';
                default: return char;
            }
        });
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

    private escapedKey(key: string)
    {
        return key.includes(" ") ? `'${key}'` : this.escapeSingleLineString(key);
    }

    protected finalize(): string
    {
        return this.indentation.expectsTrailingNewline ? "\n" : "";
    }
}

class Indentainer
{
    //We unfortunately need this property for the edge case that we emitted a literal block with trailing spaces at the very end of our object serialized value.
    //If we do not emit a trailing newline at the very end this would be lost while parsed.
    public expectsTrailingNewline = false;
    protected firstLineUsed = false;
    protected baseIndentation: string;
    private previous: Indentainer;

    constructor(
        private serializerInstance: YAMLSerializer,
        previous?: Indentainer
    )
    {
        this.previous = previous ?? this;
        this.baseIndentation = previous?.childIndentation ?? "";
    };

    protected get configuredIndentation()
    {
        return this.serializerInstance.formatting?.indentation ?? YAMLSerializerConfiguration.standardIndentation;
    }

    get childIndentation(): string
    {
        return "";
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
        {
            this.expectsTrailingNewline = false;
            return "\n";
        }
    }

    get bulletSeparator(): string
    {
        if (!this.firstLineUsed)
        {
            this.firstLineUsed = true;
            return "";
        }
        else
        {
            this.expectsTrailingNewline = false;
            return "\n";
        }
    }

    get multilineStringSeparator()
    {
        this.expectsTrailingNewline = false;
        return "\n" + this.configuredIndentation;
    }

    public push(indentationManager: typeof BulletIndentainer | typeof KeyIndentainer)
    {
        this.serializerInstance.indentation = new indentationManager(this.serializerInstance, this.serializerInstance.indentation);
        this.serializerInstance.indentation.expectsTrailingNewline = this.expectsTrailingNewline;
    }

    public pop()
    {
        this.previous.expectsTrailingNewline = this.expectsTrailingNewline;
        this.serializerInstance.indentation = this.previous;
    }
}

class KeyIndentainer extends Indentainer
{
    get childIndentation(): string
    {
        return this.baseIndentation + this.configuredIndentation;
    }

    get bulletSeparator(): string
    {
        this.firstLineUsed = true;
        this.expectsTrailingNewline = false;
        return "\n" + this.childIndentation;
    }

    get keySeparator(): string
    {
        this.firstLineUsed = true;
        this.expectsTrailingNewline = false;
        return "\n" + this.childIndentation;
    }

    get multilineStringSeparator()
    {
        this.expectsTrailingNewline = false;
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
        if (!this.firstLineUsed)
        {
            this.firstLineUsed = true;
            return "";
        }
        else
        {
            this.expectsTrailingNewline = false;
            return "\n" + this.childIndentation;
        }
    }

    get keySeparator(): string
    {
        if (!this.firstLineUsed)
        {
            this.firstLineUsed = true;
            return "";
        }
        else
        {
            this.expectsTrailingNewline = false;
            return "\n" + this.childIndentation;
        }
    }

    get multilineStringSeparator()
    {
        this.expectsTrailingNewline = false;
        return "\n" + this.childIndentation;
    }
}

