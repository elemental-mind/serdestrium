export interface ICustomSerialization
{
    serializationID?: string;
    onSerialization?(dataObject: any): void;
    onPostSerialization?(dataObject: any): void;
    onDeserialization?(dataObject: any): void | any;
    onPostDeserialization?(dataObject: any): void | any;
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

const InternalTypeSym = Symbol("Internal Type");
const CustomTypeSym = Symbol("Custom Type");

export const SerializationSymbols =
    {
        InternalType: InternalTypeSym,
        CustomType: CustomTypeSym,
    } as const;

export class InternalConstant
{
    constructor(
        public value: InternalConstants
    ) { };
}

export const Constants =
    {
        Undefined: new InternalConstant(InternalConstants.Undefined),
        NaN: new InternalConstant(InternalConstants.NaN),
        Infinity: new InternalConstant(InternalConstants.Infinity)
    } as const;

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