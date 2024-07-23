export { JSONSerializer } from "./serializers/JSONSerializer.js"
export { JSONInterpreter } from "./interpreters/JSONInterpreter.js"

export interface ICustomSerialization
{
    onSerialization?(dataObject: any): void;
    onPostSerialization?(dataObject: any): void;
    onDeserialization?(dataObject: any): void | any;
    onPostDeserialization?(): void | any;
}

export interface IEnvironment
{
    knownClasses?: Map<any, string>,
    knownSymbols?: Map<symbol, string>,
    knownObjects?: Map<any, string>,
    idGenerator?: Generator<string>
}