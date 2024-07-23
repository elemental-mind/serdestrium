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

export const Constants = {
    Undefined: new InternalConstant(InternalConstants.Undefined),
    NaN: new InternalConstant(InternalConstants.NaN),
    Infinity: new InternalConstant(InternalConstants.Infinity)
} as const;

export type TokenSymbol = (typeof Token)[keyof typeof Token];
