const dictionary = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const dictionaryArray = dictionary.split("");

const atowMap = new Uint8Array(256);
const atoxMap = new Uint8Array(256);
const btoxMap = new Uint8Array(256);
const btoyMap = new Uint8Array(256);
const ctoyMap = new Uint8Array(256);
const ctozMap = new Uint8Array(256);

const wxyztocharMap = new Uint8Array(2 ** 6);

const wtoaMap = new Uint8Array(256);
const xtoaMap = new Uint8Array(256);
const xtobMap = new Uint8Array(256);
const ytobMap = new Uint8Array(256);
const ytocMap = new Uint8Array(256);

const chartowxyzMap = new Uint8Array(123);

function generateForwardMappings()
{
    // a a a a a a a a|b b b b b b b b|c c c c c c c c       
    // w w w w w w|x x x x x x|y y y y y y|z z z z z z                
    //      1     |      2    |     3     |     4

    for (let value = 0; value < 256; value++) 
    {
        atowMap[value] = value >> 2;
        atoxMap[value] = value & 0b11;
        btoxMap[value] = value >> 4;
        btoyMap[value] = value & 0b1111;
        ctoyMap[value] = value >> 6;
        ctozMap[value] = value & 0b111111;
    }

    for (let value = 0; value < 2 ** 6; value++)
        wxyztocharMap[value] = dictionary.charCodeAt(value);
}

function generateBackwardMappings()
{
    //      1     |      2    |     3     |     4
    // w w w w w w|x x x x x x|y y y y y y|z z z z z z        
    // a a a a a a a a|b b b b b b b b|c c c c c c c c    

    for (let value = 0; value < dictionary.length; value++)
        chartowxyzMap[dictionary.charCodeAt(value)] = value;

    for (let value = 0; value < 256; value++) 
    {
        wtoaMap[value] = value << 2;
        xtoaMap[value] = value >> 4;
        xtobMap[value] = (value & 0b1111) << 4;
        ytobMap[value] = value >> 2;
        ytocMap[value] = value & 0b11;
    }
}

const testArray = new Uint8Array(300000);
const testString = new TextDecoder("utf-8").decode(testArray);
const stringBuffer = new Array<string>(400000);

function generateTestArray()
{
    for (let i = 0; i < 300000; i++)
        testArray[i] = Math.floor(Math.random() * 256);
}

function encodeMapped(bytes: Uint8Array)
{
    const byteLength = bytes.byteLength;
    const byteRemainder = byteLength % 3;
    const mainLength = byteLength - byteRemainder;

    const outputArray = new Uint8Array(Math.ceil(byteLength / 3) * 4);

    let a, b, c;
    let index = 0;
    let outputIndex = 0;

    // Main loop deals with bytes in chunks of 3
    while (index < mainLength)
    {
        a = bytes[index++];
        b = bytes[index++];
        c = bytes[index++];

        // Use bitmasks to extract 6-bit segments from the triplet
        outputArray[outputIndex++] = wxyztocharMap[atowMap[a]];                 // w
        outputArray[outputIndex++] = wxyztocharMap[atoxMap[a] + btoxMap[b]];    // x
        outputArray[outputIndex++] = wxyztocharMap[btoyMap[b] + ctoyMap[c]];    // y
        outputArray[outputIndex++] = wxyztocharMap[ctozMap[c]];                 // z
    }

    return outputArray;
}

function encodeComputed(bytes: Uint8Array)
{
    const byteLength = bytes.byteLength;
    const byteRemainder = byteLength % 3;
    const mainLength = byteLength - byteRemainder;

    const outputArray = new Uint8Array(Math.ceil(byteLength / 3) * 4);
    let currentOutput = 0;

    let chunk;
    let index = 0;

    // Main loop deals with bytes in chunks of 3
    while (index < mainLength)
    {
        // Combine the three bytes into a single integer
        chunk = (bytes[index++] << 16) | (bytes[index++] << 8) | bytes[index++];

        // Use bitmasks to extract 6-bit segments from the triplet
        outputArray[currentOutput++] = wxyztocharMap[(chunk & 16515072) >> 18];   // 16515072 = (2^6 - 1) << 18
        outputArray[currentOutput++] = wxyztocharMap[(chunk & 258048) >> 12];     // 258048   = (2^6 - 1) << 12
        outputArray[currentOutput++] = wxyztocharMap[(chunk & 4032) >> 6];        // 4032     = (2^6 - 1) << 6
        outputArray[currentOutput++] = wxyztocharMap[chunk & 63];                 // 63       = 2^6 - 1
    }

    // // Deal with the remaining bytes and padding
    // if (byteRemainder == 1)
    // {
    //     chunk = bytes[mainLength];

    //     outputArray[currentOutput++] = wxyztocharMap[(chunk & 252) >> 2]; // 252 = (2^6 - 1) << 2

    //     // Set the 4 least significant bits to zero
    //     outputArray[currentOutput++] = wxyztocharMap[(chunk & 3) << 4]; // 3   = 2^2 - 1

    //     // Pad with "=="
    //     outputArray[currentOutput++] = 61;
    //     outputArray[currentOutput++] = 61;
    // }
    // else if (byteRemainder == 2)
    // {
    //     chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

    //     outputArray[currentOutput++] = wxyztocharMap[(chunk & 64512) >> 10]; // 64512 = (2^6 - 1) << 10
    //     outputArray[currentOutput++] = wxyztocharMap[(chunk & 1008) >> 4]; // 1008  = (2^6 - 1) << 4

    //     // Set the 2 least significant bits to zero
    //     outputArray[currentOutput++] = wxyztocharMap[(chunk & 15) << 2]; // 15    = 2^4 - 1

    //     //Pad with "="
    //     outputArray[currentOutput++] = 61;
    // }

    return outputArray;
}

