export const doubleQuote = (value: string): string =>
  `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

export const singleQuote = (value: string): string => `'${value.replace(/'/g, `'\\''`)}'`;

export const indent = (line: string, level: number, size = 2): string =>
  `${" ".repeat(level * size)}${line}`;

export const inputToString = (value: unknown, mediaType?: string): string => {
  if (typeof value === "string") return value;
  if (mediaType === undefined || mediaType.includes("json")) return JSON.stringify(value);
  return String(value);
};
