import { Interpreter } from "../interpreter.js";
import { Token } from "../serium.js";

export class JSONInterpreter extends Interpreter
{
    private currentCharacter: string = "";
    private charStreamInterpreter!: Generator;

    private base64LookupTable?: Uint8Array;

    private charBuffer = new Array<string>(1000);

    private result!: {
        streamComplete: boolean,
        error?: Error,
        value?: any;
    };

    protected initializeByteInterpreter()
    {
        this.currentCharacter = "";
        this.charBuffer.length = 0;
        this.charStreamInterpreter = this.startStream();
        this.result = {
            streamComplete: false
        };
    }

    protected advance(chunk: string)
    {
        for (const char of chunk)
        {
            this.currentCharacter = char;
            this.charStreamInterpreter.next();
        }

        this.currentCharacter = "";
        this.charStreamInterpreter.next();
    }

    protected terminate()
    {
        if (!this.result.streamComplete)
            throw new Error("Stream incomplete");

        return this.result.value;
    }

    private *startStream()
    {
        yield* this.skipWhiteSpace();

        this.result.value = yield* this.streamValue();

        if (this.currentCharacter === "")
            this.result.streamComplete = true;
        else
            throw new Error("Unexpected character " + this.currentCharacter + " after JSON completion.");

        return Token.StreamEnd;
    }

    private *streamValue() : Generator
    {
        switch (this.currentCharacter)
        {
            case `"`:
                yield* this.streamStringOrBinary();
                break;
            case `{`:
                yield* this.streamObjectOrInstance();
                break;
            case `[`:
                yield* this.streamArray();
                break;
            default:
                yield* this.streamNumberOrNativeValue();
                break;
        }

        yield* this.skipWhiteSpace();
    }

    private *streamObjectOrInstance()
    {
        //Skipping {
        yield;

        yield* this.skipWhiteSpace();

        //Skipping "
        yield;
        const firstKey = yield* this.readRawString();

        let streamMode: "Instance" | "Object";

        if (firstKey === "[Type]")
        {
            streamMode = "Instance";
            this.tokenInterpreter.next(Token.InstanceStart);

            yield* this.skipColon();

            this.tokenInterpreter.next(Number(yield* this.readRawString()));
        }
        else
        {
            streamMode = "Object";
            this.tokenInterpreter.next(Token.ObjectStart);

            this.emitInterpretedString(firstKey);

            yield* this.skipColon();

            yield* this.streamValue();
        }

        yield* this.streamKeyValuePairs();

        //Skipping }
        if (this.currentCharacter !== "}") throw new Error("Expected { but got " + this.currentCharacter);
        yield;

        yield* this.skipWhiteSpace();

        this.tokenInterpreter.next(streamMode === "Instance" ? Token.InstanceEnd : Token.ObjectEnd);
    }

    private *streamKeyValuePairs()
    {
        while (this.currentCharacter === ",")
        {
            //Skipping ,
            this.tokenInterpreter.next(Token.Delimiter);
            yield;

            yield* this.skipWhiteSpace();

            yield* this.streamStringOrBinary();

            yield* this.skipColon();

            yield* this.streamValue();
        }
    }

    private *skipColon()
    {
        yield* this.skipWhiteSpace();

        //Skipping :
        if (this.currentCharacter !== ":" as string) throw new Error("Expected : but got " + this.currentCharacter);
        yield;

        yield* this.skipWhiteSpace();
    }

    private *streamArray()
    {
        //Skipping "["
        yield;

        this.tokenInterpreter.next(Token.ArrayStart);

        yield* this.skipWhiteSpace();

        yield* this.streamValue();

        while (this.currentCharacter === ",")
        {
            //Skipping ,
            yield;

            this.tokenInterpreter.next(Token.Delimiter);

            yield* this.skipWhiteSpace();

            yield* this.streamValue();
        }

        if (this.currentCharacter !== ']' as string) throw new Error("Expected [ but got " + this.currentCharacter);
        yield;
        
        this.tokenInterpreter.next(Token.ArrayEnd);
    }

