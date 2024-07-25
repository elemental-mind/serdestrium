import { InternalConstant, Constants, SerializedType } from "./constants.js";
import { IEnvironment } from "./serdestrium.js";
import { idGenerator } from "./tools/idTools.js";

export abstract class Serializer<T extends string | ArrayBufferView>
{
    public knownClasses: Map<any, string>;
    public knownSymbols: Map<symbol, string>;
    public knownObjects: Map<any, string>;
    
    protected idProvider: Generator<string>;

    private base64Encodings = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    constructor(environment?: IEnvironment)
    {
        this.knownClasses = environment?.knownClasses ?? new Map();
        this.knownSymbols = environment?.knownSymbols ?? new Map();
        this.knownObjects = environment?.knownObjects ?? new Map();
        this.idProvider = environment?.idGenerator?? idGenerator("~");
    }

    protected abstract emitInstance(instanceData: SerializedType): Generator<T>;
    protected abstract emitObject(object: null | object): Generator<T>;
    protected abstract emitArray(array: Array<any>): Generator<T>;
    protected abstract emitBinary(blob: ArrayBuffer): Generator<T>;
    protected abstract emitReference(identifier: string): T;
    protected abstract emitNumber(number: number): T;
    protected abstract emitString(string: string): T;
    protected abstract emitBoolean(bool: boolean): T;
    protected abstract emitSymbol(symbol: symbol): T;
    protected abstract emitInternalConstant(constant: InternalConstant): T;

    *stream(object: any): Generator<T>
    {
        if (this.knownObjects.has(object))
        {
            yield this.emitReference(this.knownObjects.get(object)!);
            return;
        }

        if (typeof object === "object" && object !== null)
        {
            this.knownObjects.set(object, this.idProvider.next().value);
        }

        const preformatted = this.preformat(object);

        switch (typeof preformatted)
        {
            case "object":
                switch (Object.getPrototypeOf(preformatted))
                {
                    case SerializedType.prototype:
                        yield* this.emitInstance(preformatted);
                        break;
                    case Object.prototype:
                        yield* this.emitObject(preformatted);
                        break;
                    case Array.prototype:
                        yield* this.emitArray(preformatted);
                        break;
                    case ArrayBuffer.prototype:
                        yield* this.emitBinary(preformatted);
                        break;
                    case InternalConstant.prototype:
                        yield this.emitInternalConstant(preformatted);
                        break;
                }
                break;
            case "string":
                yield this.emitString(preformatted);
                break;
            case "number":
                yield this.emitNumber(preformatted);
                break;
            case "boolean":
                yield this.emitBoolean(preformatted);
                break;
            case "symbol":
                yield this.emitSymbol(preformatted);
                break;
        }
    }

    serialize(object: any)
    {
        const chunks: T[] = [];

        for (const chunk of this.stream(object))
            chunks.push(chunk);

        if (!chunks[0])
            return undefined;

        if (typeof chunks[0] === "string")
            return chunks.join("");
        else
            return this.joinBuffer(chunks as ArrayBufferView[]);
    }

    private joinBuffer(chunks: ArrayBufferView[])
    {
        let length = 0;
        for (const chunk of chunks)
            length += chunk.byteLength;

        let buf = new Uint8Array(length);
        let offset = 0;
        for (const v of chunks)
        {
            const uint8view = new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
            buf.set(uint8view, offset);
            offset += uint8view.byteLength;
        }

        return buf;
    }

    protected preformat(element: any)
    {
        switch (typeof element)
        {
            case "string":
            case "boolean":
            case "symbol":
                return element;
            case "number":
                return this.preformatNumber(element);
            case "function":
                return undefined;
            case "undefined":
                return Constants.Undefined;
            case "bigint":
                return this.preformatBigInt(element);
            case "object":
                const object = element;
                if (object === null)
                    return object;

                switch (Object.getPrototypeOf(object))
                {
                    case null:
                    case Object.prototype:
                    case Array.prototype:
                    case ArrayBuffer.prototype:
                        return object;
                    case Int8Array.prototype:
                    case Uint8Array.prototype:
                    case Uint8ClampedArray.prototype:
                    case Int16Array.prototype:
                    case Uint16Array.prototype:
                    case Int32Array.prototype:
                    case Uint32Array.prototype:
                    case Float32Array.prototype:
                    case Float64Array.prototype:
                        return this.preformatTypedArray(object);
                    case DataView.prototype:
                        return this.preformatDataView(object);
                    case Map.prototype:
                        return this.preformatMap(object);
                    case Set.prototype:
                        return this.preformatSet(object);
                    case Error.prototype:
                        return this.preformatError(object);
                    case RegExp.prototype:
                        return this.preformatRegEx(object);
                    case Date.prototype:
                        return this.preformatDate(object);
                    default:
                        return this.preformatInstance(object);
                }
        }
    }

