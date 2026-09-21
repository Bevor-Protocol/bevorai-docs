import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { openapi } from "@/lib/openapi";

type Unknown = Record<string, unknown>;

const isObject = (value: unknown): value is Unknown =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const pointerToPath = (pointer: string) =>
  pointer
    .slice(2)
    .split("/")
    .map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"));

const dereference = (document: Unknown, value: unknown, stack: string[]): unknown => {
  if (Array.isArray(value)) return value.map((item) => dereference(document, item, stack));
  if (!isObject(value)) return value;

  const ref = value.$ref;
  if (typeof ref === "string" && ref.startsWith("#/")) {
    if (stack.includes(ref)) return { description: ref };

    let target: unknown = document;
    for (const segment of pointerToPath(ref)) {
      target = isObject(target) ? target[segment] : undefined;
    }

    return dereference(document, target, [...stack, ref]);
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, dereference(document, item, stack)]),
  );
};

export const getOpenAPISchema = createServerFn({ method: "GET" })
  .validator((name: string) => name)
  .handler(async ({ data: name }) => {
    const { bundled } = await openapi.getSchema("bevor");
    const document = bundled as unknown as Unknown;
    const schemas = (document.components as Unknown | undefined)?.schemas;
    const schema = isObject(schemas) ? schemas[name] : undefined;

    if (!schema) throw notFound();
    return JSON.parse(JSON.stringify(dereference(document, schema, [])));
  });