    private *streamStringOrBinary()
    {
        //Skipping "
        yield;

        let string;

        if (this.currentCharacter === "[")
        {
            //Skipping [
            this.charBuffer.push(this.currentCharacter);
            yield;

            if (yield* this.tryMatch(["bin]"]))
            {
                yield* this.streamBinary();
                return;
            }
            else
            {
                string = yield* this.readRawString();
            }
        }
        else
        {
            string = yield* this.readRawString();
        }

        this.emitInterpretedString(string);
    }

    private *streamBinary()
    {
        if (!this.base64LookupTable)
        {
            const base64Encodings = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

            //The highest charCode is 'z' = 122, we hence need to allocate an array that covers this with 123 elements
            this.base64LookupTable = new Uint8Array(123);
            for (let i = 0; i < base64Encodings.length; i++)
                this.base64LookupTable[base64Encodings.charCodeAt(i)] = i;
        }

        this.tokenInterpreter.next(Token.BinaryStart);

        const charCodeBuffer = new Uint8Array(4);
        let charCodeBufUsage = 0;
        const byteBuffer = new Uint8Array(3000);
        let byteBufUsage = 0;
        let chunk = 0;

        //Parse string in chunks of 4 characters
        while (!(this.currentCharacter === '"' || this.currentCharacter === "="))
        {
            charCodeBuffer[charCodeBufUsage++] = this.base64LookupTable[this.currentCharacter.charCodeAt(0)];

            //Every 4 characters represent 3 bytes
            if (charCodeBufUsage === 4)
            {
                // Combine the four 6-bit segments back into a single 24-bit integer
                chunk = (charCodeBuffer[0] << 18) | (charCodeBuffer[1] << 12) | (charCodeBuffer[2] << 6) | charCodeBuffer[3];

                // Extract the three original bytes from the 24-bit integer
                byteBuffer[byteBufUsage++] = (chunk & 0xFF0000) >> 16;
                byteBuffer[byteBufUsage++] = (chunk & 0xFF00) >> 8;
                byteBuffer[byteBufUsage++] = chunk & 0xFF;

                // Emitting Chunk
                if (byteBufUsage === 3000)
                {
                    this.tokenInterpreter.next(byteBuffer);
                    byteBufUsage = 0;
                }

                charCodeBufUsage = 0;
            }

            yield;
        }

        // Collecting remaining paddings
        while (this.currentCharacter === "=") yield;

        if (charCodeBufUsage > 0)
        {
            chunk = (charCodeBuffer[0] << 18) | (charCodeBuffer[1] << 12) | ((charCodeBufUsage > 2 ? charCodeBuffer[2] : 0) << 6);

            byteBuffer[byteBufUsage++] = (chunk & 0xFF0000) >> 16;
            if (charCodeBufUsage > 2)
                byteBuffer[byteBufUsage++] = (chunk & 0xFF00) >> 8;
        }

        // Emitting last chunk
        if (byteBufUsage > 0)
            this.tokenInterpreter.next(byteBuffer.subarray(0, byteBufUsage));

        this.tokenInterpreter.next(Token.BinaryEnd);

        // Skipping "
        yield;

        this.skipWhiteSpace();
    }

    private *readRawString()
    {
        let string = "";

        while (this.currentCharacter !== '"')
        {
            if (this.currentCharacter === "\\" as string)
            {
                // Skipping escape character
                yield;

                switch (this.currentCharacter) 
                {
                    case '"':
                    case '\\':
                    case '/':
                        this.charBuffer.push(this.currentCharacter);
                        break;
                    case 'b':
                        this.charBuffer.push('\b');
                        break;
                    case 'f':
                        this.charBuffer.push('\f');
                        break;
                    case 'n':
                        this.charBuffer.push('\n');
                        break;
                    case 'r':
                        this.charBuffer.push('\r');
                        break;
                    case 't':
                        this.charBuffer.push('\t');
                        break;
                    case 'u':
                        let hex = "";
                        for (let i = 0; i < 4; i++)
                        {
                            yield;
                            hex += this.currentCharacter;
                        }
                        this.charBuffer.push(String.fromCharCode(parseInt(hex, 16)));
                        break;
                    default:
                        throw new Error("Invalid escape sequence");
                }
            } 
            else
            {
                this.charBuffer.push(this.currentCharacter);
            }

            //Flushing the buffer;
            if (this.charBuffer.length === 1000)
            {
                string = string.concat(...this.charBuffer);
                this.charBuffer.length = 0;
            }

            yield;
        }

        string = string.concat(...this.charBuffer);
        this.charBuffer.length = 0;

        //Skipping "
        yield;
        yield* this.skipWhiteSpace();

        return string;
    }