    protected preformatInstance(instance: any)
    {
        const prototype = Object.getPrototypeOf(instance);

        let classID = this.knownClasses.get(prototype.constructor) || prototype.constructor.name;

        const serializationInfo = new SerializedType(classID);

        //We need to discern here as classes with hooks would alter their own representation
        //We therefore need to feed those classes a fresh data object that they can modify without modifying their own properties
        if (instance.onSerialization)
        {
            serializationInfo.data = {};

            instance.onSerialization(serializationInfo.data);
        }
        else if (instance.onPostSerialization)
        {
            serializationInfo.data = {};

            for (const key of Reflect.ownKeys(instance))
                serializationInfo.data[key] = instance[key];

            instance.onPostSerialization(serializationInfo.data);
        }
        else
        {
            //In this case we have no hooks and thus no need for a shadow copy of the class.
            serializationInfo.data = instance;
        }

        return serializationInfo;
    }

    protected preformatNumber(number: number)
    {
        if (Number.isNaN(number))
            return Constants.NaN;

        if (number === Infinity)
            return Constants.Infinity;

        return number;
    }

    protected preformatBigInt(int: BigInt)
    {
        return new SerializedType("Native.BigInt", int.toString());
    }

    protected preformatTypedArray(typedArray: DataView)
    {
        //This maps "Int8Array" to "Int8" which can then be looked up in our SerializationConstants
        const elementTypeName = Object.getPrototypeOf(typedArray).constructor.name.split("Array")[0];

        return new SerializedType("Native.TypedArray", {
            type: elementTypeName,
            offset: typedArray.byteOffset,
            length: typedArray.byteLength,
            buffer: typedArray.buffer
        });
    }

    protected preformatDataView(view: DataView)
    {
        return new SerializedType("Native.DataView", {
            buffer: view.buffer,
            offset: view.byteOffset,
            length: view.byteLength
        });
    }

    protected preformatMap(map: Map<any, any>)
    {
        return new SerializedType("Native.Map", [...map]);
    }

    protected preformatSet(set: Set<any>)
    {
        return new SerializedType("Native.Set", [...set]);
    }

    protected preformatDate(date: Date)
    {
        return new SerializedType("Native.Date", date.getTime());
    }

    protected preformatError(error: Error)
    {
        return new SerializedType("Native.Error", {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
    }

    protected preformatRegEx(regEx: RegExp)
    {
        return new SerializedType("Native.RegExp", regEx.toString());
    }

    protected *streamArrayBufferAsBase64String(buffer: ArrayBuffer)
    {
        //Inspired by https://gist.github.com/jonleighton/958841
        //This streams a base64 encoded string from an ArrayBuffer

        const bytes = new Uint8Array(buffer);
        const remainingBytes = bytes.byteLength % 3;
        const chunkedBytesLength = bytes.byteLength - remainingBytes;

        let a, b, c, d;
        let chunk;

        // Main loop deals with bytes in chunks of 3
        for (let i = 0; i < chunkedBytesLength; i = i + 3)
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
        if (remainingBytes == 1)
        {
            chunk = bytes[chunkedBytesLength];

            a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

            // Set the 4 least significant bits to zero
            b = (chunk & 3) << 4; // 3   = 2^2 - 1

            yield this.base64Encodings[a] + this.base64Encodings[b] + '==';
        } else if (remainingBytes == 2)
        {
            chunk = (bytes[chunkedBytesLength] << 8) | bytes[chunkedBytesLength + 1];

            a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
            b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4

            // Set the 2 least significant bits to zero
            c = (chunk & 15) << 2; // 15    = 2^4 - 1

            yield this.base64Encodings[a] + this.base64Encodings[b] + this.base64Encodings[c] + '=';
        }
    }
}