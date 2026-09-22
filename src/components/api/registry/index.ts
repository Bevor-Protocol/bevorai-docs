import type { ParsedSchema } from "@fumadocs/api-docs/schema";
import type { HttpMethods, OperationObject, ParameterObject } from "fumadocs-openapi";
import type { InlineCodeUsageGenerator } from "fumadocs-openapi/requests/generators";
import type { Doc } from "@/hooks/use-doc";
import {
  type EncodedParameter,
  type EncodedParameterMultiple,
  type MediaAdapter,
  type RequestDataWithUrl,
} from "./adapters";
import { curlGenerator } from "./curl";
import type { CodeGenerator } from "./generators";
import { generatePythonObject, pythonGenerator } from "./python";

export const synthesizeExample = (raw: ParsedSchema, doc: Doc): unknown => {
  const schema = doc.resolve(raw);
  if (typeof schema !== "object" || schema === null) return undefined;
  if (schema.example !== undefined) return schema.example;
  if (schema.enum && schema.enum.length > 0) return schema.enum[0];
  if (schema.default !== undefined) return schema.default;

  if (schema.allOf) {
    return schema.allOf.reduce((acc: Record<string, unknown>, sub: any) => {
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

export const mediaAdapters: Record<string, MediaAdapter> = {
  "application/json": {
    generateExample: (data) => `body = ${generatePythonObject(data.body, new Set())}\n`,
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
