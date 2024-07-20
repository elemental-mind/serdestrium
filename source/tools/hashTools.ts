export class HashTools
{
    //Taken and adapted from https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js
    static quickHash(text: string, bits: number = 53)
    {
        if (bits > 53)
            throw new Error("Maximum number of bits limited to 53 as values beyond exceed Math.MAX_SAFE_INTEGER.");

        let h1 = 0xdeadbeef ^ 0;
        let h2 = 0x41c6ce57 ^ 0;

        for (let i = 0, charCode; i < text.length; i++)
        {
            charCode = text.charCodeAt(i);
            h1 = Math.imul(h1 ^ charCode, 0x85ebca77);
            h2 = Math.imul(h2 ^ charCode, 0xc2b2ae3d);
        }

        h1 ^= Math.imul(h1 ^ (h2 >>> 15), 0x735a2d97);
        h2 ^= Math.imul(h2 ^ (h1 >>> 15), 0xcaf649a9);
        h1 ^= h2 >>> 16;
        h2 ^= h1 >>> 16;

        //This returns a 53 bit hash (h2 shifted left by 21 (2**21 = ), contributing 32 bits, h1 shifted right by 11, contributing 21 bits)
        const hashResult = 2097152 * (h2 >>> 0) + (h1 >>> 11);

        //We ditch bits to the right until we reach the desired number of bits.
        return Math.trunc(hashResult / 2 ** (53 - bits));
    };
}