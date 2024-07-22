import { ICustomSerialization, Token, TokenSymbol, TypedElementTypes } from "./serium.js";

type TokenStreamInterpreter<Consumes, Returns> = Generator<void, Returns, Consumes>;

export abstract class Interpreter
{
    protected tokenInterpreter!: Generator<any, void, TokenSymbol | any>;

    constructor(
        public knownClasses: Map<string, any>,
        public knownSymbols: Map<string, symbol>,
        public knownObjects: Map<number, any> = new Map()
    ) { }

    protected abstract initializeByteInterpreter(): void;
    protected abstract advance(chunk: string): void;
    protected abstract terminate(): void;

    async parseStream(stream: AsyncGenerator<string>)
    {
        this.tokenInterpreter = this.parseValue();
        this.tokenInterpreter.next();

        this.initializeByteInterpreter();

        for await (const chunk of stream)
            this.advance(chunk);

        return this.tokenInterpreter.next().value;
    }

    parse(text: string)
    {
        this.tokenInterpreter = this.getInterpreterStream();
        //As generators emit values first before taking values in we need to prime the generator for it to wait for an input value at the first yield
        this.tokenInterpreter.next();
        this.tokenInterpreter.next(Token.StreamStart);

        this.initializeByteInterpreter();

        this.advance(text);

        return this.tokenInterpreter.next(Token.StreamEnd).value;
    }

    private *getInterpreterStream()
    {
        const firstToken = (yield) as Symbol;
        if (firstToken !== Token.StreamStart)
            throw new Error("Invalid start");
        const returnValue = yield* this.parseValue();
        const lastToken = (yield) as Symbol;
        if (lastToken !== Token.StreamEnd)
            throw new Error("Expected end of stream.");
        return returnValue;
    }

    private *parseValue(type?: symbol): TokenStreamInterpreter<TokenSymbol | any, any>
    {
        const token = type ?? (yield);

        switch (token)
        {
            case Token.InstanceStart:
                return yield* this.parseInstance();
            case Token.ObjectStart:
                return yield* this.parseObject();
            case Token.ArrayStart:
                return yield* this.parseArray();
            case Token.BinaryStart:
                return yield* this.parseBinary();
            case Token.Reference:
                return this.parseReference((yield) as number);
            case Token.Symbol:
                return this.parseSymbol((yield) as string);
            case Token.String:
            case Token.Number:
            case Token.Boolean:
            case Token.Constant:
                const value = yield;
                return value;
        }
    }

    private *parseObject(): TokenStreamInterpreter<TokenSymbol, object>
    {
        const object = {};
        this.knownObjects.set(this.knownObjects.size, object);

        yield* this.parseKeyValuePairs(object);

        return object;
    }

    private *parseArray(): TokenStreamInterpreter<TokenSymbol, Array<any>>
    {
        const array = [] as any[];
        this.knownObjects.set(this.knownObjects.size, array);

        ParseArrayValues:
        while (true)
        {
            const token = yield;
            switch (token)
            {
                case Token.Delimiter:
                    continue ParseArrayValues;
                case Token.ArrayEnd:
                    break ParseArrayValues;
                default:
                    array.push(yield* this.parseValue(token));
            }
        }

        return array;
    }

    private *parseInstance(): TokenStreamInterpreter<string, any>
    {
        const type = yield;
        switch (type)
        {
            case "Native.BigInt":
                return yield* this.parseBigInt();
            case "Native.TypedArray":
                return yield* this.parseTypedArray();
            case "Native.DataView":
                return yield* this.parseDataView();
            case "Native.Map":
                return yield* this.parseMap();
            case "Native.Set":
                return yield* this.parseSet();
            case "Native.Date":
                return yield* this.parseDate();
            case "Native.Error":
                return yield* this.parseError();
            case "Native.RegExp":
                return yield* this.parseRegExp();
            default:
                return yield* this.parseClassInstance(type);
        }
    }

    private *parseClassInstance(type: string)
    {
        const clss: { prototype: ICustomSerialization; } = this.knownClasses.get(type);

        if (!clss)
            throw new Error("Unknown class");

        const instance: ICustomSerialization = Object.create(clss.prototype);
        this.knownObjects.set(this.knownObjects.size, instance);

        if (clss.prototype.onDeserialization)
        {
            const data = {};
            yield* this.parseKeyValuePairs(data) as any;
            instance.onDeserialization!(data);
        }
        else
        {
            yield* this.parseKeyValuePairs(instance) as any;

            if (instance.onPostDeserialization)
                instance.onPostDeserialization();
        }

        return instance;
    }