function encodeToStringConcat(bytes: Uint8Array)
{
    const byteLength = bytes.byteLength;
    const byteRemainder = byteLength % 3;
    const mainLength = byteLength - byteRemainder;

    let chunk;
    let index = 0;
    let returnString = "";

    // Main loop deals with bytes in chunks of 3
    while (index < mainLength)
    {
        // Combine the three bytes into a single integer
        chunk = (bytes[index++] << 16) | (bytes[index++] << 8) | bytes[index++];

        // Use bitmasks to extract 6-bit segments from the triplet
        returnString.concat(
            dictionaryArray[(chunk & 16515072) >> 18],
            dictionaryArray[(chunk & 258048) >> 12],
            dictionaryArray[(chunk & 4032) >> 6],
            dictionaryArray[chunk & 63]
        );
    }

    return returnString;
}

function encodeToStringEnd(bytes: Uint8Array)
{
    const byteLength = bytes.byteLength;
    const byteRemainder = byteLength % 3;
    const mainLength = byteLength - byteRemainder;

    let chunk;
    let index = 0;
    let returnString = "";

    // Main loop deals with bytes in chunks of 3
    while (index < mainLength)
    {
        // Combine the three bytes into a single integer
        chunk = (bytes[index++] << 16) | (bytes[index++] << 8) | bytes[index++];

        // Use bitmasks to extract 6-bit segments from the triplet
        returnString += dictionaryArray[(chunk & 16515072) >> 18] + dictionaryArray[(chunk & 258048) >> 12] + dictionaryArray[(chunk & 4032) >> 6] + dictionaryArray[chunk & 63];
    }

    return returnString;
}

const decoder = new TextDecoder();

function encodeToStringEncoder(bytes: Uint8Array)
{
    const byteLength = bytes.byteLength;
    const byteRemainder = byteLength % 3;
    const mainLength = byteLength - byteRemainder;

    const outputArray = new Uint8Array(Math.ceil(byteLength / 3) * 4);
    let currentOutput = 0;

    let chunk;
    let index = 0;

    // Main loop deals with bytes in chunks of 3
    while (index < mainLength)
    {
        // Combine the three bytes into a single integer
        chunk = (bytes[index++] << 16) | (bytes[index++] << 8) | bytes[index++];

        // Use bitmasks to extract 6-bit segments from the triplet
        outputArray[currentOutput++] = wxyztocharMap[(chunk & 16515072) >> 18];   // 16515072 = (2^6 - 1) << 18
        outputArray[currentOutput++] = wxyztocharMap[(chunk & 258048) >> 12];     // 258048   = (2^6 - 1) << 12
        outputArray[currentOutput++] = wxyztocharMap[(chunk & 4032) >> 6];        // 4032     = (2^6 - 1) << 6
        outputArray[currentOutput++] = wxyztocharMap[chunk & 63];                 // 63       = 2^6 - 1
    }

    let text = decoder.decode(outputArray);
    text += ";";

    return text;
}

//Prepare benchmarks
const iterations = 1000;

generateForwardMappings();
generateTestArray();

//Run benchmarks
const mappedEncodingStart = performance.now();
for (let i = 0; i < iterations; i++)
{
    encodeMapped(testArray);
}
const mappedEncodingEnd = performance.now();
const mappedEncodingTime = mappedEncodingEnd - mappedEncodingStart;
console.log(`Mapped encoding time: ${mappedEncodingTime} ms`);

const computedEncodingStart = performance.now();
for (let i = 0; i < iterations; i++)
{
    encodeComputed(testArray);
}
const computedEncodingEnd = performance.now();
const computedEncodingTime = computedEncodingEnd - computedEncodingStart;
console.log(`Computed encoding time: ${computedEncodingTime} ms`);


const toStringEncodingStart = performance.now();
for (let i = 0; i < iterations; i++)
{
    encodeToStringConcat(testArray);
}
const toStringEncodingEnd = performance.now();
const toStringEncodingTime = toStringEncodingEnd - toStringEncodingStart;
console.log(`ToString encoding time: ${toStringEncodingTime} ms`);

const toStringEndEncodingStart = performance.now();
for (let i = 0; i < iterations; i++)
{
    encodeToStringEnd(testArray);
}
const toStringEndEncodingEnd = performance.now();
const toStringEndEncodingTime = toStringEndEncodingEnd - toStringEndEncodingStart;
console.log(`ToStringEnd encoding time: ${toStringEndEncodingTime} ms`);
