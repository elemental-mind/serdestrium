export class EncodingTools
{
    static Encodings = {
        Binary: "01".split(""),
        Hex: "0123456789ABCDEF".split(""),
        //This is a character set that avoids ambiguous chars like 0 an O, or l, I, 1 that can be misread for each other.
        AlphaNumNonAmbiguous: "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghkmnpqrstuvwxyz23456789".split(""),
        //Normal Base64 character set
        Base64: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("")
    } as const;

    static encode<T>(decimalNumber: number, symbols: T[], fixedLength?: number): T[]
    {
        let { digits } = this.decimalToBase(decimalNumber, symbols.length);

        if (fixedLength)
        {
            if (digits.length > fixedLength)
                digits = digits.slice(0, fixedLength);
            else if (digits.length < fixedLength)
                for (let i = digits.length; i < fixedLength; i++)
                    digits.push(0);
        }

        const symbolString = digits.map(digit => symbols[digit]);

        return symbolString;
    }

    static decimalToBase(decimalNumber: number, newBase: number): NumberRepresentation
    {
        const newRepresentation = new NumberRepresentation();
        newRepresentation.base = newBase;

        let currentValue = decimalNumber;

        while (currentValue > 0)
        {
            const remainder = currentValue % newBase;
            newRepresentation.digits.push(remainder);

            currentValue -= remainder;
            currentValue /= newBase;
        }

        return newRepresentation;
    }

    static baseToDecimal(representation: NumberRepresentation): number
    {
        throw new Error("Not implemented!");
    }
}

class NumberRepresentation
{
    base: number = 10;
    digits: number[] = [];
}