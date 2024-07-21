import { performance } from 'perf_hooks';

const base64Encodings = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

// Create a Uint8Array lookup
const uint8Lookup = new Uint8Array(123);
for (let i = 0; i < base64Encodings.length; i++)
{
    uint8Lookup[base64Encodings.charCodeAt(i)] = i;
}

// Create a String Map lookup
const stringMapLookup = new Map<string, number>();
for (let i = 0; i < base64Encodings.length; i++)
{
    stringMapLookup.set(base64Encodings[i], i);
}

// Create a CharCode Map lookup
const charCodeMapLookup = new Map<number, number>();
for (let i = 0; i < base64Encodings.length; i++)
{
    charCodeMapLookup.set(base64Encodings.charCodeAt(i), i);
}

// Generate a random base64 string for benchmarking
const base64String = generateRandomBase64String(1000000);

// Helper function to generate a random base64 string
function generateRandomBase64String(length: number): string
{
    let result = '';
    for (let i = 0; i < length; i++)
    {
        const randomIndex = Math.floor(Math.random() * base64Encodings.length);
        result += base64Encodings[randomIndex];
    }
    return result;
}

// Benchmark Uint8Array lookup
function benchmarkUint8ArrayLookup()
{
    let sum = 0;
    for (let i = 0; i < base64String.length; i++)
    {
        sum += uint8Lookup[base64String.charCodeAt(i)];
    }
    return sum;
}

// Benchmark Map lookup
function benchmarkStringMapLookup()
{
    let sum = 0;
    for (let i = 0; i < base64String.length; i++)
    {
        sum += stringMapLookup.get(base64String[i])!;
    }
    return sum;
}

// Benchmark Map lookup
function benchmarkCharCodeMapLookup()
{
    let sum = 0;
    for (let i = 0; i < base64String.length; i++)
    {
        sum += charCodeMapLookup.get(base64String.charCodeAt(i))!;
    }
    return sum;
}

// Benchmark switch case lookup
function benchmarkSwitchCaseLookup()
{
    let sum = 0;
    for (let i = 0; i < base64String.length; i++)
    {
        switch (base64String[i])
        {
            case 'A': sum += 0; break;
            case 'B': sum += 1; break;
            case 'C': sum += 2; break;
            case 'D': sum += 3; break;
            case 'E': sum += 4; break;
            case 'F': sum += 5; break;
            case 'G': sum += 6; break;
            case 'H': sum += 7; break;
            case 'I': sum += 8; break;
            case 'J': sum += 9; break;
            case 'K': sum += 10; break;
            case 'L': sum += 11; break;
            case 'M': sum += 12; break;
            case 'N': sum += 13; break;
            case 'O': sum += 14; break;
            case 'P': sum += 15; break;
            case 'Q': sum += 16; break;
            case 'R': sum += 17; break;
            case 'S': sum += 18; break;
            case 'T': sum += 19; break;
            case 'U': sum += 20; break;
            case 'V': sum += 21; break;
            case 'W': sum += 22; break;
            case 'X': sum += 23; break;
            case 'Y': sum += 24; break;
            case 'Z': sum += 25; break;
            case 'a': sum += 26; break;
            case 'b': sum += 27; break;
            case 'c': sum += 28; break;
            case 'd': sum += 29; break;
            case 'e': sum += 30; break;
            case 'f': sum += 31; break;
            case 'g': sum += 32; break;
            case 'h': sum += 33; break;
            case 'i': sum += 34; break;
            case 'j': sum += 35; break;
            case 'k': sum += 36; break;
            case 'l': sum += 37; break;
            case 'm': sum += 38; break;
            case 'n': sum += 39; break;
            case 'o': sum += 40; break;
            case 'p': sum += 41; break;
            case 'q': sum += 42; break;
            case 'r': sum += 43; break;
            case 's': sum += 44; break;
            case 't': sum += 45; break;
            case 'u': sum += 46; break;
            case 'v': sum += 47; break;
            case 'w': sum += 48; break;
            case 'x': sum += 49; break;
            case 'y': sum += 50; break;
            case 'z': sum += 51; break;
            case '0': sum += 52; break;
            case '1': sum += 53; break;
            case '2': sum += 54; break;
            case '3': sum += 55; break;
            case '4': sum += 56; break;
            case '5': sum += 57; break;
            case '6': sum += 58; break;
            case '7': sum += 59; break;
            case '8': sum += 60; break;
            case '9': sum += 61; break;
            case '+': sum += 62; break;
            case '/': sum += 63; break;
        }
    }
    return sum;
}

