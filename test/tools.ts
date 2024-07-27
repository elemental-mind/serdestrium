export function dedentBlock(strings: TemplateStringsArray, ...values: any[]): string
{
    let output = '';
    for (let i = 0; i < values.length; i++)
    {
        output += strings[i] + values[i];
    }
    output += strings[strings.length - 1];

    // Split lines and determine minimum indentation
    const lines = output.split('\n');
    
    if(/^\s*$/.test(lines[0]))
        lines.shift();
    if(/^\s*$/.test(lines[lines.length-1]))
        lines.pop();

    const minIndent = lines.reduce((min, line) =>
    {
        const indent = line.match(/^\s*/)?.[0].length ?? 0;
        return Math.min(min, indent);
    }, Infinity);

    // Remove minimum indentation from each line
    const dedentedLines = lines.map(line => line.slice(minIndent));

    // Join lines back together
    return dedentedLines.join('\n');
}