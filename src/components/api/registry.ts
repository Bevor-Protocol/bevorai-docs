import type { ParsedSchema } from "@fumadocs/api-docs/schema";
import type { HttpMethods, OperationObject, ParameterObject } from "fumadocs-openapi";
import type { InlineCodeUsageGenerator } from "fumadocs-openapi/requests/generators";
import type { Doc } from "@/hooks/use-doc";

// --- vendored from fumadocs-openapi's playground types (not exported) ---
export interface EncodedParameter {
  value: string;
}

export interface EncodedParameterMultiple {
  values: string[];
}

export interface RequestData {
  method: HttpMethods;
  path: Record<string, EncodedParameter>;
  query: Record<string, EncodedParameterMultiple>;
  header: Record<string, EncodedParameter>;
  cookie: Record<string, EncodedParameter>;
  body?: unknown;
  bodyMediaType?: string;
}

type RequestDataWithUrl = RequestData & { url: string };

// --- schema example synthesis (shared with response examples) ---
export const synthesizeExample = (raw: ParsedSchema, doc: Doc): unknown => {
  const schema = doc.resolve(raw);
  if (typeof schema !== "object" || schema === null) return undefined;
  if (schema.example !== undefined) return schema.example;
  if (schema.enum && schema.enum.length > 0) return schema.enum[0];
  if (schema.default !== undefined) return schema.default;

  if (schema.allOf) {
    return schema.allOf.reduce((acc: Record<string, unknown>, sub) => {
      const resolved = synthesizeExample(sub, doc);
      return typeof resolved === "object" && resolved !== null ? { ...acc, ...resolved } : acc;
    }, {});
  }

  const union = schema.oneOf ?? schema.anyOf;
  if (union && union.length > 0) {
    return synthesizeExample(union[0], doc);
  }

  switch (schema.type) {
    case "object": {
      const out: Record<string, unknown> = {};
      for (const [key, prop] of Object.entries(schema.properties ?? {})) {
        out[key] = synthesizeExample(prop, doc);
      }
      return out;
    }
    case "array":
      return schema.items ? [synthesizeExample(schema.items, doc)] : [];
    case "string":
      return schema.format === "date-time" ? "2024-01-01T00:00:00Z" : "string";
    case "integer":
    case "number":
      return 0;
    case "boolean":
      return true;
    default:
      return schema.nullable ? null : "string";
  }
};

// --- build a placeholder RequestData from the resolved operation ---
export const buildRequestData = (
  method: HttpMethods,
  path: string,
  parameters: ParameterObject[],
  requestBody: OperationObject["requestBody"],
  doc: Doc,
  baseUrl: string,
): RequestDataWithUrl => {
  const byLocation = (loc: string): Record<string, EncodedParameter> =>
    Object.fromEntries(
      parameters.filter((p) => p.in === loc).map((p) => [p.name, { value: `<${p.name}>` }]),
    );

  const query: Record<string, EncodedParameterMultiple> = Object.fromEntries(
    parameters.filter((p) => p.in === "query").map((p) => [p.name, { values: [`<${p.name}>`] }]),
  );
  const queryString = Object.entries(query)
    .map(([k, v]) => `${k}=${v.values.join(",")}`)
    .join("&");

  let resolvedPath = path;
  for (const p of parameters.filter((p) => p.in === "path")) {
    resolvedPath = resolvedPath.replace(`{${p.name}}`, `<${p.name}>`);
  }

  let body: unknown;
  let bodyMediaType: string | undefined;
  if (requestBody) {
    const resolved = doc.resolve(requestBody);
    const [mediaType, rawMedia] = Object.entries(resolved.content ?? {})[0] ?? [];
    if (mediaType && rawMedia) {
      const media = doc.resolve(rawMedia);
      bodyMediaType = mediaType;
      body = media.example ?? (media.schema ? synthesizeExample(media.schema, doc) : undefined);
    }
  }

  return {
    method,
    path: byLocation("path"),
    query,
    header: byLocation("header"),
    cookie: byLocation("cookie"),
    body,
    bodyMediaType,
    url: `${baseUrl}${resolvedPath}${queryString ? `?${queryString}` : ""}`,
  };
};