// Benchmark switch case lookup
function benchmarkCharCodeSwitchCase()
{
    let sum = 0;
    for (let i = 0; i < base64String.length; i++)
    {
        switch (base64String.charCodeAt(i))
        {
            case 65: sum += 0; break;  // A
            case 66: sum += 1; break;  // B
            case 67: sum += 2; break;  // C
            case 68: sum += 3; break;  // D
            case 69: sum += 4; break;  // E
            case 70: sum += 5; break;  // F
            case 71: sum += 6; break;  // G
            case 72: sum += 7; break;  // H
            case 73: sum += 8; break;  // I
            case 74: sum += 9; break;  // J
            case 75: sum += 10; break; // K
            case 76: sum += 11; break; // L
            case 77: sum += 12; break; // M
            case 78: sum += 13; break; // N
            case 79: sum += 14; break; // O
            case 80: sum += 15; break; // P
            case 81: sum += 16; break; // Q
            case 82: sum += 17; break; // R
            case 83: sum += 18; break; // S
            case 84: sum += 19; break; // T
            case 85: sum += 20; break; // U
            case 86: sum += 21; break; // V
            case 87: sum += 22; break; // W
            case 88: sum += 23; break; // X
            case 89: sum += 24; break; // Y
            case 90: sum += 25; break; // Z
            case 97: sum += 26; break;  // a
            case 98: sum += 27; break;  // b
            case 99: sum += 28; break;  // c
            case 100: sum += 29; break; // d
            case 101: sum += 30; break; // e
            case 102: sum += 31; break; // f
            case 103: sum += 32; break; // g
            case 104: sum += 33; break; // h
            case 105: sum += 34; break; // i
            case 106: sum += 35; break; // j
            case 107: sum += 36; break; // k
            case 108: sum += 37; break; // l
            case 109: sum += 38; break; // m
            case 110: sum += 39; break; // n
            case 111: sum += 40; break; // o
            case 112: sum += 41; break; // p
            case 113: sum += 42; break; // q
            case 114: sum += 43; break; // r
            case 115: sum += 44; break; // s
            case 116: sum += 45; break; // t
            case 117: sum += 46; break; // u
            case 118: sum += 47; break; // v
            case 119: sum += 48; break; // w
            case 120: sum += 49; break; // x
            case 121: sum += 50; break; // y
            case 122: sum += 51; break; // z
            case 48: sum += 52; break;  // 0
            case 49: sum += 53; break;  // 1
            case 50: sum += 54; break;  // 2
            case 51: sum += 55; break;  // 3
            case 52: sum += 56; break;  // 4
            case 53: sum += 57; break;  // 5
            case 54: sum += 58; break;  // 6
            case 55: sum += 59; break;  // 7
            case 56: sum += 60; break;  // 8
            case 57: sum += 61; break;  // 9
            case 43: sum += 62; break;  // +
            case 47: sum += 63; break;  // /
        }
    }
    return sum;
}

// Benchmark if lookup
function benchMarkIfLookup()
{
    let sum = 0;
    for (let i = 0; i < base64String.length; i++)
    {
        const charCode = base64String.charCodeAt(i);

        if (charCode >= 97 && charCode <= 122) // Lowercase letters (a-z)
            sum += charCode - 71;
        else if (charCode >= 65 && charCode <= 90) // Uppercase letters (A-Z)
            sum += charCode - 65;
        else if (charCode >= 48 && charCode <= 57) // Numbers (0-9)
            sum += charCode + 4;
        else if (charCode === 47) // Forward slash (/)
            sum += 63;
        else if (charCode === 43) // Plus sign (+)
            sum += 62;
    }
    return sum;
}

//Benchmark unsafe if lookup
function benchMarkUnsafeIfLookup()
{
    let sum = 0;
    for (let i = 0; i < base64String.length; i++)
    {
        const charCode = base64String.charCodeAt(i);

        if (charCode >= 97)
            sum += charCode - 71;
        else if (charCode >= 65)
            sum += charCode - 65;
        else if (charCode >= 48)
            sum += charCode + 4;
        else if (charCode === 47)
            sum += 63;
        else if (charCode === 43)
            sum += 62;
    }
    return sum;
}

