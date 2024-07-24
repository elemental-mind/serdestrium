# Serdestrium

*Ser*ialization, *De*serialization through *Str*eams with native support for ES6/TypeScript classes everywhere (browser, node etc.). Serdestrium lets you quickly and efficiently serialize and deserialize even larger-than memory files to and from JSON, YAML and XML.

## Main features at a glance

Serdestrium natively supports:
- Synchronous and asynchronous streaming for serialization and deserialization
- TypeScript/ES6 classes
- Circular references
- Built-in-types:
    - Map
    - Set
    - Date
    - TypedArray, ArrayBuffer
    - Symbol
    - Constants: undefined, null, NaN, Infinity
- Class-level hooks (instead of decorators) for customizing Serialization and Deserialization of class instances, if needed
- Multiple file-formats:
    - JSON
    - YAML (soon)
    - XML (soon)

- Wide JS environments support (browser, node, deno, bun, cf-workers etc.)
- Tree-shakeable
- Dependency-free

## Installation

To install Serdestrium, run the following command:

```
npm install serdestrium
```

This will install the latest version of Serdestrium and add it to your project's dependencies.

## API

### Serializing

For synchronous serialization you can use the `serialize` member present on the Serializer classes:

```Typescript
import { JSONSerializer } from 'serdestrium';

// Create a new JSONSerializer instance
const serializer = new JSONSerializer();

// Serialize a simple object
const simpleObject = { name: "John", age: 30 };
// Output: {"name":"John","age":30}
const serializedSimple = serializer.serialize(simpleObject); 
```

If you want to serialize an object asynchronously, you can use the generator returned from the `stream` method of the Serializer classes:

```Typescript
import { JSONSerializer } from 'serdestrium';

// Create a new JSONSerializer instance
const serializer = new JSONSerializer();

// Serialize a simple object
const simpleObject = { name: "John", age: 30 };

for(const chunk of JSONSerializer.stream(simpleObject))
    // Outputs in order: '{', '"', 'name', ':', '"', 'John', '"', ',', '"', 'age', ':', ' 30', '}'
    await saveChunk(chunk);
```
You can see that the chunks are really fine grained. It is recommended to use your own solution to concatenate these mini-chunks together before passing them on to be saved in files or to be sent over the network.

> Note: The serializer is stateful as it assigns objects ids and and uses them in references. You can theoretically use it multiple times, but your references will be mixed up if you do not deserialize in the same order in which you serialized.

### Deserializing

For synchronous deserialization when you have the full string already in memory you can use the `parse` member present on the Interpreter classes:

```Typescript
import { JSONInterpreter } from 'serdestrium';

// Create a new JSONSerializer instance
const interpreter = new JSONInterpreter();

// Serialize a simple object
const parsed = interpreter.parse('{"name":"John","age":30}'); 
```

If you want to parse an object asynchronously straight from a file stream for example, you can use the generator returned from the `stream` method of the Serializer classes:

```Typescript
import { JSONInterpreter } from 'serdestrium';

// Create a new JSONSerializer instance
const interpreter = new JSONInterpreter();

//The stream should be an async generator that you would normally use like this:
// for await (const chunk of readFileTextAsync("fileName", utf8)) ...
const parsed = await interpreter.parseStream(fileOrNetworkStreamAsyncIterable); 
```
There are no limits on chunk size. 

The parser itself can be halted and resumed any time as it's fully generator based. To feed data differently to the parser, you need to call the `advance(chunk)` method repeatedly. Best take a look at the `parseStream` method in the source to see what needs to be done.

> Note: Just as the serializer, the deserializer is also stateful. Multiple calls to it may lead to unintended outcomes.

## Serialization customization

By default all enumerable properties of an object or class instance are going to be serialized.

### Serialization hooks

Serdestrium provides serialization hooks that allow you to customize the serialization and deserialization process for your classes. These hooks are defined in the `ICustomSerialization` interface and can be implemented by your classes to control how they are serialized and deserialized.

The available serialization hooks are:

- `onSerialization(dataObject: any): void`
   - This hook is called before a class instance is serialized.
   - Populate the given `dataObject` with the properties you want serialized.
   - The then modified `dataObject` will be serialized. Return values will be ignored.
   - The `onPostSerialization` hook will be ignored.

- `onPostSerialization(dataObject: any): void`
   - This hook is called after a class is prepared for serialization (it went thorugh the normal framework conversion process of instance => POJO), but before the POJO is serialized.
   - You can use this hook to modify the pre-populated `dataObject` before its finally serialized.

- `onDeserialization(dataObject: any): void | any`
   - This hook is called after the instance is created, but before its properties are automatically assigned.
   - You need to do assignments to the properties of the instance yourself.
   - The `onPostDeserialization` hook will be ignored.

- `onPostDeserialization(): void | any`
   - This hook is called after an object has been deserialized and its properties were assigned.
   - You can use it to perform any post-deserialization tasks or modifications.

### Hooks usage

To use these hooks, implement the necessary `ICustomSerialization` interface members in your class:

