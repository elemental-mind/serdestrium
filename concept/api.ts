export interface ICustomSerialization
{
    serializationID?: string;
    onSerialization?(dataObject: any): void;
    onPostSerialization?(dataObject: any): void;
    onDeserialization?(dataObject: any): void | any;
    onPostDeserialization?(dataObject: any): void | any;
}

export interface ISerializationBoundary
{
    
}