//Benchmark if tree lookup
function benchMarkIfTreeLookup()
{
    let sum = 0;
    for (let i = 0; i < base64String.length; i++)
    {
        const charCode = base64String.charCodeAt(i);

        if(charCode > 58)
        {
            if (charCode > 96)
                sum+=charCode-71;
            else
                sum+=charCode-65;
        }
        else
        {
            if(charCode>47)
                sum+=charCode+4;
            else
            {
                if(charCode === 47)
                    sum+=63;
                else
                    sum+=62;
            }
        }
    }
    return sum;
}

// Benchmark math lookup
function benchMarkMathLookup()
{
    let sum = 0;
    for (let i = 0; i < base64String.length; i++)
    {
        let charCode = base64String.charCodeAt(i) - 97;

        if (charCode >= 0)
        {
            sum += charCode;
            continue;
        }
        
        charCode += 32;
        if (charCode >= 0)
        {
            sum += charCode;
            continue;
        }

        charCode += 17
        if (charCode >= 0)
        {
            sum += charCode;
            continue;
        }

        if (charCode === -1)
            sum += 63;
        else
            sum += 62;
    }
    return sum;
}

// Run the benchmarks
const iterations = 100;

const uint8ArrayStart = performance.now();
for (let i = 0; i < iterations; i++)
{
    benchmarkUint8ArrayLookup();
}
const uint8ArrayEnd = performance.now();
const uint8ArrayTime = uint8ArrayEnd - uint8ArrayStart;
console.log(`Uint8Array lookup time: ${uint8ArrayTime} ms`);

const stringMapStart = performance.now();
for (let i = 0; i < iterations; i++)
{
    benchmarkStringMapLookup();
}
const stringMapEnd = performance.now();
const stringMapTime = stringMapEnd - stringMapStart;
console.log(`String Map lookup time: ${stringMapTime} ms`);

const charCodeMapStart = performance.now();
for (let i = 0; i < iterations; i++)
{
    benchmarkCharCodeMapLookup();
}
const charCodeMapEnd = performance.now();
const charCodeMapTime = charCodeMapEnd - charCodeMapStart;
console.log(`CharCode Map lookup time: ${charCodeMapTime} ms`);

const switchCaseStart = performance.now();
for (let i = 0; i < iterations; i++)
{
    benchmarkSwitchCaseLookup();
}
const switchCaseEnd = performance.now();
const switchCaseTime = switchCaseEnd - switchCaseStart;
console.log(`String Switch Case lookup time: ${switchCaseTime} ms`);

const charCodeSwitchCaseStart = performance.now();
for (let i = 0; i < iterations; i++)
{
    benchmarkCharCodeSwitchCase();
}
const charCodeSwitchCaseEnd = performance.now();
const charCodeSwitchCaseTime = charCodeSwitchCaseEnd - charCodeSwitchCaseStart;
console.log(`CharCode Switch Case lookup time: ${charCodeSwitchCaseTime} ms`);

const ifLookupStart = performance.now()
for (let i = 0; i < iterations; i++)
{
    benchMarkIfLookup()
}
const ifLookupEnd = performance.now()
const ifLookupTime = ifLookupEnd - ifLookupStart
console.log(`If lookup time: ${ifLookupTime} ms`)

const unsafeIfLookupStart = performance.now()
for (let i = 0; i < iterations; i++)
{
    benchMarkUnsafeIfLookup()
}
const unsafeIfLookupEnd = performance.now()
const unsafeIfLookupTime = unsafeIfLookupEnd - unsafeIfLookupStart
console.log(`Unsafe If lookup time: ${unsafeIfLookupTime} ms`)

const ifTreeLookupStart = performance.now()
for (let i = 0; i < iterations; i++)
{
    benchMarkIfTreeLookup()
}
const ifTreeLookupEnd = performance.now()
const ifTreeLookupTime = ifTreeLookupEnd - ifTreeLookupStart
console.log(`If Tree lookup time: ${ifTreeLookupTime} ms`)

const mathLookupStart = performance.now()
for (let i = 0; i < iterations; i++)
{
    benchMarkMathLookup()
}
const mathLookupEnd = performance.now()
const mathLookupTime = mathLookupEnd - mathLookupStart
console.log(`Math lookup time: ${mathLookupTime} ms`)
