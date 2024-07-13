import { ICustomSerialization } from "./api.ts";

class NaturallySerializable
{
    id: string = "Hello World";

    number: Number = 123;

    bigInt: BigInt = BigInt("1e200");

    date = new Date();

    nested = {
        a: 1,
        b: 2,
        d: 3,
        cycle: {
            self: this
        }
    };

    array = [1, 2, 3, "something", this.nested];

    map = new Map<any, any>([[1, "one"], [2, "two"], [this, this.nested]]);

    set = new Set<number>([1,2,3,4,5]);
}

class PrivateProperties implements ICustomSerialization
{
    nothing: string;
    #privateProp: string;

    onPostSerialization(data: any)
    {
        data.prop = this.#privateProp;
    }

    onPostDeserialization(data: any): void | any
    {
        this.#privateProp = data.prop;
    }
}

class NonserializedProperties implements ICustomSerialization
{
    otherProp: number;
    topSecret: string;

    loadSecret()
    {
        return "";
    }

    onPostSerialization(dataObject: any): void
    {
        delete dataObject.topSecret;
    }

    onPostDeserialization(dataObject: any)
    {
        this.topSecret = this.loadSecret();
    }
}

class SerializationTransformation implements ICustomSerialization
{
    username: string;
    secret: string;

    onPostSerialization(dataObject: any)
    {
        dataObject.secret = crypto.subtle.encrypt(this.secret, ...);
    }

    onPostDeserialization(dataObject: any)
    {
        this.secret = crypto.decrypt(dataObject.secret, ...);
    }
}

class CustomizedID
{
    uniqueValue: string;

    get serializationID()
    {
        return this.uniqueValue;
    }
}