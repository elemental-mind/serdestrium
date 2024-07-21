import { FingerPrintingTools } from "./tools/fingerprintingTools.js";
import { NativeType, TypedElementTypes, SerializationSymbols, InternalConstant, Constants, SerializedType } from "./serium.js";

export abstract class Serializer<T extends string | ArrayBufferView>
{
    constructor(
        public knownClasses: Map<any, string>,
        public knownSymbols: Map<symbol, string> = new Map(),
        public knownObjects: Map<any, number> = new Map()
    )
    {
        this.knownSymbols.set(SerializationSymbols.CustomType, "Type");
        this.knownSymbols.set(SerializationSymbols.InternalType, "InternalType");
    }

    protected abstract emitInstance(instanceData: SerializedType): Generator<T>;
    protected abstract emitObject(object: null | object): Generator<T>;
    protected abstract emitArray(array: Array<any>): Generator<T>;
    protected abstract emitBinary(blob: ArrayBuffer): Generator<T>;
    protected abstract emitReference(identifier: number): T;
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
            this.knownObjects.set(object, this.knownObjects.size);
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

        let classID = this.knownClasses.get(prototype.constructor);

        if (!classID)
        {
            classID = FingerPrintingTools.generateClassIdentifier(prototype.constructor);
            this.knownClasses.set(prototype.constructor, classID);
        }

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
}