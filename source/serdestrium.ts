export interface ICustomSerialization
{
    serializationID?: string;
    onSerialization?(dataObject: any): void;
    onPostSerialization?(dataObject: any): void;
    onDeserialization?(dataObject: any): void | any;
    onPostDeserialization?(): void | any;
}

export enum NativeType
{
    Array,
    ArrayBuffer,
    BigInt,
    DataView,
    Date,
    Error,
    Map,
    RegEx,
    Set,
    Symbol,
    TypedArray
}

export enum TypedElementTypes
{
    Int8,
    Uint8,
    Uint8Clamped,
    Int16,
    Uint16,
    Int32,
    Uint32,
    Float32,
    Float64
}

export enum InternalConstants
{
    NaN,
    Infinity,
    Undefined
}

export class InternalConstant
{
    constructor(
        public value: InternalConstants
    ) { };
}

export class SerializedType implements Record<string | symbol, any>
{
    public data!: any;
    constructor(
        public type: string,
        data?: any
    )
    {
        this.data = data;
    };
}

export const Token = {
    InstanceStart: Symbol("InstanceStart"),
    InstanceEnd: Symbol("InstanceEnd"),
    ObjectStart: Symbol("ObjectStart"),
    ObjectEnd: Symbol("ObjectEnd"),
    ArrayStart: Symbol("ArrayStart"),
    ArrayEnd: Symbol("ArrayEnd"),
    BinaryStart: Symbol("BinaryStart"),
    BinaryEnd: Symbol("BinaryEnd"),
    Reference: Symbol("Reference"),
    Delimiter: Symbol("Delimiter"),
    String: Symbol("String"),
    Number: Symbol("Number"),
    Boolean: Symbol("Boolean"),
    Constant: Symbol("Constant"),
    Symbol: Symbol("Symbol"),
    StreamStart: Symbol("StreamStart"),
    StreamEnd: Symbol("StreamEnd"),
} as const;

export const SerializationSymbols = {
    InternalType: Symbol("Internal Type"),
    CustomType: Symbol("Custom Type")
} as const;

export const Constants = {
    Undefined: new InternalConstant(InternalConstants.Undefined),
    NaN: new InternalConstant(InternalConstants.NaN),
    Infinity: new InternalConstant(InternalConstants.Infinity)
} as const;

export type TokenSymbol = typeof Token[keyof typeof Token];