```typescript
import { ICustomSerialization } from 'serdestrium';

class MyCustomClass implements ICustomSerialization 
{
    #privateData: string;
    public notToBeSerialized?: number;

    constructor(public name: string, privateData: string) 
    {
        this.#privateData = privateData;
    }

    onPostSerialization(dataObject: any): void {
        // dataObject only contains "name" as it's the only enumerable property.
        // Make sure private property is also serialized
        dataObject.private = this.#privateData;
        delete dataObject.notToBeSerialized;
    }

    onDeserialization(dataObject: any): void 
    {
        this.name = dataObject.name;
        this.#privateData = dataOobject.private;
    }
}
```

## Environment configuration

Each Serializer and Deserializer takes in an optional `IEnvironment` specifiying known classes, symbols and objects.

> Note: If you want to deserialize classes, you **must** to provide an environment configuration with a `knownClasses` map as there is no way to auto-discover classes.

### Classes
On Serialization, by default instances get assigned a type-string that equals their prototype's `constructor.name` property:
```
class CustomClass {};

serializer.serialize(new CustomClass()) // returns '{"[Type]": "CustomClass"}'
```
This may lead to naming conflicts if you have multiple classes of the same name in different modules or in different scopes. To avoid this you can assign classes custom type-strings:

```Typescript
//moduleA.ts
export class CustomClass {};

//moduleB.ts
export class CustomClass {};

//moduleSerialization.ts
import { JSONSerializer } from 'serdestrium';
import { CustomClass as ModuleACustomClass } from './moduleA.js';
import { CustomClass as ModuleBCustomClass } from './moduleB.js';

const serializer = new JSONSerializer({
    knownClasses: new Map([
        [ModuleACustomClass, 'ModuleACustomClass'],
        [ModuleBCustomClass, 'ModuleBCustomClass']
    ])
});

serializer.serialize([new ModuleACustomClass(), new ModuleBCustomClass()]) 
// returns '[{"[Type]": "ModuleACustomClass"}, {"[Type]": "ModuleBCustomClass"}]'
```

For deserialization you need to provide a map of known classes, that maps type-strings to classes in your deserialization environment:

```Typescript
import { JSONInterpreter } from 'serdestrium';

class CustomClass {};
class AmbiguousClass {};

const knownClasses = [CustomClass];
//Standard mapping from classes to their names.
const knownClassesMap = new Map(knownClasses.map(clss => [clss, clss.name]));
//Custom names for ambiguous classes if needed.
knownClassesMap.set(AmbiguousClass, "UnAmbiguousTypeString");

const parser = new JSONInterpreter({knownClasses: knownClassesMap});

parser.parse('[{"[Type]": "CustomClass"}, {"[Type]": "UnAmbiguousTypeString"}]') 
```

### References & Objects

During serialization, objects are assigned reference names automatically. By default, these references are named using the pattern `[ref: ~n]`, with a literal `~` and `n` being an incrementing alphanumeric string. This id is incremented for every encountered object to be serialized, regardless of whether it's referenced later or not.

You can also provide known objects to the serializer using the `knownObjects` property of the environment configuration.
Use the `knownObjects` property if you:

1. do not want to serialize an object or
2. deserialize an object to a certain object that is present in the deserialization environment
3. are working with a system where object identity needs to be preserved across serialization boundaries.

>Note: Objects in the `knownObjects` map will not be serialized! You can **not** use this property to give certain object's references descriptive names, but still expect these objets to be serialized.

```typescript
const ambientObject = { name: "Ambient" };
const serializer = new JSONSerializer({
    knownObjects: new Map([[ambientObject, "ambientObj"]])
});

const result = serializer.serialize(
    //This object is the first the serializer will encounter and gets automatic id of ~1
    {
        local:
            //This is the 2nd object that the serializer will encounter and get automatic id of ~2 
            { name: "Local" },
        ambient: ambientObject,
        localRef: this.local,
    }
);

console.log(result);
// Output: {"local":{"name":"Local"},"ambient":"[ref: ambientObj]","localRef":"[ref: ~2]"}
```
In this example, the `ambientObject` is given the reference name "ambientObj", while the local object is automatically assigned a reference name like `~2`.

### Symbols
Symbols are serialized using the `[sym: symbolName]` format. By default, symbols are not serialized and will throw an error if encountered. To enable symbol serialization, you need to provide a map of known symbols to the serializer and interpreter.

For serialization:
```typescript 
const symbol = Symbol("test");
const serializer = new JSONSerializer({ knownSymbols: new Map([[symbol, "test"]]) });
const result = serializer.serialize(symbol);
// result will be '"[sym: test]"'
```

For deserialization:

```typescript
const testSymbol = Symbol("test");
const interpreter = new JSONInterpreter({ knownSymbols: new Map([[testSymbol, "test"]]) });
const result = interpreter.parse('"[sym: test]"');
// result will be the testSymbol
```
You can of course also use symbols as object keys:
```typescript
const symbol = Symbol("SymProp");
const serializer = new JSONSerializer({ knownSymbols: new Map([[symbol, "SymProp"]]) });
const obj = {
    [symbol]: "value"
};
const result = serializer.serialize(obj);
// result will be '{"[sym: SymProp]":"value"}'
```
When deserializing, the interpreter will reconstruct the object with the symbol as a key:
```typescript
const testSymbol = Symbol("SymProp");
const interpreter = new JSONInterpreter({ knownSymbols: new Map([[testSymbol, "SymProp"]]) });
const result = interpreter.parse('{"[sym: SymProp]":"value"}');
// result will be an object with testSymbol as a key
```