    private emitInterpretedString(string: string)
    {
        switch (string.charAt(0))
        {
            case "[":
                switch (string.charAt(1))
                {
                    case "r":
                        return this.emitReferenceIdentifier(string);
                    case "c":
                        return this.emitConstant(string);
                    case "s":
                        return this.emitSymbolIdentifier(string);
                    default:
                        return this.emitString(string);
                }
            case "#":
                return this.emitString(string.substring(1));
            default:
                return this.emitString(string);
        }
    }

    private emitString(string: string)
    {
        this.tokenInterpreter.next(Token.String);
        this.tokenInterpreter.next(string);
    }

    private emitConstant(string: string)
    {
        this.tokenInterpreter.next(Token.Constant);
        switch (string)
        {
            case "[const: NaN]":
                return this.tokenInterpreter.next(NaN);
            case "[const: Infinity]":
                return this.tokenInterpreter.next(Infinity);
            case "[const: Undefined]":
                return this.tokenInterpreter.next(undefined);
            default:
                return this.emitString(string);
        }
    }

    private emitSymbolIdentifier(string: string)
    {
        //[sym: Identifier]
        this.tokenInterpreter.next(Token.Symbol);
        this.tokenInterpreter.next(string.substring(6, string.length - 1));
    }

    private emitReferenceIdentifier(string: string)
    {
        //[ref: 1234567]
        this.tokenInterpreter.next(Token.Reference);
        this.tokenInterpreter.next(Number(string.substring(6, string.length - 1)));
    }

    private *streamNumberOrNativeValue()
    {
        switch (this.currentCharacter)
        {
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
            case '-':
                yield* this.streamNumber();
                break;
            case 't':
            case 'f':
            case 'n':
                yield* this.streamNativeValue();
                break;
            default:
                throw new Error("Unexpected character: " + this.currentCharacter);
        }
    }

    private *streamNumber()
    {
        while (true)
        {
            switch (this.currentCharacter)
            {
                case '-':
                case '0':
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                case '7':
                case '8':
                case '9':
                case '.':
                case 'e':
                case 'E':
                    this.charBuffer.push(this.currentCharacter);
                    yield;
                    break;
                default:
                    yield* this.skipWhiteSpace();
                    const number = Number("".concat(...this.charBuffer));
                    this.charBuffer.length = 0;
                    this.tokenInterpreter.next(Token.Number);
                    this.tokenInterpreter.next(number);
                    return number;
            }
        }
    }

    private *streamNativeValue()
    {
        switch (yield* this.tryMatch(["true", "false", "null"]))
        {
            case "true":
                this.tokenInterpreter.next(Token.Boolean);
                this.tokenInterpreter.next(true);
                break;
            case "false":
                this.tokenInterpreter.next(Token.Boolean);
                this.tokenInterpreter.next(false);
                break;
            case "null":
                this.tokenInterpreter.next(Token.Constant);
                this.tokenInterpreter.next(null);
                break;
            default:
                throw new Error("Expected true, false or null but got " + this.currentCharacter);
        }

        this.charBuffer.length = 0;

        yield* this.skipWhiteSpace();
    }

    private *tryMatch(uniqueBeginningCandidates: string[])
    {
        const candidate = uniqueBeginningCandidates.find(value => value.startsWith(this.currentCharacter))!;

        while (this.charBuffer.length < candidate.length)
        {
            if (this.currentCharacter !== candidate[this.charBuffer.length])
                return undefined;

            this.charBuffer.push(this.currentCharacter);
            yield;
        }

        return candidate;
    }

    private *skipWhiteSpace()
    {
        while (true)
        {
            switch (this.currentCharacter)
            {
                case " ":
                case "\n":
                case "\t":
                    yield;
                default:
                    return;
            }
        }
    }
}