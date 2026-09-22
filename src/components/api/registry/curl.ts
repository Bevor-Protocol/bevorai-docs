import type { CodeGenerator } from "./generators";
import { doubleQuote, indent, inputToString, singleQuote } from "./utils";

export const curlGenerator: CodeGenerator = {
  label: "cURL",
  lang: "bash",
  generate: (data) => {
    const s: string[] = [];
    s.push(`curl -X ${data.method.toUpperCase()} "${data.url}"`);
    for (const header in data.header) {
      s.push(`-H "${header}: ${data.header[header].value}"`);
    }
    for (const k in data.cookie) {
      s.push(`--cookie ${doubleQuote(`${k}=${data.cookie[k].value}`)}`);
    }
    if (data.body && data.bodyMediaType === "multipart/form-data") {
      if (typeof data.body !== "object") throw new Error("[CURL] request body must be an object.");
      for (const [key, value] of Object.entries(data.body as Record<string, unknown>)) {
        s.push(`-F ${key}=${doubleQuote(inputToString(value))}`);
      }
    } else if (data.body && data.bodyMediaType) {
      const escaped = singleQuote(inputToString(data.body, data.bodyMediaType));
      s.push(`-H "Content-Type: ${data.bodyMediaType}"`);
      s.push(`-d ${escaped}`);
    }
    return s.flatMap((v, i) => indent(v, i > 0 ? 1 : 0)).join(" \\\n");
  },
};