// --- our own string utils (fumadocs' equivalents aren't exported) ---
const doubleQuote = (value: string): string =>
  `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

const singleQuote = (value: string): string => `'${value.replace(/'/g, `'\\''`)}'`;

const indent = (line: string, level: number, size = 2): string =>
  `${" ".repeat(level * size)}${line}`;

const inputToString = (value: unknown, mediaType?: string): string => {
  if (typeof value === "string") return value;
  if (mediaType === undefined || mediaType.includes("json")) return JSON.stringify(value);
  return String(value);
};

// --- media adapters (minimal: JSON only) ---
interface MediaAdapter {
  generateExample: (data: RequestData, context: { lang: string }) => string | undefined;
}

const mediaAdapters: Record<string, MediaAdapter> = {
  "application/json": {
    generateExample: (data) => `body = ${generatePythonObject(data.body, new Set())}\n`,
  },
};

const resolveMediaAdapter = (
  mediaType: string,
  adapters: Record<string, MediaAdapter>,
): MediaAdapter | undefined => adapters[mediaType] ?? adapters[mediaType.split(";")[0]];

// --- generators ---
interface CodeGenerator {
  label?: string;
  lang: string;
  generate: (
    data: RequestDataWithUrl,
    context: { mediaAdapters: Record<string, MediaAdapter>; custom: unknown },
  ) => string;
}
const curlGenerator: CodeGenerator = {
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

const generatePythonObject = (v: unknown, imports: Set<string>): string => {
  if (v === null) return "None";
  if (typeof v === "boolean") return v ? "True" : "False";
  if (typeof v === "string") return doubleQuote(v);
  if (typeof v === "number") return v.toString();
  if (Array.isArray(v))
    return `[${v.map((item) => generatePythonObject(item, imports)).join(", ")}]`;
  if (v instanceof Date) {
    imports.add("datetime");
    return `datetime.datetime(${v.getFullYear()}, ${v.getMonth() + 1}, ${v.getDate()}, ${v.getHours()}, ${v.getMinutes()}, ${v.getSeconds()}, ${v.getMilliseconds()})`;
  }
  if (typeof v === "object") {
    return `{\n${Object.entries(v as Record<string, unknown>)
      .map(([key, value]) => `  ${doubleQuote(key)}: ${generatePythonObject(value, imports)}`)
      .join(", \n")}\n}`;
  }
  throw new Error(`Unsupported type: ${typeof v}`);
};

const pythonGenerator: CodeGenerator = {
  label: "Python",
  lang: "python",
  generate: (data, { mediaAdapters }) => {
    const headers: Record<string, string> = {};
    const imports = new Set<string>();
    const params = [`"${data.method.toUpperCase()}"`, "url"];
    let body: string | undefined;
    imports.add("requests");

    if (data.body && data.bodyMediaType) {
      const adapter = resolveMediaAdapter(data.bodyMediaType, mediaAdapters);
      headers["Content-Type"] = data.bodyMediaType;
      body = adapter?.generateExample(data, { lang: "python" });
      if (body) params.push("data = body");
    }

    for (const [k, v] of Object.entries(data.header)) headers[k] = v.value;
    if (Object.keys(headers).length > 0)
      params.push(`headers = ${generatePythonObject(headers, imports)}`);

    const inputCookies = Object.entries(data.cookie);
    if (inputCookies.length > 0) {
      const cookies: Record<string, string> = {};
      for (const [k, v] of inputCookies) cookies[k] = v.value;
      params.push(`cookies = ${generatePythonObject(cookies, imports)}`);
    }

    return `${Array.from(imports)
      .map((name) => "import " + name)
      .join("\n")}

url = ${doubleQuote(data.url)}
${body ?? ""}
response = requests.request(${params.join(", ")})

print(response.text)`;
  },
};

const generators: { id: string; generator: CodeGenerator }[] = [
  { id: "curl", generator: curlGenerator },
  { id: "python", generator: pythonGenerator },
];

export const buildGeneratedSamples = (data: RequestDataWithUrl): InlineCodeUsageGenerator[] =>
  generators.map(({ id, generator }) => ({
    id,
    lang: generator.lang,
    label: generator.label,
    source: generator.generate(data, { mediaAdapters, custom: undefined }),
  }));
