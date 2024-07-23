const objectIDChars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const objectIDCharCount = objectIDChars.length;

export function* idGenerator(prefix = ""): Generator<string>
{
    let digit;
    //If our "base" was base 10 with the digits from 0 to 9
    //we first yield all the base digits starting from 1 to 9
    for (digit = 1; digit < objectIDCharCount; digit++)
        yield prefix + objectIDChars[digit];
    //and after our first run is completed we need more digits to express the next 
    //value. We pull the next preceding digit from a recursive call to this generator
    //(that starts yielding 1-9 before also then introducing a preceding digit)...
    for (const superDigits of idGenerator(prefix))
        for (digit = 0; digit < objectIDCharCount; digit++)
            yield superDigits + objectIDChars[digit];
}