    private *parseBinary(): TokenStreamInterpreter<symbol | Uint8Array, ArrayBuffer>
    {
        const chunks = [];
        let byteLength = 0;

        let byteChunkOrEndToken = yield;

        while (byteChunkOrEndToken !== Token.BinaryEnd)
        {
            chunks.push(byteChunkOrEndToken as Uint8Array);
            byteLength += (byteChunkOrEndToken as Uint8Array).byteLength;
            byteChunkOrEndToken = yield;
        }

        const byteArray = new Uint8Array(byteLength);
        let currentOffset = 0;

        for (const chunk of chunks)
        {
            byteArray.set(chunk, currentOffset);
            currentOffset += chunk.byteLength;
        }

        return byteArray.buffer;
    }

    private *parseSerializedNativeType(): TokenStreamInterpreter<any, any>
    {
        const data: { data: any; } = {} as any;
        yield* this.parseKeyValuePairs(data);
        return data.data;
    }

    private *parseBigInt(): TokenStreamInterpreter<any, BigInt>
    {
        const data = (yield* this.parseSerializedNativeType()) as string;
        return BigInt(data);
    }

    private *parseTypedArray(): TokenStreamInterpreter<any, any>
    {
        const data = (yield* this.parseSerializedNativeType()) as {
            type: TypedElementTypes,
            offset: number,
            length: number,
            buffer: ArrayBuffer;
        };

        //We use UInt8 Array to please the TS gods - all their constructor signatures are the same.
        //@ts-ignore
        const constructor = globalThis[data.type + "Array"] as typeof Uint8Array;
        return new constructor(data.buffer, data.offset, data.length);
    }

    private *parseDataView(): TokenStreamInterpreter<any, DataView>
    {
        const data = (yield* this.parseSerializedNativeType()) as {
            buffer: ArrayBuffer,
            offset: number,
            length: number;
        };

        return new DataView(data.buffer, data.offset, data.length);
    }

    private *parseMap(): TokenStreamInterpreter<any, Map<any, any>>
    {
        const map = new Map<any, any>();

        //Token.String
        yield;
        const key = yield;

        if (key !== "data") throw new Error("No data property present for map.");

        //Token.ArrayStart (first yield) or Token.Delimiter(subsequent)
        while ((yield) as TokenSymbol !== Token.ArrayEnd)
        {
            //Token.ArrayStart
            yield;
            const key = yield* this.parseValue();
            //Token.Delimiter
            yield;
            const value = yield* this.parseValue();
            //Token.ArrayEnd
            yield;

            map.set(key, value);
        }

        return map;
    }

    private *parseSet(): TokenStreamInterpreter<any, Set<any>>
    {
        const set = new Set<any>();

        //Token.String
        yield;
        const key = yield;

        if (key !== "data") throw new Error("No data property present for set.");

        //Token.ArrayStart (first yield) or Token.Delimiter(subsequent)
        while ((yield) as TokenSymbol !== Token.ArrayEnd)
        {
            set.add(yield* this.parseValue());
        }

        return set;
    }

    private *parseDate(): TokenStreamInterpreter<any, Date>
    {
        const data = (yield* this.parseSerializedNativeType()) as number;
        return new Date(data);
    }

    private *parseError(): TokenStreamInterpreter<any, Error>
    {
        const data = (yield* this.parseSerializedNativeType()) as {
            name: string,
            message: string,
            stack?: string;
        };

        const error = new Error(data.message);
        error.name = data.name;
        if (data.stack)
        {
            error.stack = data.stack;
        }
        return error;
    }

    private *parseRegExp(): TokenStreamInterpreter<any, RegExp>
    {
        const data = (yield* this.parseSerializedNativeType()) as string;

        return new RegExp(data);
    }

    private *parseKeyValuePairs(objectToParseInto: any): TokenStreamInterpreter<TokenSymbol | string, void>
    {
        let key;

        RouteKVPairs:
        while (true)
        {
            const token = yield;
            switch (token)
            {
                case Token.InstanceEnd:
                case Token.ObjectEnd:
                    break RouteKVPairs;
                case Token.Delimiter:
                    continue RouteKVPairs;
                case Token.String:
                    key = yield;
                    break;
                case Token.Symbol:
                    key = this.parseSymbol((yield) as string);
                    break;
                default:
                    throw new Error("Unexpected token");
            }

            //@ts-ignore
            objectToParseInto[key] = yield* this.parseValue();
        }
    }

    private parseReference(refID: number): TokenStreamInterpreter<number, object>
    {
        const referencedObject = this.knownObjects.get(refID);

        if (!referencedObject)
            throw new Error("Object with reference " + refID + " not defined");

        return referencedObject;
    }

    private parseSymbol(symbolID: string): Symbol
    {
        const referencedSymbol = this.knownSymbols.get(symbolID);

        if (!referencedSymbol)
            throw new Error("Symbol with reference " + symbolID + " not defined");

        return referencedSymbol;
    }
}